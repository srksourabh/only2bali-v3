# Progress - Only2Bali v3.0

> **Historical tracker:** for the verified 23 August 2026 folder, GitHub and
> deployment status, read
> [`consolidation-audit-2026-08-23.md`](consolidation-audit-2026-08-23.md).

> Task and milestone tracker. Updated whenever work completes or blockers arise.
> AI agents: read this at session start to know where work left off.
>
> This tracks the **real project**, not a greenfield build. The product is already live.

## Tester QA batch (2026-08-24)

Shipped: commit `4f090f6` on `feat/schema-status-health`, production deploy
`dpl_6LPp5Dy9iB2aUbFipp6zFKdWCZpD` (https://only2bali.vercel.app).

Re-verified live 2026-08-24 on https://only2bali.vercel.app (browser + HTTP).
No remaining code gaps from that tester batch.

- [x] Login regex error on signup and wrong password
- [x] Google/Clerk already-signed-in loop (Continue / switch account)
- [x] Dates shown as dd-mm-yyyy
- [x] View itinerary 404 on home/packages fallback slugs
- [x] Services/providers destination chips filter in-memory; empty Neon uses fallback listings
- [x] Trip quality goes to `/food`; nav underline only on the active `li`
- [x] Shared layout no longer blocks on session DB; catalogue circuit-breaker after outage

Still owner: seed Neon with real marketplace rows; click through Google OAuth
with a real Google account; paste Razorpay webhook; optional Stripe keys.

## Neon is the database of record (2026-08-24)

Production Next.js uses **Neon only** (Vercel integration `o2b_*` vars,
project `neon-apricot-marble` / branch `main`). `DATABASE_URL` was switched
from Hostinger+mTLS to the Neon pooled URL. Runtime ignores leftover PEMs.
`PGSSL_*` removed from Vercel production.

Live after deploy `dpl_4eLochjLYpxhDYogyVgRQonL3ce5` + schema catch-up:
`GET /api/health` — `database: connected`, schema **7/7**, `current` true,
`authReady` true. Neon had no marketplace tables before catch-up; listings and
the previous e2e vendor/traveller rows stayed on Hostinger and are not here.

## Landing photos + group names (2026-08-24)

- Home, food and services no longer reuse one food plate: cook, class, thali, villa,
  beach and adventure each have their own photograph.
- Booking / inquiry for a group (e.g. 8 pax) needs only the lead name. Extra
  traveller names stay optional until later.

## Marketplace portal (2026-08-24)

Verified live at https://only2bali.vercel.app after CLI production deploy
`dpl_69EuQELJen6gEim1joz7AyLfM4M4`:

- `/api/health` — database connected, **schema applied 6/6**, `current` true,
  `authReady` true, `catalogueColumns` true, clerk true
- First health hit after deploy applied 0003–0005 (`skipped: false`, 34s)
- `/en/login`, `/en/services`, `/en/vendors` — HTTP 200; services list live
  listings (Jain cook, villa, thali, transport)
- otpDelivery still `none`
- `RAZORPAY_WEBHOOK_SECRET` was the documented placeholder; replaced on
  Vercel and redeployed. Owner must paste the same value into the Razorpay
  dashboard webhook for `https://only2bali.vercel.app/api/payments/webhook`

This session closed remaining **code** gaps and the production schema lag:

- Admin approve of a vendor application now creates or promotes a vendor account
- Providers can edit listings; `/services` filters by type and food protocol
- Mobile verify API + account UI; provider messaging; OTP hidden for vendor/admin
- `GET /api/health` catch-up + `POST /api/ops/migrate` (token-gated)
- Vitest migrate helper 5/5; `tsc --noEmit` passed

Live health after webhook replace: `acceptingPayments` **true**,
`webhookConfigured` true. Checkout can open.

## Payments: Stripe option + configurable 10% fee (2026-08-24)

- Checkout always offers **Stripe** and **Razorpay**. Missing keys show the
  option as unavailable; the two-choice layout stays.
- Platform default fee is **10%**, stored in `platform_setting` (migration 0006)
  and editable from Admin → Platform fee %. Vendor `commissionRate` still
  overrides listing/offer bookings.
- Stripe Checkout Session + `/api/payments/webhook/stripe`. Ledger split only;
  no Stripe Connect payouts.

Still blocked on production (owner):

- Paste Vercel `RAZORPAY_WEBHOOK_SECRET` into the Razorpay dashboard webhook
  (URL `https://only2bali.vercel.app/api/payments/webhook`, events
  `payment.captured`, `payment.authorized`, `payment.failed`) so captured
  payments confirm if the browser closes
- Optional: add `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET` and point Stripe at
  `https://only2bali.vercel.app/api/payments/webhook/stripe`
- Set `RESEND_API_KEY` or `SPRINGEDGE_API_KEY` if you want OTP (password/Clerk work now)
- [x] Commit and push the working tree (`5514d04` on `feat/schema-status-health`);
      production is `dpl_CL19V7Hgp2setxjPKi4GLz56vXgM`. `main` still lacks this commit.
- Re-seed or recreate marketplace listings on Neon (schema is empty of product
  rows after the Hostinger → Neon cutover)

Verified locally earlier: `npm run test:e2e` **134 passed**.

## Status overview

> Status overview last verified **2026-07-23** by running the build, the tests and the
> end-to-end suite, not by reading the previous version of this table.

| Area | Status | Note |
|---|---|---|
| Django API | **Live**, being retired | Azure App Service. Accounts, OTP, journey wizard. Zoho removed 2026-07-23. |
| React site | **Live**, legacy | Now has a 404 route. Four routes still call the deleted FastAPI service. |
| Next.js site | **Live** | Accounts, OTP login, sessions, catalogue, package pages, lead capture, booking. |
| Postgres (VPS) | **Live** | `o2b-postgres`, own container, port 5433, mTLS. 45 tables, migrations 0000-0002 applied, catalogue + demo marketplace data seeded. |
| Booking flow | **Shipped with Razorpay path** | `POST /api/bookings` holds seats. Checkout, verify (HMAC), webhook (`payment_event`), and account Pay UI are wired for Razorpay. Needs live keys in Vercel. |
| FastAPI layer | **Deleted** | Removed 2026-07-22. Its chat widget removed from the CRA 2026-07-23. |
| Migration CRA → Next.js | **In progress** | Accounts and booking no longer block it. Live Razorpay credentials and Vercel handover still do. |
| Test coverage | 104 unit + 74 end-to-end + 41 database checks | All three run in CI. Razorpay signature helpers covered in Vitest. |
| Docs | Refreshed 2026-07-30 | |
| Build | **In progress** | Razorpay verify/webhook/pay UI shipped; production still needs keys + Vercel ownership. |

---

## Decision reserved (2026-07-16)

Full planning is complete (see `docs/planning/platform-plan.md`, `docs/planning/ideas.md`, `docs/planning/assumptions.md`,
`docs/planning/upgrade-plan-v1.md`, `docs/planning/task-breakdown.md`, `docs/planning/task-todo.md`) and UI/UX uplift
previews were produced (links in `docs/memory.md` session log). **No application code has been
changed.** Sourabh has **reserved the decision** on:
- adopting the shown UI direction,
- starting the build (Track V1 + Phase 0) vs continuing to plan,
- payment provider / commission / legal structure (Phase 5 only).

Do not begin implementation until Sourabh confirms. When he does, start with Track V1 and
Phase 0 Task 0.1 (delete-endpoint auth).

---

## Do this first

> Security. Everything else on this page can wait.

- [ ] **Revoke the Zoho credentials at Zoho.** The integration was deleted from the code
      on 2026-07-23, but the refresh token, client id, client secret and access token
      remain in git history and both repositories that held them were public. The refresh
      token does not expire on its own and reaches the CRM — customer data. **Only Sourabh
      can do this.** Deleting code revokes nothing.
- [ ] **Rotate the SpringEdge SMS API key** at the provider, for the same reason. It
      sends the login OTPs and is billable. **Only Sourabh can do this.**
- [x] Move secrets out of source — done; Zoho is gone entirely and SpringEdge reads
      `SPRINGEDGE_API_KEY` from the environment.
- [ ] **Fix the Django OTP flow.** `users/views.py` still generates 4-digit codes, caches
      them in plaintext, and compares with `!=`. The hardened `OTP` / `OTPAuditLog` /
      `RateLimitLog` models exist in `models.py` and are never imported. Lower priority
      than it was: the Next.js app has a correct implementation and is the destination.
- [x] Correct `docs/security-fixes-status.md` — rewritten 2026-07-22, extended 2026-07-23.

## Urgent

> Things that affect real customers right now.

- [x] **Placeholder contact details.** `lib/config.ts` now reads
      `NEXT_PUBLIC_WHATSAPP_NUMBER` / `NEXT_PUBLIC_CONTACT_EMAIL`, rejects the old
      placeholders, and hides the buttons when unset. Enquiries and vendor applications
      are written to Postgres before any external app is opened, so a lead no longer
      depends on the visitor completing a WhatsApp draft.
- [ ] **Paste the real contact values into Vercel.** Blocked on the item below.
- [ ] **Get production onto Sourabh's own Vercel.** `only2bali-v3-0.vercel.app` runs
      from caloganathan's Vercel account. Until it moves, he cannot set environment
      variables, enable login, or roll back his own production site. Step-by-step
      runbook: `docs/vercel-handover.md`. **This is the single blocking item.**
- [ ] **Configure an OTP provider** (`RESEND_API_KEY` or `SPRINGEDGE_API_KEY`). Until
      then `/api/auth/request-otp` answers 503 and `/api/health` reports
      `"otpDelivery": ["none"]`. Blocked on the Vercel move.
- [x] **404 route in the React app.** Added 2026-07-23 with `noindex`, so unmatched URLs
      no longer render a blank page that crawlers treat as real.
- [x] **The offline chat widget.** Removed 2026-07-23 along with its component; the
      FastAPI service it called was deleted on 2026-07-22.

## Infrastructure

- [x] Migrated to own private repo `srksourabh/only2bali-v3` (2026-07-16)
- [x] Full 229-commit history preserved
- [x] Inherited Azure workflows disabled - see ADR-003
- [ ] Vercel project on Sourabh's own account, linked to the private repo
      (Root Directory must be `only2bali-next`; blank builds the legacy CRA)
- [ ] `GEMINI_API_KEY` set in Vercel, or the planner silently serves mock itineraries
- [ ] Decide whether to keep using caloganathan's Azure backend or stand up own

## Decisions needed from Sourabh

> These are product calls, not engineering tasks. Nothing should be "cleaned up"
> until these are answered.

- [ ] **What happens to the FastAPI layer** (`Backend/app/`)?
      It is undeployed, has no auth, uses its own SQLite database, and duplicates
      both Django and the Next.js planner. Three options: wire it up and secure it,
      fold its ideas into Next.js, or delete it. Doing nothing leaves dead code that
      confuses every future session.
- [ ] **When does the React app get retired?**
      It cannot go until Next.js has accounts, OTP, vendor onboarding, and booking.
      Either build those in Next.js, or accept maintaining two frontends indefinitely.
- [ ] **Does the Next.js site need accounts at all?**
      Its current model is catalog + Gemini + WhatsApp lead. That may be sufficient
      for the business, in which case the React app and Django accounts serve a
      different (internal or returning-customer) purpose and both stay.

## Migration to Next.js

> The main architectural thread. See ADR-001.

Done:
- [x] Next.js 15 App Router scaffold, deployed to Vercel
- [x] Home, planner, about, faq, food, inquiry, vendors, privacy, terms
- [x] Typed package catalog (`lib/catalog.ts`) as single source of truth
- [x] Deterministic recommendation engine + Vitest tests (`lib/recommend.ts`)
- [x] Gemini itinerary planner with two-layer mock fallback
- [x] Legacy assets and custom cursor ported across

Not done - this is what blocks retiring the React app:
- [ ] User accounts
- [ ] OTP login (Twilio)
- [ ] Vendor onboarding flow
- [ ] Booking flow
- [ ] Zoho CRM integration (currently WhatsApp + mailto only)
- [ ] Connect to Django API, or decide it stays standalone

## Known defects

> Verified 2026-07-16. Full context in `docs/ARCHITECTURE.md` and `docs/memory.md`.

- [ ] `Backend/only2bali/wsgi.py` - settings check tests dict keys not values, so
      `deployment.py` is dead code
- [x] `Frontend/src/App.js` - `Pages/` and `pages/` differed only by case. Consolidated
      into `pages/` on 2026-07-23; `App.js` imports `./pages/Home`
- [ ] `Backend/.env.example` - documents `DJANGO_SECRET_KEY`, code reads `MY_SECRET_KEY`
- [ ] `Backend/only2bali/settings.py` - hardcoded `FRONTEND_URL=localhost:3000`,
      Twilio number, Redis host
- [ ] CORS regex allows all `*.vercel.app` and `*.azurestaticapps.net`
- [x] `Backend/app/` - deleted 2026-07-22
- [ ] `Frontend/` - four routes (`/vendor-onboarding`, `/plan`, `/itinerary`, `/booking`)
      call the deleted FastAPI service and fail on the live site. Removing them is a
      product decision, so they were left in place
- [ ] `Frontend/` - JWT in localStorage, no route guards, auth repeated in 16+ files
- [ ] `Frontend/.env` is committed (URLs only today - keep it that way)

## Health and quality

- [ ] Add a test step to `.github/workflows/main_pybackend.yml` (currently commented out)
- [x] Run Vitest in CI for `only2bali-next/` - 93 tests
- [x] Apply every migration in CI, not just `0000` - the `database` job now runs
      `drizzle-kit migrate`, so a broken later migration fails the build
- [x] End-to-end suite in CI - `npm run test:e2e`, 60 checks over real HTTP against a
      real Postgres. Covers routing, the package page, lead and vendor persistence, the
      full sign-in round trip, and the shared rate limit
- [ ] Add Django tests - there are none
- [ ] Add route guards to the React app, or accept as-is given it is being retired
- [x] Extend the end-to-end suite to booking - seat hold, server-computed amount, oversell
      refused, all under `Booking and seat inventory` in `scripts/e2e.ts`

---

## Completed milestones

| Date | Milestone | Notes |
|---|---|---|
| 2026-07-23 | Postgres live on the VPS, booking flow shipped, payment schema in place | `o2b-postgres` in its own Docker container, mTLS, 45 tables. `payment` / `payment_event` tables, `POST /api/bookings` with seat holds and a server-computed amount. Marketplace demo data (providers, listings, compliance, bookings, a review) seeded on both the local test database and the VPS. |
| 2026-07-23 | Sprint 0 closed except the human steps | Zoho deleted, leads and vendor applications persisted, package detail page, Postgres rate limiting, CRA 404, end-to-end suite in CI. |
| 2026-07-16 | Repo cloned locally + docs added | Project folder had been empty. Four apps mapped, seven live defects found and recorded. |
| 2026-07-15 | Forked from `caloganathan/Only2bali_v3.0` | Now taken forward as Sourabh's own product. |
| 2026-07-14 | Vercel 404 + backend CORS fixes | Last upstream work. Both frontends touched same day. |
| 2026-06-13 | Gemini 2.5 Flash planner + legacy asset integration | Next.js site buildout. |
| 2026-06-12 | Next.js site buildout + Antigravity agent config | `AGENTS.md`, `.agent/` rules and workflows added. |

## Blockers

| Date | Blocker | Affects | Status |
|---|---|---|---|
| 2026-07-16 | Fate of FastAPI layer undecided | Cleanup, onboarding clarity | **closed** 2026-07-22 — deleted |
| 2026-07-16 | Next.js lacks accounts | Retiring the React app | **closed** — accounts, OTP and sessions shipped |
| 2026-07-23 | Production runs on caloganathan's Vercel | Contact details, login, rollback | open — `docs/vercel-handover.md` |
| 2026-07-23 | Zoho and SpringEdge credentials not revoked at the providers | Security | open — only Sourabh can do it |

## Next up

- [ ] **Revoke the two leaked credentials** (Zoho, SpringEdge). Nothing else on this list
      matters as much.
- [ ] **Move production to Sourabh's Vercel** — `docs/vercel-handover.md`. This unblocks
      contact details and login in one step.
- [ ] Choose an email provider and set `RESEND_API_KEY`, so people can actually sign in.
- [x] **Wire Razorpay** — order create (`POST /api/payments/checkout`), Checkout.js verify
      (`POST /api/payments/verify`), webhook with idempotent `payment_event`
      (`POST /api/payments/webhook`), account Pay button. Still needs
      `RAZORPAY_KEY_ID` / `KEY_SECRET` / `WEBHOOK_SECRET` in Vercel (blocked on handover).
- [x] **Marketplace Phase A spine** — plan + public `/services`, admin vendor verify,
      bidirectional reviews, tourism-first landing. See
      `docs/planning/indonesia-marketplace-master-plan.md`.
- [x] **Phase B** — listing checkout + package Book CTA + provider fulfilment.
- [x] **Phase C** — media upload, KYC docs, public provider profiles.
- [x] **Phase D** — request board, bids, offer compare, masked chat, compliance filter.
- [x] **Phase E (code path)** — escrow hold, admin payout queue, refund-first; live PA-CB still owner/legal.
- [x] **Phase F (partial)** — destinations + PWA shell. Django/CRA sunset and Vercel handover remain owner.
- [x] **Clerk OAuth** — social login via Clerk → `o2b_session` bridge (`provider=clerk`).
- [ ] **F4/F5 / E0** — Django user migration, Vercel ownership, PA-CB partner.
- [ ] **Set Clerk keys on Vercel** and enable Google/Apple in Clerk Dashboard.
- [ ] Decide what happens to the four legacy React routes that call the deleted FastAPI
      service.
- [ ] Remove the demo marketplace data (`delete from booking where reference like
      'O2B-DEMO-%'`; `delete from account where email like '%@demo.only2bali.com'`) before
      the site takes real signups — `infra/postgres/seed-demo.sql` documents both statements.
