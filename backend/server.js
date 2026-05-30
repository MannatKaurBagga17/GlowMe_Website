/**
 * GlowMe dev server
 * - Serves frontend/
 * - GET  /api/health
 * - POST /api/orders           (Razorpay test order for booking deposit)
 * - POST /api/payments/verify  (HMAC signature check after Checkout)
 */
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Razorpay from 'razorpay';
import { computeBookingDeposit } from './pricing.js';
import { verifyPaymentSignature } from './verifyPayment.js';
import {
  googleConfigured,
  handleGoogleStart,
  handleGoogleCallback,
  handleMe,
  handleLogout,
} from './auth.js';
import db, { getListings, getListingCities } from './db.js';
import { handleGetMyListing, handleSaveMyListing } from './myListing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, '..', 'frontend');
const PORT = Number(process.env.PORT) || 3000;

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

function razorpayConfigured() {
  return (
    KEY_ID &&
    KEY_SECRET &&
    !KEY_ID.includes('REPLACE') &&
    !KEY_SECRET.includes('REPLACE')
  );
}

const razorpay = razorpayConfigured()
  ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
  : null;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function isPathInsideRoot(resolvedPath, root) {
  const rel = path.relative(root, resolvedPath);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
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
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

function pickString(obj, key) {
  const v = obj?.[key];
  if (typeof v !== 'string') return '';
  return v.trim();
}

async function handleCreateOrder(req, res) {
  if (!razorpay) {
    sendJson(res, 503, {
      error: 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env',
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    if (err.message === 'BODY_TOO_LARGE') {
      sendJson(res, 413, { error: 'Request body too large' });
      return;
    }
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const artist = pickString(body, 'artist');
  const service = pickString(body, 'service');
  const date = pickString(body, 'date');
  const time = pickString(body, 'time');

  if (!artist || !service || !date || !time) {
    sendJson(res, 400, {
      error: 'Missing required fields: artist, service, date, time',
    });
    return;
  }

  const { priceInr, depositInr, depositPaise } = computeBookingDeposit(service);

  try {
    const order = await razorpay.orders.create({
      amount: depositPaise,
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
      notes: { artist, service, date, time, price_inr: String(priceInr) },
    });

    sendJson(res, 200, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID,
      depositInr,
      priceInr,
    });
  } catch (err) {
    console.error('Razorpay orders.create failed:', err.error || err.message || err);
    const description = err.error?.description || err.message || 'Failed to create order';
    sendJson(res, 502, { error: description });
  }
}

async function handleVerifyPayment(req, res) {
  if (!razorpayConfigured()) {
    sendJson(res, 503, {
      error: 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env',
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    if (err.message === 'BODY_TOO_LARGE') {
      sendJson(res, 413, { error: 'Request body too large' });
      return;
    }
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const orderId = pickString(body, 'razorpay_order_id');
  const paymentId = pickString(body, 'razorpay_payment_id');
  const signature = pickString(body, 'razorpay_signature');

  if (!orderId || !paymentId || !signature) {
    sendJson(res, 400, {
      error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
    });
    return;
  }

  const valid = verifyPaymentSignature(orderId, paymentId, signature, KEY_SECRET);

  if (!valid) {
    sendJson(res, 400, { ok: false, error: 'Invalid payment signature' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    orderId,
    paymentId,
  });
}

const LISTING_KINDS = ['artist', 'salon', 'nail'];

function handleGetListings(req, res, url) {
  const city = url.searchParams.get('city') || undefined;
  const kind = url.searchParams.get('kind') || undefined;

  if (kind && !LISTING_KINDS.includes(kind)) {
    sendJson(res, 400, { error: `Invalid kind. Use one of: ${LISTING_KINDS.join(', ')}` });
    return;
  }

  try {
    // `cities` is always the full set (so the picker is stable regardless of
    // the current filter); `listings` is the filtered result.
    sendJson(res, 200, { cities: getListingCities(), listings: getListings({ city, kind }) });
  } catch (err) {
    console.error('GET /api/listings failed:', err.message);
    sendJson(res, 500, { error: 'Failed to load listings' });
  }
}

async function serveStatic(pathname, res) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const resolved = path.resolve(FRONTEND_ROOT, '.' + safePath);

  if (!isPathInsideRoot(resolved, FRONTEND_ROOT)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  try {
    const data = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }
    console.error(err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { ok: true, razorpay: razorpayConfigured() });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/listings') {
    handleGetListings(req, res, url);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/orders') {
    await handleCreateOrder(req, res);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/payments/verify') {
    await handleVerifyPayment(req, res);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/google') {
    handleGoogleStart(req, res);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/google/callback') {
    await handleGoogleCallback(req, res, url);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/me') {
    handleMe(req, res);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    handleLogout(req, res);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/my/listing') {
    handleGetMyListing(req, res);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/my/listing') {
    await handleSaveMyListing(req, res);
    return;
  }

  if (req.method === 'GET') {
    await serveStatic(pathname, res);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`GlowMe dev server → http://localhost:${PORT}`);
  console.log(`Health check    → http://localhost:${PORT}/api/health`);
  if (!razorpayConfigured()) {
    console.warn('⚠ Razorpay keys missing or still placeholders — payment API routes will return 503');
  }
  if (!googleConfigured()) {
    console.warn('⚠ Google OAuth not configured — sign-in routes will return 503');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in backend/.env`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

// Graceful shutdown: stop accepting connections, close the SQLite handle, then
// exit. Now that we hold a DB handle, this lets Node tear down cleanly on Ctrl+C.
// Dev server: on Ctrl+C, release the SQLite handle and exit. We don't bother
// draining in-flight requests (unnecessary in development), which keeps this
// simple and avoids hanging on keep-alive sockets.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    db.close();
    process.exit(0);
  });
}
