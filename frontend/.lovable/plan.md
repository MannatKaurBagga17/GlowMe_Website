# Glow Platform – Production Hardening Plan

This request bundles ~7 large workstreams. I want to confirm scope and sequencing before writing code, because several items require credentials from you and architectural decisions that will affect the rest of the platform.

## 1. Investigation pass (no code)
- Map current auth: `src/lib/auth-context.tsx`, `src/routes/auth.tsx`, `src/routes/artist.auth.tsx`, `_authenticated/route.tsx`, `site-header.tsx`.
- Map current booking/payment/review flow: `_customer/booking.*`, `artist.$slug.tsx`, `public-reviews.functions.ts`, `_artist/reviews.tsx`.
- Map landing content where "Where beauty meets artistry" and "Our Compass / Mission. Vision. Values." live (likely `routes/index.tsx`).
- Identify Lovable-managed pieces currently in use (Cloud auth UI, Lovable Emails, any built-in payment widgets) so we know what to replace.

Deliverable: a short written summary back to you before step 2 starts.

## 2. Google Authentication (Customer + Artist)
- Use Supabase (Lovable Cloud) Google OAuth provider — this is the supported path; building a raw Google OAuth client from scratch is not recommended and would duplicate Supabase session handling.
- Two entry points kept separate: `/auth` (customer) and `/artist/auth` (artist). Role assignment via `user_roles` table + `has_role()` (already in stack guidelines).
- Session persistence via existing `onAuthStateChange` + `getSession` on boot.
- Post-login redirect: customers → `/me`, artists → `/dashboard`. Handle `?redirect=` param.
- Remove white-screen by gating `_authenticated` only after session hydration completes.

## 3. Profile avatar + dropdown in `site-header`
- Circular avatar (first letter of name/email), gold ring, black bg, premium styling.
- Small mail glyph badge.
- shadcn `DropdownMenu`: Name, Email, Profile, My Bookings, Settings, Logout.
- Responsive (mobile: avatar in header right; dropdown becomes sheet on <640px).

## 4. Landing copy edits
- Replace hero "Where beauty meets artistry." → "Mission. Vision. Values."
- Delete the entire "Our Compass / Mission. Vision. Values." section (the three cards).

## 5. Reviews submit fix
- Audit `public-reviews.functions.ts` submit path + the customer review form. Fix auth/validation so submit posts cleanly and the new review appears in the artist's review list immediately (optimistic update + `queryClient.invalidateQueries`).

## 6. Items that need your decisions/credentials before I build

These are the parts I cannot ship "production-ready" without input from you. I'll scaffold dedicated pages and backend server functions, but the live integrations need real keys.

a. **Payments (Stripe direct, not Lovable Payments)**
   - Stripe supports Cards, Google Pay, Apple Pay, and India UPI natively via PaymentIntents + Payment Element. PhonePe and Paytm are **not** Stripe payment methods — they require Razorpay/Cashfree/PayU (Indian PSPs). Options:
     - (A) Stripe only → Cards + UPI + Google Pay + Apple Pay.
     - (B) Stripe + Razorpay → adds PhonePe, Paytm, full UPI intents.
   - Need: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, publishable key. (and Razorpay keys if B).

b. **Transactional email (booking confirmation)**
   - Options: Resend (simplest, connector available), SendGrid, or raw SMTP.
   - Recommend Resend with a verified domain. Need the domain you want to send from and `RESEND_API_KEY`.

c. **WhatsApp + SMS**
   - WhatsApp Business API requires Meta-approved templates and a BSP (Twilio, Gupshup, Interakt). SMS: Twilio (global) or MSG91/GatewayAPI (India cheaper).
   - Recommend Twilio for both to keep one vendor. Need `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, WhatsApp sender, SMS sender.

d. **CAPTCHA**
   - Google reCAPTCHA v3 (invisible) on both login forms, verified server-side before triggering Google OAuth redirect. Need site key + secret.

e. **Admin Integrations page**
   - `/admin/integrations` gated by `admin` role. Form to view/update each credential. Secrets stored via Lovable secret store (server-only env), never returned to client — UI shows "configured ✓ / not set" + "rotate" action. Will require seeding an admin role for you.

## 7. Sequencing

I propose shipping in this order so the app stays usable throughout:

1. Investigation summary (read-only).
2. Landing copy edits + reviews submit fix (no creds needed).
3. Google OAuth + avatar/dropdown + session hardening.
4. Admin Integrations page shell + secret plumbing.
5. Stripe payment page + booking→payment→confirmation flow.
6. Resend booking-confirmation email.
7. Twilio WhatsApp + SMS confirmations.
8. reCAPTCHA on both auth pages.
9. End-to-end verification pass.

## Questions before I start

1. **Payments scope**: Stripe only (A) or Stripe + Razorpay (B) for PhonePe/Paytm?
2. **Email**: OK with Resend + a domain you own? Which domain?
3. **WhatsApp/SMS**: Twilio for both, or do you already have Gupshup/MSG91?
4. **Admin user**: which email should I grant the `admin` role to so you can access `/admin/integrations`?
5. **Order of work**: ship in the sequence above, or do you want payments first?

Once you answer 1–5 (and we line up keys for the integrations), I'll execute the plan top-to-bottom. The non-credential items (landing copy, reviews fix, Google auth + avatar, admin page shell) I can start immediately after you approve.
