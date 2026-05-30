/**
 * Artist self-service: manage your own listing (kind='artist' only for v1).
 *   GET  /api/my/listing   → the signed-in artist's listing, or null
 *   POST /api/my/listing   → create/update it (validated)
 *
 * Authorization: the owner is ALWAYS the session artist's id (never read from
 * the request body), so an artist can only ever write their own listing.
 */
import { requireAuth } from './auth.js';
import { getListingByOwner, upsertOwnerListing } from './db.js';

const DEFAULT_ARTIST_IMAGE =
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop&crop=face';

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readJsonBody(req, limitBytes = 16_384) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('BODY_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

/** Title-case a city so "mohali" / "MOHALI" / "Mohali" don't fragment the filter. */
function normalizeCity(s) {
  return String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Validate + normalize listing form input. Returns {ok, data} or {ok:false, error}. */
function validateListingInput(body) {
  const name = String(body.name ?? '').trim();
  const city = normalizeCity(body.city);
  const area = String(body.area ?? '').trim();
  const priceFrom = Number(body.priceFrom);
  const image = String(body.image ?? '').trim();
  const bookService = String(body.bookService ?? '').trim();
  let tags = Array.isArray(body.tags) ? body.tags : String(body.tags ?? '').split(',');
  tags = tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 5);

  if (name.length < 2 || name.length > 60) return { ok: false, error: 'Name must be 2–60 characters.' };
  if (city.length < 2 || city.length > 40) return { ok: false, error: 'City must be 2–40 characters.' };
  if (area.length > 40) return { ok: false, error: 'Area is too long (max 40 characters).' };
  if (!Number.isFinite(priceFrom) || priceFrom < 100 || priceFrom > 1_000_000)
    return { ok: false, error: 'Starting price must be between ₹100 and ₹10,00,000.' };
  if (tags.some((t) => t.length > 20)) return { ok: false, error: 'Each tag must be 20 characters or fewer.' };
  if (image && !/^https?:\/\/.+/i.test(image)) return { ok: false, error: 'Image must be a valid http(s) URL.' };
  if (image.length > 500) return { ok: false, error: 'Image URL is too long.' };

  return {
    ok: true,
    data: {
      kind: 'artist',
      name,
      city,
      area: area || null,
      priceFrom: Math.round(priceFrom),
      image: image || DEFAULT_ARTIST_IMAGE,
      bookService: bookService || tags[0] || 'Makeup',
      details: { tags },
    },
  };
}

export function handleGetMyListing(req, res) {
  const artist = requireAuth(req, res);
  if (!artist) return;
  sendJson(res, 200, { listing: getListingByOwner(artist.id) });
}

export async function handleSaveMyListing(req, res) {
  const artist = requireAuth(req, res);
  if (!artist) return;

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    const tooLarge = err.message === 'BODY_TOO_LARGE';
    sendJson(res, tooLarge ? 413 : 400, { error: tooLarge ? 'Request body too large' : 'Invalid JSON body' });
    return;
  }

  const v = validateListingInput(body);
  if (!v.ok) {
    sendJson(res, 400, { error: v.error });
    return;
  }

  // Owner comes from the session, not the body — an artist can only write their own.
  sendJson(res, 200, { listing: upsertOwnerListing(artist.id, v.data) });
}
