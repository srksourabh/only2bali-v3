# Memory - Only2Bali v3.0

> Project context and decision log. Updated at the end of every session.
> AI agents read this at session start to resume context.
>
> Agent config lives in `CLAUDE.md` (Claude Code / Cursor) and `AGENTS.md` (Antigravity).

## Project metadata

- **Product**: Vegetarian / Jain / vegan group travel packages, India → Bali
- **Live site**: https://only2bali-v3-0.vercel.app
- **Repository**: https://github.com/srksourabh/only2bali-v3
- **Origin**: Forked from `caloganathan/Only2bali_v3.0` on 2026-07-15. Now being taken
  forward as Sourabh's own product rather than as an upstream contribution.
- **Stack**: Django 5.1 + DRF (live API) · Create React App (live, legacy) ·
  Next.js 15 (live, the future) · FastAPI + Gemini (not deployed)
- **Databases**: Azure PostgreSQL (Django) · Azure Redis (OTP + rate limits)
- **Deployment**: Azure App Service (Django) · Vercel ×2 (React and Next.js)
- **Docs created**: 2026-07-16

## The one thing to know

There are **four applications** in this repo, and two of them are competing versions of
the same website. `Frontend/` (React) is legacy but live. `only2bali-next/` (Next.js) is
the intended future but lacks accounts, OTP, vendor onboarding, and booking. The
migration is incomplete and both are actively maintained. Read `docs/ARCHITECTURE.md`
before any non-trivial change.

## Architecture decisions

Decisions inherited from the original authors are recorded here as observed, so that
future sessions understand the reasoning rather than re-litigating it.

### ADR-001: Rebuild the site in Next.js rather than extend the React app
**Date**: ~2026-06-12 (observed from commit history)
**Status**: Accepted, in progress
**Decision**: Build a new Next.js 15 App Router site in `only2bali-next/`, rather than
continuing to grow the Create React App in `Frontend/`.
**Reason**: `AGENTS.md` names Next.js on Vercel with RSC and edge caching as the target
architecture, driven by performance budgets the CRA cannot meet (TTFB ≤ 200ms,
LCP ≤ 2.5s, ≤ 170 KB JS per route).
**Trade-offs**: Two frontends must be maintained in parallel until parity is reached.
The Next.js app still has no accounts, so the CRA cannot be retired yet.
**Link**: `docs/adr/adr-001-nextjs-migration.md`

### ADR-002: Keep the repository structure as-is
**Date**: 2026-07-16
**Status**: Accepted
**Decision**: Do not restructure the repo into a monorepo or SaaS-foundation layout.
Add documentation only.
**Reason**: The current layout is load-bearing. Root `vercel.json` builds `Frontend/`,
`only2bali-next/vercel.json` builds the Next.js app with Vercel Root Directory set to
that folder, and the Azure workflow zips `Backend/*`. Moving directories breaks all
three pipelines at once. The Django and CRA stacks also do not fit a TypeScript
monorepo skeleton.
**Trade-offs**: The repo stays visibly untidy - four apps, no shared tooling. Accepted
in exchange for three working deployments.
**Link**: `docs/adr/adr-template.md` (use this template if the decision is revisited)

### ADR-003: Disable the inherited Azure deploy workflows
**Date**: 2026-07-16
**Status**: Accepted
**Decision**: Disable `Azure Static Web Apps CI/CD` and `Build and deploy Python app to
Azure Web App - pybackend` in `srksourabh/only2bali-v3`. Files left in place; disabled
at the repository level, reversible with `gh workflow enable`.
**Reason**: Both were inherited by copying the repo and reference Azure secrets that
exist only in caloganathan's repository. They fail on every push. More importantly,
supplying the secrets would be actively dangerous: `main_pybackend.yml` deploys to the
Azure App Service that currently serves the live production site, so this repo would
redeploy shared production on every push - two repositories firing at one live backend.
**Trade-offs**: No CI/CD on this repo until own infrastructure exists. Acceptable
because Vercel deploys through its own Git integration and does not use GitHub Actions.
**Revisit when**: Sourabh has his own Azure resources, or the backend moves off Azure.
**Link**: `docs/adr/adr-template.md`

