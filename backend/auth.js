/**
 * GlowMe Google OAuth — hand-rolled (no Passport/Express) so every step of the
 * "authorization code" flow is visible. Artists only.
 *
 *   GET  /api/auth/google           → redirect to Google's consent screen
 *   GET  /api/auth/google/callback  → Google returns ?code & ?state here; we
 *                                     exchange the code, fetch the profile,
 *                                     upsert the artist, and set a session cookie
 *   GET  /api/auth/me               → who is logged in? (the frontend asks this)
 *   POST /api/auth/logout           → clear the session cookie
 */
import crypto from 'crypto';
import { upsertArtistFromGoogle, getArtistById } from './db.js';
import {
  sessionCookieHeader,
  clearSessionCookieHeader,
  readSessionFromRequest,
} from './session.js';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

const STATE_COOKIE = 'glowme_oauth_state';

export function googleConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readCookie(req, name) {
  const header = req.headers?.cookie;
  if (!header) return null;
  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

/** GET /api/auth/google — kick off the flow. */
export function handleGoogleStart(req, res) {
  if (!googleConfigured()) {
    return sendJson(res, 503, {
      error: 'Google sign-in is not configured. Set GOOGLE_* in backend/.env',
    });
  }

  // CSRF defence: a random value Google must echo back. We stash it in a
  // short-lived cookie and compare on the callback. Without this, an attacker
  // could trick a victim's browser into completing a login the attacker started.
  const state = crypto.randomBytes(16).toString('hex');
  const stateCookie = `${STATE_COOKIE}=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });

  res.writeHead(302, {
    Location: `${GOOGLE_AUTH_URL}?${params}`,
    'Set-Cookie': stateCookie,
  });
  res.end();
}

/** GET /api/auth/google/callback — Google sends the user back here. */
export async function handleGoogleCallback(req, res, url) {
  const clearState = `${STATE_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;

  if (!googleConfigured()) {
    return sendJson(res, 503, { error: 'Google sign-in is not configured.' });
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = readCookie(req, STATE_COOKIE);

  // Reject if the CSRF state is missing or doesn't match what we issued.
  if (!code || !state || !expectedState || state !== expectedState) {
    res.writeHead(302, { Location: '/?auth=error', 'Set-Cookie': clearState });
    return res.end();
  }

  try {
    // 1) Exchange the one-time code for tokens (back-channel: our server → Google,
    //    carrying the client secret, which never touches the browser).
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) throw new Error(`token exchange ${tokenRes.status}`);
    const { access_token } = await tokenRes.json();
    if (!access_token) throw new Error('no access_token in token response');

    // 2) Use the access token to read the artist's basic profile.
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) throw new Error(`userinfo ${profileRes.status}`);
    const profile = await profileRes.json();
    if (!profile.sub || !profile.email) throw new Error('incomplete profile');

    // 3) Record the artist (insert on first login, refresh on return) and
    //    start a session.
    const artist = await upsertArtistFromGoogle({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    });

    res.writeHead(302, {
      Location: '/?auth=success',
      // Two cookies: clear the one-time state, set the session.
      'Set-Cookie': [clearState, sessionCookieHeader(artist.id)],
    });
    res.end();
  } catch (err) {
    console.error('Google OAuth callback failed:', err.message);
    res.writeHead(302, { Location: '/?auth=error', 'Set-Cookie': clearState });
    res.end();
  }
}

/** GET /api/auth/me — the frontend calls this on load to learn the login state. */
export function handleMe(req, res) {
  const session = readSessionFromRequest(req);
  if (!session) return sendJson(res, 200, { artist: null });

  const artist = getArtistById(session.artistId);
  if (!artist) return sendJson(res, 200, { artist: null });

  // Return only what the UI needs — never the whole DB row.
  sendJson(res, 200, {
    artist: {
      id: artist.id,
      name: artist.name,
      email: artist.email,
      picture: artist.picture,
    },
  });
}

/** POST /api/auth/logout — clear the session cookie. */
export function handleLogout(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Set-Cookie': clearSessionCookieHeader(),
  });
  res.end(JSON.stringify({ ok: true }));
}

/**
 * Guard for protected routes. Returns the signed-in artist, or sends a 401 and
 * returns null. Usage: `const artist = requireAuth(req, res); if (!artist) return;`
 */
export function requireAuth(req, res) {
  const session = readSessionFromRequest(req);
  const artist = session ? getArtistById(session.artistId) : null;
  if (!artist) {
    sendJson(res, 401, { error: 'Not signed in' });
    return null;
  }
  return artist;
}
