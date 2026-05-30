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

export default db;