### Observed decisions, not yet formal ADRs

| Decision | Where | Note |
|---|---|---|
| Hand-written `APIView`s, no DRF routers | `Backend/` | Consistent across both apps. Follow it. |
| `BasePreferenceView` template for the 9 spokes | `journeys/views.py:70` | Extend, don't replace. |
| JWT in `localStorage` | `Frontend/` | Not httpOnly. Known risk, see SECURITY.md. |
| Next.js leads via WhatsApp + mailto, no CRM | `only2bali-next/` | README calls it "by design for v1". Zoho marked TODO. |
| Gemini as itinerary engine | Both FastAPI and Next.js | Two separate implementations, different model versions. |

## Key dependencies

| Dependency | Where | Purpose |
|---|---|---|
| Django 5.1.2 + DRF 3.15 | Backend | Live API |
| djangorestframework-simplejwt | Backend | JWT auth, 60 min access / 1 day refresh |
| psycopg2-binary | Backend | Azure PostgreSQL |
| django-redis | Backend | OTP storage + rate limiting over TLS |
| Twilio | Backend | SMS OTP delivery |
| Zoho | Backend | CRM push + FAQ tickets |
| React 18 + react-scripts 5 | Frontend | Legacy SPA |
| Bootstrap 5.3 | Frontend | Styling |
| Next.js 15.3 + React 19 | only2bali-next | The future site |
| @google/generative-ai | only2bali-next | Gemini 2.5 Flash planner |
| google-generativeai | Backend/app | Gemini 2.0 Flash planner (FastAPI, undeployed) |
| Vitest 3 | only2bali-next | The only real test suite in the repo |

## Session notes

> Add a new entry at the end of every session.
> AI agents: read the latest entry before starting work.

### 2026-07-16: Cloned repo locally, added knowledge continuity docs
- **Work done**: The project folder was empty - nothing had ever been checked out
  locally. Cloned `srksourabh/Only2bali_v3.0` into
  `C:\Users\soura\Dropbox\AI\Projects\Only2Bali`. Mapped all four applications and
  documented the real architecture.
- **Files touched**: Added `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/memory.md`,
  `docs/progress.md`, `docs/DESIGN.md`, `docs/SECURITY.md`, `docs/CONTRIBUTING.md`,
  `docs/adr/adr-template.md`, `docs/adr/adr-001-nextjs-migration.md`.
  **No existing file was modified. No code was moved.**
- **Decisions**: ADR-002 - keep the repo structure as-is. A proposal to restructure the
  repo into a SaaS-foundation monorepo layout was considered and rejected: it would
  break the Django backend, the CRA frontend, and all three deployment pipelines.
- **Discovered**: Seven live architectural defects, now listed in
  `docs/ARCHITECTURE.md` and tracked below. The most urgent are the placeholder
  WhatsApp number and email on the live Next.js site, and the broken `wsgi.py` settings
  selection.
- **Blockers**: None.
- **State**: Repo is checked out and clean. Docs added but not yet reviewed by Sourabh.
- **Next**: Sourabh to decide the fate of the orphaned FastAPI layer and the two-frontend
  split. Fix the placeholder contact details on the live site.

### 2026-07-16 (later): Migrated to own private repo, disabled inherited CI
- **Work done**: Moved the project off the public fork onto Sourabh's own private repo,
  `srksourabh/only2bali-v3`, as he is taking the product over rather than contributing
  upstream. Pushed the full 229-commit history (the initial clone was shallow at depth
  50 and would have silently discarded 167 commits). Docs raised as PR #1 rather than
  committed straight to `main`, so `main` is a faithful copy of the project.
