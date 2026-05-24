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

## Razorpay

- **Key ID** (`rzp_test_...`) — public; used by Checkout in the browser later
- **Key Secret** — server only, in `backend/.env`
