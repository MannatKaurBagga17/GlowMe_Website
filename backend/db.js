/**
 * GlowMe data layer — SQLite via Node's built-in `node:sqlite` (no external deps).
 *
 * One file-backed database (backend/glowme.db). This is the persistence layer
 * the assessment flagged as missing (C3). For now it stores artists who sign in
 * with Google; bookings/payments will get their own tables later.
 *
 * The module opens the DB and ensures the schema on import, so anything that
 * `import`s it can assume the tables exist.
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { LISTINGS_SEED } from './listings.seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, 'glowme.db');

const db = new DatabaseSync(DB_PATH);

// `google_id` is Google's stable subject id ("sub") — our source of identity.
// It's UNIQUE so the same Google account can never create two artist rows.
// Timestamps are stored as SQLite datetime strings (UTC) for simplicity.
db.exec(`
  CREATE TABLE IF NOT EXISTS artists (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id     TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL,
    name          TEXT,
    picture       TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Public catalog browsed/booked by customers. Deliberately separate from
// `artists` (which models Google login accounts) — a catalog listing has no
// account. When a logged-in artist later claims their listing, we'll add
// listings.owner_artist_id -> artists.id to join the two concepts.
db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    kind          TEXT    NOT NULL,            -- 'artist' | 'salon' | 'nail'
    name          TEXT    NOT NULL,
    city          TEXT    NOT NULL,
    area          TEXT,
    image_url     TEXT,
    rating        REAL,
    reviews_count INTEGER,
    price_from    INTEGER,
    available     INTEGER NOT NULL DEFAULT 0,  -- 0/1 ("Available today" badge)
    book_service  TEXT,                        -- service string for the booking modal
    details       TEXT,                         -- JSON: kind-specific extras
    owner_artist_id INTEGER REFERENCES artists(id) -- NULL for seed rows; set when an artist owns the listing
  );
`);

// Migration for databases created before owner_artist_id existed (the seed
// listings predate it). PRAGMA tells us the current columns; add if missing.
if (!db.prepare('PRAGMA table_info(listings)').all().some((c) => c.name === 'owner_artist_id')) {
  db.exec('ALTER TABLE listings ADD COLUMN owner_artist_id INTEGER REFERENCES artists(id)');
}
// One listing per artist. Partial index so the many NULL-owner seed rows are
// exempt while real owners stay unique.
db.exec(
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_artist_id) WHERE owner_artist_id IS NOT NULL'
);

function seedListingsIfEmpty() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM listings').get();
  if (n > 0) return; // already seeded — leave existing data untouched
  const insert = db.prepare(
    `INSERT INTO listings
       (kind, name, city, area, image_url, rating, reviews_count, price_from, available, book_service, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  // One atomic transaction for the bulk insert (fast, all-or-nothing).
  db.exec('BEGIN');
  try {
    for (const l of LISTINGS_SEED) {
      insert.run(
        l.kind, l.name, l.city, l.area ?? null, l.image ?? null,
        l.rating ?? null, l.reviews ?? null, l.priceFrom ?? null,
        l.available ? 1 : 0, l.bookService ?? null, JSON.stringify(l.details ?? {})
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

seedListingsIfEmpty();

/**
 * First login → INSERT. Returning artist → refresh profile + last_login_at.
 * This "upsert" means the callback route never has to check existence first.
 * Returns the full artist row.
 */
export function upsertArtistFromGoogle({ googleId, email, name, picture }) {
  db.prepare(
    `INSERT INTO artists (google_id, email, name, picture)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(google_id) DO UPDATE SET
       email         = excluded.email,
       name          = excluded.name,
       picture       = excluded.picture,
       last_login_at = datetime('now')`
  ).run(googleId, email, name ?? null, picture ?? null);

  return getArtistByGoogleId(googleId);
}

export function getArtistByGoogleId(googleId) {
  return db.prepare('SELECT * FROM artists WHERE google_id = ?').get(googleId);
}

export function getArtistById(id) {
  return db.prepare('SELECT * FROM artists WHERE id = ?').get(id);
}

/** List catalog entries, optionally filtered by city and/or kind. */
export function getListings({ city, kind } = {}) {
  const where = [];
  const args = [];
  if (city && city.toLowerCase() !== 'all') {
    where.push('city = ?');
    args.push(city);
  }
  if (kind) {
    where.push('kind = ?');
    args.push(kind);
  }
  const sql =
    'SELECT * FROM listings' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY available DESC, rating DESC, id ASC';
  return db.prepare(sql).all(...args).map(rowToListing);
}

/** Distinct cities present in the catalog — feeds the location picker. */
export function getListingCities() {
  return db.prepare('SELECT DISTINCT city FROM listings ORDER BY city').all().map((r) => r.city);
}

function rowToListing(r) {
  return {
    id: r.id,
    kind: r.kind,
    name: r.name,
    city: r.city,
    area: r.area,
    image: r.image_url,
    rating: r.rating,
    reviews: r.reviews_count,
    priceFrom: r.price_from,
    available: !!r.available,
    bookService: r.book_service,
    details: r.details ? JSON.parse(r.details) : {},
    ownerArtistId: r.owner_artist_id ?? null,
  };
}

/** The listing owned by a given artist account, or null. */
export function getListingByOwner(ownerArtistId) {
  const row = db.prepare('SELECT * FROM listings WHERE owner_artist_id = ?').get(ownerArtistId);
  return row ? rowToListing(row) : null;
}

/**
 * Create or update the listing owned by an artist (one per artist).
 * New listings start with no rating/reviews and available = 0.
 */
export function upsertOwnerListing(ownerArtistId, data) {
  const detailsJson = JSON.stringify(data.details ?? {});
  const existing = db.prepare('SELECT id FROM listings WHERE owner_artist_id = ?').get(ownerArtistId);

  if (existing) {
    db.prepare(
      `UPDATE listings
         SET kind = ?, name = ?, city = ?, area = ?, image_url = ?,
             price_from = ?, book_service = ?, details = ?
       WHERE id = ?`
    ).run(
      data.kind, data.name, data.city, data.area ?? null, data.image ?? null,
      data.priceFrom ?? null, data.bookService ?? null, detailsJson, existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO listings
         (kind, name, city, area, image_url, rating, reviews_count, price_from, available, book_service, details, owner_artist_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      data.kind, data.name, data.city, data.area ?? null, data.image ?? null,
      null, null, data.priceFrom ?? null, 0, data.bookService ?? null, detailsJson, ownerArtistId
    );
  }
  return getListingByOwner(ownerArtistId);
}

export default db;