- **Discovered**: **The live site is not on Sourabh's Vercel account.** No Only2Bali
  project exists among his 36 Vercel projects, yet `only2bali-v3-0.vercel.app` serves.
  It runs from caloganathan's account, so Sourabh cannot currently change env vars or
  roll back production.
- **Discovered**: The live deployment is the **legacy CRA**, not the Next.js rebuild -
  no Next.js headers, and root `vercel.json` builds `Frontend/`. Verified live that
  `/food` returns HTTP 200 with a blank page (SPA catch-all + no 404 route), and the
  chat widget reports "We're offline" because it calls the undeployed FastAPI service.
- **Decisions**: ADR-003 - disabled both inherited Azure workflows. They failed on every
  push (no secrets), and wiring the secrets would have pointed this repo at the live
  shared backend.
- **Blockers**: Vercel import needs Sourabh to grant the Vercel GitHub App access to the
  new private repo - a browser permission grant that cannot be automated.
- **State**: Git fully synced. PR #1 open. Vercel not yet set up on his account.
- **Next**: Import to Vercel with Root Directory `only2bali-next` (leaving it blank
  builds the legacy CRA instead). Merge PR #1. Fix the placeholder contact details.

## Known issues

Verified against the codebase on 2026-07-16. Not yet fixed.

| Issue | Severity | Status | Notes |
|---|---|---|---|
| **Zoho + SpringEdge credentials committed to source** | **CRITICAL** | open | `journeys/views.py:495-497,537` (Zoho refresh token, client id, client secret, access token) and `users/serializers.py:67` (SMS API key). Both repos were public. **Rotate at the provider - deleting the lines does not revoke them.** |
| **OTP is 4-digit plaintext, not hardened** | **CRITICAL** | open | `users/views.py:54,56,106`. The `OTP`/`OTPAuditLog`/`RateLimitLog` models exist but are never imported. `docs/security-fixes-status.md` claims this was fixed - it was not. |
| `docs/security-fixes-status.md` is factually false | **High** | open | Claims secret removal and OTP hardening that never reached the view layer. Actively misleads. See `docs/SECURITY.md`. |
| Placeholder WhatsApp + email on live site | **High** | open | `only2bali-next/lib/config.ts` - `6281200000000`, `hello@only2bali.com`. Both marked TODO. Real customers hit these. |
| Production site runs on someone else's Vercel | **High** | open | `only2bali-v3-0.vercel.app` is not on Sourabh's Vercel account - no matching project exists among his 36. It is deployed from caloganathan's account. He cannot change env vars or roll it back. |
| Inherited Azure workflows disabled | Medium | mitigated | Both deploy to caloganathan's Azure using secrets this repo does not have. Disabled 2026-07-16 - see ADR-003. Re-enable only with separate Azure resources. |
| `wsgi.py` settings check is broken | Medium | open | `if '<host>' in os.environ` tests keys, not values. `deployment.py` is dead code. |
| Case-sensitivity landmine in `App.js` | Medium | open | Imports `./Pages/Home` and `./pages/PlanTrip`; only `Pages/` exists. Breaks on Linux CI. |
| FastAPI is orphaned and unauthenticated | Medium | open | No auth on any route, not deployed, own SQLite DB. Decide: wire up, secure, or delete. |
| `.env.example` names don't match `settings.py` | Medium | open | Documents `DJANGO_SECRET_KEY`; code reads `MY_SECRET_KEY`. |
| CORS regex wildcards | Medium | open | Allows all `*.vercel.app` and `*.azurestaticapps.net`. |
| JWT in `localStorage`, no route guards | Medium | open | `Frontend/` only. Auth enforced per-component in 16+ files. |
| Hardcoded values in `settings.py` | Low | open | `FRONTEND_URL=localhost:3000`, Twilio number, Redis host. |
| No tests in CI | Low | open | Azure workflow has a commented-out test step. Vitest exists but is not run by CI. |
| `Frontend/.env` is committed | Low | open | Currently URLs only, no secrets. Keep it that way. |

