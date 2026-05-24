# GlowMe — Beauty marketplace (dev setup)

Static marketing/booking UI in `frontend/`. Payment API will live in `backend/` (Razorpay test mode).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ recommended (uses `--env-file` for secrets)
- Razorpay account with **Test mode** API keys

## Project layout

```
glowme_code_marketplace/
  frontend/          # index.html, style.css, script.js
  backend/           # Node API (step 2.2+)
    .env.example     # template — copy to .env
    package.json
  .gitignore
```

## Step 2.1 — Backend dependencies

```bash
cd backend
copy .env.example .env    # Windows CMD
# or: cp .env.example .env   # Git Bash / macOS / Linux
```

Edit `backend/.env` with your test **Key ID** and **Key Secret** (local only; do not commit).

```bash
npm install
```

## Step 2.2 — Dev server

From `backend/`:

```bash
npm run dev
```

Check:

- http://localhost:3000 — GlowMe homepage
- http://localhost:3000/api/health — `{"ok":true}`

Stop with `Ctrl+C`. Do not open `index.html` as a `file://` URL (breaks future `fetch('/api/...')`).

## Step 2.3 — Create Razorpay order (API only)

With `npm run dev` running and real test keys in `backend/.env`:

**PowerShell:**

```powershell
$body = @{
  artist  = "Priya Mehta"
  service = "Bridal makeup"
  date    = "15 June 2026"
  time    = "10:30 AM"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method POST -ContentType "application/json" -Body $body
```

**Expected success** (amount in paise, e.g. 30% of ₹2,160 deposit → `64800`):

```json
{
  "orderId": "order_...",
  "amount": 64800,
  "currency": "INR",
  "keyId": "rzp_test_...",
  "depositInr": 660,
  "priceInr": 2160
}
```

`GET /api/health` now includes `"razorpay": true` when keys are configured.

## Step 2.4 — Verify payment signature

After Razorpay Checkout succeeds, the browser gets `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The server must verify the signature before treating the booking as paid.

**Endpoint:** `POST /api/payments/verify`

```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

**Success (200):** `{ "ok": true, "orderId": "...", "paymentId": "..." }`  
**Invalid signature (400):** `{ "ok": false, "error": "Invalid payment signature" }`

## Step 2.5 — End-to-end booking payment (UI)

With `npm run dev` running and test keys in `backend/.env`:

1. Open http://localhost:3000
2. Click **Calendar** on any artist → select service, date, time
3. Click **Confirm and pay 50% deposit**
4. Razorpay test checkout opens (use test card from [Razorpay docs](https://razorpay.com/docs/payments/payments/test-card-upi-details/))
5. After pay: server verifies signature → success toast → WhatsApp opens

Flow: `POST /api/orders` → Checkout (`order_id` + `keyId`) → `POST /api/payments/verify` → confirm UI.

**Note:** Artist listing fee (`payArtistFee`) is not wired to the server yet — booking deposit only.

## Razorpay

- **Key ID** (`rzp_test_...`) — public; used by Checkout in the browser later
- **Key Secret** — server only, in `backend/.env`
