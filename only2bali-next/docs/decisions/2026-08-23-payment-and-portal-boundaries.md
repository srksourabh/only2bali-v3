# Payment and portal boundaries

Razorpay readiness is now fail-closed: an API key pair can be installed without exposing secrets, but live order creation remains paused until a separate 32-character-or-longer webhook secret is configured. URLs and the documented placeholder are rejected as webhook secrets, while checkout verification remains available for recovery of any previously opened order. The traveller portal remains `/[lang]/account` and owns trip, booking, saved-item and payment views; the vendor portal remains `/[lang]/provider` and owns profile, catalogue, booking operations, media, promotions and payout details. Page routing and API role checks both enforce that separation so hiding a menu is never treated as authorization.

The vendor request board compares `bids_close_at` through Drizzle's typed `gt()` operator rather than interpolating a JavaScript `Date` into raw SQL. This preserves the column timestamp encoder and prevents a runtime serialization failure in the provider dashboard.

## Razorpay connectivity (2026-08-24)

What the app already does: `POST /api/payments/checkout` creates a Razorpay order in paise; Checkout.js verify at `POST /api/payments/verify` (HMAC of `order_id|payment_id` with `RAZORPAY_KEY_SECRET`); webhook at `POST /api/payments/webhook` (HMAC of raw body with `RAZORPAY_WEBHOOK_SECRET`); both paths confirm the booking and convert the 15-minute seat/date hold. Health reports `payments.razorpay.*`.

Env vars (Vercel Production + Preview, never client-side except nothing here is `NEXT_PUBLIC_`):

- `RAZORPAY_KEY_ID` — `rzp_live_…` or `rzp_test_…`
- `RAZORPAY_KEY_SECRET` — API secret
- `RAZORPAY_WEBHOOK_SECRET` — separate 32+ character dashboard secret, not the API secret and not a URL

If those three are already on Vercel and health shows `acceptingPayments` / `webhookConfigured` true, do not rotate keys. Still owed in the Razorpay dashboard: webhook URL `https://only2bali.vercel.app/api/payments/webhook` with events `payment.captured`, `payment.authorized`, `payment.failed`, secret pasted to match Vercel exactly. Test-mode keys (`rzp_test_`) never settle live money; live keys (`rzp_live_`) do — do not complete a live charge to “try it”.

## Stripe + platform fee (2026-08-24)

Traveller checkout always shows Stripe and Razorpay. Missing keys disable that button with a reason; the two-choice layout stays. Stripe Checkout Session → `POST /api/payments/webhook/stripe`. Traveller pays Only2Bali; vendor net is ledger-only (`booking.commissionAmount` / `netAmount`). Stripe Connect / Razorpay Route / PA-CB is not built.

Platform default fee is 10% (`platform_setting.platform_fee_rate` = `0.1000`), editable from Admin → Platform fee %. Vendor `commissionRate` still overrides on listing and offer bookings.