## Environment

| Environment | URL / command | Notes |
|---|---|---|
| **Django (local)** | `cd Backend && python manage.py runserver` | Needs env vars or it hard-fails on boot |
| **React (local)** | `cd Frontend && npm start` | Port 3000 |
| **Next.js (local)** | `cd only2bali-next && npm run dev` | Port 3000 - conflicts with React |
| **Django (prod)** | Azure App Service `pybackend`, region centralindia | Deployed on push to `main` |
| **Site (prod)** | https://only2bali-v3-0.vercel.app | Vercel |

### Required environment variables

Read from `settings.py`, which is authoritative over `.env.example`:

- `MY_SECRET_KEY` - hard-fails on boot if missing
- `AZURE_POSTGRESQL_CONNECTIONSTRING` - hard-fails on boot if missing
- `WEBSITE_HOSTNAME` - hard-fails on boot if missing
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - optional, OTP breaks without them
- `REDIS_ACCESS_KEY`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` - optional
- `GEMINI_API_KEY` - Next.js planner; falls back to mock itinerary if absent

## Session log - 2026-07-16 (planning + UI samples)

A full planning cycle was completed. **No application code was changed** - all outputs are
documents and design previews.

**Produced (committed to `main`):**
- `docs/planning/platform-plan.md` - approved phased master plan: managed two-sided marketplace,
  four circuits (Ramayana/Adventure/Culinary/Artistic), Next.js full-stack backend,
  curated-matcher v1, accounts-lite, preserve-and-polish design, Tailwind+shadcn (ADR-004).
  Appendix E = competitive feature backlog; Appendix C + Phase 5 = the RBI PA-CB cross-border
  payout compliance gate.
- `docs/planning/ideas.md` - product-trio brainstorm, top 5 ideas.
- `docs/planning/assumptions.md` - 8-category risk map; 5 leap-of-faith assumptions to test first.
- `docs/planning/upgrade-plan-v1.md` - step-by-step implementation strategy.
- `docs/planning/task-breakdown.md` + `docs/planning/task-todo.md` - task breakdown (Track V + Phase 0-1 fully decomposed
  with acceptance criteria; Phases 2-6 as epics).

**UI/UX uplift preview (design direction: preserve & polish; not committed to repo - private
Claude artifacts):**
- Icon homepage: https://claude.ai/code/artifact/8711868a-d160-4e0d-9760-4315f98c555c
- Photo homepage (real assets): https://claude.ai/code/artifact/2522fb91-5b57-4b37-9797-09dd7fd40e4f
- Mobile + planner wizard + itinerary result: https://claude.ai/code/artifact/75d6b8bd-9f08-474e-88b7-5519bf97b83f

**RESERVED / pending Sourabh's decision (do NOT treat as locked):**
- Whether to adopt the shown UI/UX uplift direction.
- Whether to begin building (Track V1 + Phase 0) or keep planning.
- Payment provider, default commission rate, legal structure (Phase 5 only).

**Agreed next step when the user is ready:** Track V1 (concierge validation, doubles as
curated-matcher v1) and Phase 0 Task 0.1 (lock down the unauthenticated delete-journey
endpoint at `Backend/journeys/views.py:467`). See [[platform-direction]] and
[[security-fixes-outstanding]] in auto-memory.

---

## Session log - 2026-07-23 (Sprint 0 closed out, end-to-end suite)

**Asked for**: verify the database connection, describe the schema, analyse the project
end to end, list what is pending, and build an end-to-end test. Then: remove Zoho, and
implement everything on the pending list.

**Verified, not assumed**: local Postgres 17.10 in Docker (`o2b-local-db`, port 55432),
`npm run db:verify` 38/38 green, 1 ms round trip. Production/VPS mTLS untested from here
— `.env.local` points at localhost.

**Found while verifying**: `db:verify` and `db:seed` never loaded `.env.local`, so both
crashed with `Invalid URL` unless the environment was set by hand. The documented command
did not work. Fixed with `tsx --env-file-if-exists=.env.local`.

**The gap that mattered**: 30 of 41 tables had no code touching them. The vendor and
marketplace halves of the schema were a design, not a product. Most visibly, the enquiry
and vendor forms only opened a WhatsApp draft — a visitor who closed the tab was a lead
the business never knew existed, and with a placeholder WhatsApp number that was every
visitor.

**Shipped**:
- Zoho deleted outright — CRM push, token refresh, `SendToZohoAPIView`, its URL, and the
  `ZOHO_*` block in `Backend/.env.example`. Confirming a journey is now a database write
  and nothing else.
- `lead` gained `departure_city`, `group_size`, `protocol`, `travel_month`, `ip`,
  `user_agent`; new `vendor_application` table (an application cannot be a `vendor` row —
  `vendor.account_id` is NOT NULL and an anonymous form must not mint accounts).
- `POST /api/leads` and `POST /api/vendor-applications`; both forms save first and open
  WhatsApp second.
- Contact details read from `NEXT_PUBLIC_WHATSAPP_NUMBER` / `NEXT_PUBLIC_CONTACT_EMAIL`,
  reject the old placeholders, and hide the buttons when unset.
- `/[lang]/packages/[slug]` — the page the product rests on. Every meal, every day, with
  its own green/amber/red rating. The homepage card now links here, not to the planner.
- Rate limiting moved into Postgres (`lib/rate-limit-db.ts`). In-memory is the fallback
  for a database outage, not the primary. New `rate_limit` table.
- `/api/health` reports `otpDelivery` and `contact`, so "login is quietly broken" and
  "contact details are still placeholders" are monitorable rather than discovered by a
  customer. `request-otp` answers 503 instead of a generic 500 when nothing can deliver.
- Legacy CRA: 404 catch-all with `noindex`; `Pages/` and `pages/` (two directories
  differing only by case) consolidated into `pages/`; the always-offline chat widget
  removed.
- `infra/postgres/bootstrap.sh` now applies *every* migration and records them in the
  same ledger drizzle-kit uses, adopting an already-bootstrapped database rather than
  replaying 0000 onto live tables. It previously applied only 0000 and skipped on a table
  count, so migration 0001 would never have reached the VPS.
- CI: `drizzle-kit migrate` instead of applying one SQL file by hand, plus a new `e2e`
  job.
- `scripts/e2e.sh` + `scripts/e2e.ts` — `npm run test:e2e`. Boots Postgres and the app,
  drives it over real HTTP, checks Postgres afterwards, deletes everything it created.
  60 checks. The OTP is read from the server's own log, which is also why it cannot run
  against production and must not.

**Counts after**: 93 unit tests, 60 end-to-end checks, 38 database checks. Typecheck
clean, both builds green.

**Deliberately not done**:
- Revoking the Zoho and SpringEdge credentials at the providers. Only Sourabh can, and
  deleting the code revokes nothing — see [[security-fixes-outstanding]].
- Real contact values and an OTP provider key: both need the Vercel move first, written
  up in `docs/vercel-handover.md`.
- The four legacy React routes that call the deleted FastAPI service
  (`/vendor-onboarding`, `/plan`, `/itinerary`, `/booking`). They fail live, but deleting
  live routes is a product decision.

**Correction to earlier docs**: the long-standing claim that `Frontend/src/App.js` would
break on case-sensitive CI because "only `Pages/` exists" was wrong — git tracked both
`Pages/Home.js` and `pages/*`, so every import resolved. The real hazard was two
directories differing only by case. Now consolidated.

### Later the same day: the 404 that was really a 500

The first production deploy surfaced a defect in code written that morning.
Every package page returned 404 while `DATABASE_URL` was unset — and Vercel's
error tracker showed **nothing**, because the page did
`getPackageBySlug(slug).catch(() => null)` and then `notFound()`. A completely
broken catalogue was indistinguishable, from the outside and from monitoring,
from three slugs that do not exist.

The lesson worth keeping: **404 must mean "there is no such thing", never "we
could not ask".** A catch that turns a failed query into an empty result does not
make the system more robust, it makes the failure invisible. The homepage does
the opposite deliberately — marketing must render from the dictionary when
Postgres is down — and that contrast is the point: the fallback is right where
there is something honest to fall back to, and wrong where there is not.

Guarded by `lib/repositories/catalog.test.ts`, which renders the page against a
dead port and asserts the error does not carry Next's 404 digest. Confirmed to
fail with the catch restored.

Also added `vitest.config.ts` — the first test to import a module using `@/lib/db`
failed with "Cannot find package", because Vitest had never needed the tsconfig
alias while every test imported relatively.

### Later the same day: Postgres on the VPS, booking flow, payment schema

**Asked for**: create the Postgres database in its own Docker container on the
Hostinger VPS with sample data, then get the product to a state where a payment
gateway can be planned against it.

**Postgres on the VPS**: `o2b-postgres`, its own container, own volume
(`only2bali_pgdata`), own network, port 5433 — separate in every respect from
the pre-existing `nusakerja-postgres` (PG16, port 5432, no firewall, no client
cert requirement — not this project's box to fix, but worth knowing what shares
the server). mTLS confirmed live: a password with no client certificate gets
`FATAL: connection requires a valid client certificate`.

**Two real bugs found running `bootstrap.sh` for the first time**:
1. The migration loop read the journal on stdin, and `docker compose exec -T`
   consumes stdin — so the loop's first `psql` call swallowed the rest of the
   heredoc and it ran exactly once. `0000` applied, `0001` silently never seen,
   script exited 0, database sat at 41 tables where 43 were expected, nothing
   printed an error. Fixed by reading the journal on fd 3 and asserting the
   ledger count matches the journal count before claiming success.
2. `psql` was never given a password — `pg_hba.conf` requires scram-sha-256
   even on the container's own unix socket. Fixed with `PGPASSWORD` exported
   and passed by name (`-e PGPASSWORD`), never by value, so it does not appear
   in `ps` on the server.
3. `core.autocrlf=true` on this machine put CRLF into `bootstrap.sh`, which
   died on its own shebang line on the VPS (`$'\r': command not found`). Added
   `.gitattributes` pinning `.sh`/`.sql`/`.conf`/`.yml` to LF; renormalising
   also rewrote two GitHub workflow files that were stored with CRLF.

**Marketplace demo data** — `lib/db/seed-marketplace.ts` (new), run with
`npm run db:seed:demo`. Four verified providers with real compliance evidence
and photos (a Jain-line restaurant, a villa with private kitchens, group
transport, an accompanying cook), five listings, three traveller accounts,
three trip requests in different states (draft / on the provider board /
booked), three offers on the published request, five leads across every
status, three provider applications, and three bookings — confirmed, awaiting
payment, and completed with one published review. Everything is keyed to
`@demo.only2bali.com` / `demo-*` / `O2B-DEMO-*` so it can never touch real
data — `wipeDemo()` matches on exactly those markers, nothing broader.
Generated once as SQL (`infra/postgres/seed-demo.sql`) so the VPS needs no
Node toolchain, same pattern as the catalogue seed. Loaded on the VPS behind
`O2B_SEED_DEMO=1` — opt-in, because fake providers and bookings in a database
someone might quote in a report are worse than an empty one.

**Payment schema** (migration `0002_payments.sql`) — `payment` and
`payment_event`, provider-agnostic on purpose: which gateway to sign with is
still an open business decision, and a provider is a column value
(`payment_provider` enum), not a table name. Three guards proved live on both
the local test database and the VPS: a zero or negative amount is refused
(`payment_amount_positive`), a refund cannot exceed what was captured
(`payment_refund_within_amount`), and a retried checkout cannot double-charge
— `idempotency_key` is unique, so the same key inserted twice is refused by
Postgres itself, not by application logic that could have a bug in it.

**Booking flow** — `lib/repositories/bookings.ts` + `POST /api/bookings`. Locks
the departure row (`FOR UPDATE`), sweeps expired seat holds inside the same
transaction, refuses an oversell with the actual seat count rather than a
generic error, and computes the amount from the departure's price on the
server — the client can send anything in the request body and it is ignored.
Produces a `pending_payment` booking and a 15-minute seat hold; nothing here
calls a gateway, which is deliberate, so the gateway choice does not force a
rewrite of this code.

**`GET /api/health`** now reports `"payments": { "provider": null | "razorpay"
| "stripe", "configured": boolean }`, same pattern as `otpDelivery` — an
unconfigured gateway is visible from monitoring, not discovered by a
traveller stuck at checkout.

**Counts after**: 97 unit tests, 74 end-to-end checks (14 new, covering the
booking flow: anonymous booking refused, traveller-count mismatch refused,
server-computed amount proven against the client's forged number, seat
inventory actually decrements, oversell refused with the real count), 41
database checks (3 new, covering the payment guards). Typecheck clean, build
green.

**Deliberately not done**: no payment gateway is integrated. The schema and
the booking flow are the foundation a gateway plugs into; choosing Razorpay
vs. Stripe vs. something else, and building the order-creation and webhook
handling, is the next real piece of work. See "Next up" in `docs/progress.md`.

**A mid-session tangent**: a large unfilled SaaS-audit template arrived
mid-turn (placeholders for app name, URL, credentials all blank, asking for
PDF/xlsx/screenshot deliverables no tool here can produce). Asked the user
what to do with it; told to ignore it for now and finish the payment work.
Noted here so a future session doesn't mistake it for a real, actioned
request.

### 2026-08-06 — Indonesia marketplace master plan + Phase A spine

**Asked for:** plan, task list, and implementation of a full aggregator marketplace
(providers in Bali/Jakarta/Indonesia, travellers book and pay Only2Bali, admin verifies,
bidirectional ratings) with less veg-only emphasis on the landing page.

**Produced:**
- `docs/planning/indonesia-marketplace-master-plan.md` — gap analysis vs live code,
  positioning shift, phased delivery A–F.
- `docs/planning/indonesia-marketplace-todo.md` — sequenced tasks with done-when.

**Phase A shipped in code:**
- Landing repositioned (tourism/destinations/circuits first; food protocol as one filter).
- Public `/services` + `/services/[id]` for active listings from verified vendors only.
- Admin approve/reject applications + verify/suspend vendors.
- Bidirectional review schema (migration 0005) + API + traveller review UI.
- Bali/Jakarta destination strip + Jakarta sample listing in seed.

**Still open (later phases / owner):** media upload, payouts, request
board UI, Vercel handover, credential revocation.

### 2026-08-06 (later) — Phase B book and pay

**Shipped:**
- Listing availability API; `createListingBooking` with server-priced amount and date hold.
- Unified `POST /api/bookings` for departure + listing.
- Service detail book+pay UI; package departure Book CTA (no longer WhatsApp-only for money).
- Payment capture marks listing availability `booked`.
- Provider bookings list, fulfilment status, vendor→traveller ratings.
- Account shows listing titles; price helper tests.

### 2026-08-06 (later) — Phase C media, KYC, trust

**Shipped:**
- Multipart `POST /api/provider/uploads` — Vercel Blob when `BLOB_READ_WRITE_TOKEN`
  is set; local `public/uploads/` in non-production; 503 in production without token.
- Provider dashboard: file upload primary for photos; KYC document upload.
- `vendor_document` API + admin KYC approve/reject on overview.
- Public `/[lang]/providers/[slug]` (verified only, approved media, published listings, ratings).
- Service cards show image + rating + link to provider; verify copy broadened beyond kitchens.
- Health reports `uploads`; ADR in `docs/decisions/2026-08-06-provider-uploads-blob.md`.

**Owner still:** set `BLOB_READ_WRITE_TOKEN` on Vercel for production uploads.

### 2026-08-06 (later) — Phases D–F marketplace completion slice

**Shipped:**
- Provider request board + bid compose (net → platform-derived traveller total).
- Traveller offer comparison / accept / decline; masked messaging until booking confirmed.
- Compliance hard-filter via `GET /api/services?protocol=` and compliance-match helpers.
- Payment capture → held disbursement (escrow); admin release/approve/mark-paid with purpose code ledger events; platform-first refund API.
- `/destinations` + `/destinations/[region]`; PWA manifest + service worker for account shell.

**Still owner/legal:** E0 PA-CB partner, F4 Django/CRA retirement, F5 Vercel handover + live keys.

### 2026-08-07 — Clerk OAuth

**Shipped:** Clerk social OAuth (Google / Apple) with bridge to existing
`o2b_session` + Postgres `account.role`. Login shows Clerk buttons when
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` are set; otherwise
password / OTP / legacy Google remain. Admin stays password-only.
ADR: `docs/decisions/2026-08-07-clerk-oauth-bridge.md`.

### 2026-07-30 — Razorpay verify, webhook, account pay UI

**Asked for**: apply / land the Razorpay verify + webhook + booking pay UI work
(branch `cursor/razorpay-verify-webhook-49c3`). The referenced `.patch` file was
not present in the environment, so the same surface was implemented against the
existing payment schema and checkout intent path.

**Shipped**:
- `lib/payments/razorpay.ts` — HMAC helpers for Checkout verify and webhook body
  signature, plus stable `payment_event` ids. Vitest coverage.
- `POST /api/payments/verify` — traveller/admin, validates
  `order_id|payment_id` signature, captures payment, confirms booking, converts
  seat hold → booked seats.
- `POST /api/payments/webhook` — records every delivery on `payment_event`
  (including bad signatures), processes `payment.captured` / `payment.failed`
  idempotently via `(provider, provider_event_id)`.
- Account page lists the traveller's bookings with a **Pay now** button that
  opens Razorpay Checkout.js and posts back to verify.
- Default checkout provider is now `razorpay`; `.env.example` documents
  Cashfree env vars too.

**Still blocked on production**: Vercel handover + real
`RAZORPAY_KEY_ID` / `KEY_SECRET` / `WEBHOOK_SECRET`. Without them health still
reports payments unconfigured and verify/webhook answer 503.

### 2026-08-23 — PR #13 marketplace shipment landed

**Asked for**: continue the Codex handoff and ship.

**Verified**: local `npm test` 153 passed, `npm run typecheck` clean. GitHub CI on
`codex/saas-shipment-audit` and on merge commit `bc9c307` all green, including
Linux E2E.

**Shipped**:
- Squash-merged [PR #13](https://github.com/srksourabh/only2bali-v3/pull/13)
  (`Secure and verify marketplace shipment`).
- Local `main` fast-forwarded to `bc9c307`.
- Production inspect Ready: `dpl_61d4jLwYRoSZgfLbhuneEZQzDNky`, aliases include
  `https://only2bali.vercel.app`. GitHub Vercel status on `bc9c307` is success.

**Still owner-only**: real `RAZORPAY_WEBHOOK_SECRET` (not a URL),
`BLOB_READ_WRITE_TOKEN`, `BLOB_PRIVATE_READ_WRITE_TOKEN`, and rotation of
secrets pasted in chat. Checkout and direct uploads stay fail-closed until
those are set. See `only2bali-next/docs/SAAS-SHIPMENT-AUDIT-2026-08-23.md`.
