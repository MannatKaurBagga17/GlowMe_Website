/**
 * GlowMe session layer — stateless, HMAC-signed session cookies.
 *
 * Design choice: the cookie *is* the session. We sign a tiny payload
 * { aid, exp } with SESSION_SECRET (HMAC-SHA256) — the same primitive that
 * verifies Razorpay signatures (see verifyPayment.js). Nothing is stored
 * server-side, so there's no session table to manage.
 *
 * Tradeoff (deliberate): we can't revoke a single session before it expires,
 * because there's no server record to delete. Acceptable for an artist-login
 * MVP. If we later need forced logout / "log out everywhere", we add a
 * sessions table or a per-artist token version and check it here.
 */
import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET;
const COOKIE_NAME = 'glowme_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const IS_PROD = process.env.NODE_ENV === 'production';

function sign(payloadB64) {
  return crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
}

/** Build a signed token for an artist id. */
export function createSessionToken(artistId) {
  if (!SECRET) throw new Error('SESSION_SECRET is not set in the environment');
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payloadB64 = Buffer.from(JSON.stringify({ aid: artistId, exp })).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** Verify a token; return { artistId } if valid and unexpired, else null. */
export function verifySessionToken(token) {
  if (!SECRET || !token || typeof token !== 'string') return null;

  const dot = token.indexOf('.');
  if (dot === -1) return null;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payloadB64);

  // Constant-time compare — same reasoning as the payment signature check.
  // timingSafeEqual throws if the buffers differ in length, so guard with try.
  let ok = false;
  try {
    ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return null;
  }
  if (!ok) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!payload || typeof payload.aid === 'undefined' || typeof payload.exp !== 'number') return null;
  if (Date.now() > payload.exp) return null; // expired

  return { artistId: payload.aid };
}

/** Set-Cookie value that stores the session after a successful login. */
export function sessionCookieHeader(artistId) {
  const parts = [
    `${COOKIE_NAME}=${createSessionToken(artistId)}`,
    'HttpOnly',          // JS can't read it → an XSS bug can't steal the session
    'Path=/',
    'SameSite=Lax',      // sent on top-level navigations (needed for the OAuth redirect back), blocks cross-site subrequests → CSRF mitigation
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (IS_PROD) parts.push('Secure'); // HTTPS-only in prod; omitted in dev so the cookie works on http://localhost
  return parts.join('; ');
}

/** Set-Cookie value that clears the session (logout). */
export function clearSessionCookieHeader() {
  const parts = [`${COOKIE_NAME}=`, 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0'];
  if (IS_PROD) parts.push('Secure');
  return parts.join('; ');
}

/** Read + verify our session cookie from an incoming request. Returns { artistId } or null. */
export function readSessionFromRequest(req) {
  const header = req.headers?.cookie;
  if (!header) return null;
  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  return verifySessionToken(match.slice(COOKIE_NAME.length + 1));
}
