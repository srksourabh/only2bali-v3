# CLAUDE.md — Only2Bali

> Instructions for Claude Code, Cursor and Windsurf working in this repo.
> Read `docs/memory.md` and `docs/progress.md` at the start of every session.
>
> `AGENTS.md` defines the @FullStackLead persona used by Antigravity and sets the
> SLO budget. Where the two overlap, AGENTS.md wins on standards; this file wins
> on what actually exists today.
>
> **Verify claims here against the code.** This file was itself wrong for a while,
> and `docs/security-fixes-status.md` was wrong for longer. Both are now accurate,
> and both should be corrected the moment they stop being.

## What this product is

Only2Bali sells vegetarian / Jain / vegan group travel from India to Bali, and is
being built out into a two-sided marketplace: verified Bali providers on one side,
Indian group travellers on the other.

The moat is the **verified veg guarantee** — every meal on every itinerary carries
a green / amber / red compliance rating before the traveller sees it — plus
own-language guides and managed logistics.

## Repository layout

| Directory | What it is | Status |
|---|---|---|
| `only2bali-next/` | **The product.** Next.js 15, 7 languages, Postgres, passwordless auth. | Active — build here |
| `Backend/` | Django 5.1 + DRF. Accounts, OTP, journey wizard. | Live on Azure, being retired |
| `Frontend/` | Create React App. The old site. | Legacy, do not invest |
| `only2bali-site/` | A single static `index.html`. | Historical design benchmark |
| `infra/` | Postgres on the VPS: compose, mTLS certs, backups, bootstrap. | Active |
| `docs/` | Architecture, security, planning, ADRs. | Active |

Two frontends still exist. `only2bali-next/` is the destination and now has the
things that used to block retirement — accounts, sessions, a database. `Frontend/`
is kept only until the Django users are migrated.

## Commands

```bash
# Everything, locally, in one command: Postgres + schema + seed + dev server
cd only2bali-next && npm run dev:local        # prints the OTP to the terminal
cd only2bali-next && npm run dev:down         # remove the local database

npm test          # Vitest, 93 tests
npm run test:e2e  # 60 checks: boots Postgres + the app, drives it over HTTP
npm run typecheck
npm run build
npm run db:verify # 38 checks against whatever DATABASE_URL points at
npm run db:seed
```

`db:verify` and `db:seed` read `.env.local` themselves. `test:e2e` uses Docker
unless you set `O2B_DB_URL`, which is how CI runs it against a service
container.

Django, if you need it:

```bash
cd Backend && pip install -r requirements.txt && python manage.py runserver
```

It hard-fails on boot without `MY_SECRET_KEY`, `AZURE_POSTGRESQL_CONNECTIONSTRING`
and `WEBSITE_HOSTNAME`.

## Architecture as it stands

- **App** on Vercel. **Postgres** self-hosted on a Hostinger VPS, reached over
  **mutual TLS** — a leaked `DATABASE_URL` alone cannot connect, because
  `pg_hba.conf` sets `clientcert=verify-full`.
- **Auth** is passwordless: six-digit OTP, HMAC-hashed, attempt-capped, single
  use; opaque session tokens stored as hashes in httpOnly cookies.
- **i18n**: every route lives under `/[lang]`. That layout *is* the root layout,
  which is what makes `<html lang>` correct per locale. Seven languages.
- **Money** is always integer minor units. Never float.

## Conventions

- **Next.js**: App Router, server components by default. Route handlers never
  touch Drizzle directly — go through `lib/repositories/`. Services never read
  `request`. Zod at every boundary.
- **Business rules belong in the database.** Four are check constraints, not
  application conventions, and `npm run db:verify` proves they fire.
- **A form that only opens WhatsApp is not a lead.** Public forms write to
  Postgres first (`lead`, `vendor_application`); WhatsApp and email are a
  convenience layered on top and disappear when unconfigured.
- **Rate limiting counts in Postgres** (`lib/rate-limit-db.ts`). The in-memory
  limiter is the fallback for when the database is unreachable, not the primary.
- **Never use `tier` as a price boundary.** Pricing is open-ended min/max with no
  floor and no ceiling; `tier` is a display label only.
- **Django**: apps are `users` and `journeys`. Every endpoint is a hand-written
  `APIView`; there are no viewsets or routers. Follow that. `journeys` uses a
  `BasePreferenceView` template — extend it.
- **React (legacy)**: fix bugs, add nothing.

## Rules

1. **Never commit secrets.** `.env`, `certs/`, `*.key` and `*.crt` are gitignored.
   Credentials were previously committed and the repos were public — see
   "Outstanding" below.
2. **Do not restructure the app directories.** `Backend/`, `Frontend/` and
   `only2bali-next/` are load-bearing for deployment. See `docs/adr/`.
3. **Do not delete one of the two frontends** to resolve the duplication. That is
   a product decision.
4. **Gemini and database credentials are server-side only.** Never in a client
   component, never in `NEXT_PUBLIC_*`.
5. Update `docs/memory.md` at the end of every session; tick `docs/progress.md`.

## Known traps

Real, verified. Do not be surprised by them, and do not silently "fix" the
load-bearing ones.

- **Root `vercel.json` builds `Frontend/`, the legacy CRA.** If you connect the
  Vercel project to Git without setting Root Directory to `only2bali-next`, you
  will deploy the old site and wonder why nothing changed.
- `Backend/only2bali/wsgi.py` checks `if '<hostname>' in os.environ` — that tests
  dictionary **keys**, not values, so `deployment.py` is dead code.
- `Frontend/src/` used to track `Pages/Home.js` and `pages/*` as two directories
  differing only by case — one directory on Windows, two on Linux. Consolidated
  into `pages/` on 2026-07-23. Do not reintroduce the split.
- **Four legacy React routes still call the deleted FastAPI service**
  (`/vendor-onboarding`, `/plan`, `/itinerary`, `/booking`, via
  `Frontend/src/services/api.js`). They fail on the live site. Removing them is a
  product decision, so they were left in place.
- `Backend/.env.example` documents `DJANGO_SECRET_KEY`; `settings.py` reads
  `MY_SECRET_KEY`. Several other names diverge.
- **CORS allows any `*.vercel.app` and any `*.azurestaticapps.net` origin with
  credentials enabled.** Anyone can deploy a free subdomain on either host.
- `postgres:17-alpine` runs as **uid 70**, not 999. Getting this wrong makes
  Postgres refuse to start with "private key file must be owned by the database
  user or root".
- Port 3000 is often occupied by another project on this machine. `npm run
  dev:local` detects that and moves to 3100.

## Outstanding, and genuinely urgent

**Zoho tokens and the SpringEdge SMS key were committed to source in repos that
were public.** The Zoho integration has now been deleted outright — code, URL
route and `.env.example` entries — and the SMS key is read from the environment.
Neither change revokes anything: **both remain in git history and have not been
revoked at the provider.** Until they are, treat both as compromised. See
`docs/security-fixes-status.md`.

Login cannot deliver codes in production until an email or SMS provider is
configured. `/api/auth/request-otp` answers 503 with an honest message, and
`GET /api/health` reports `"otpDelivery": ["none"]`, so this is visible from
monitoring rather than discovered by a visitor.

Contact details are unset until someone puts real ones in Vercel. Enquiries are
stored in Postgres regardless; the WhatsApp and email buttons simply do not
render. See `docs/vercel-handover.md`, which is the step everything else waits
on — production still runs from someone else's Vercel account.
