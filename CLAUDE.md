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
| `only2bali-next/` | **The product.** Next.js 15, 7 languages, marketplace, Postgres and Clerk/OTP auth. | Active — build here |
| `infra/` | Legacy VPS compose/certs. Not production. Production DB is Neon. | Inactive |
| `docs/` | Architecture, security, planning, ADRs. | Active |

The Django backend, Create React App frontend and static prototype were removed
from the active repository on 2026-08-23 after being copied to an external
archive. Never restore them into the production build.

## Commands

```bash
# Everything, locally, in one command: Postgres + schema + seed + dev server
cd only2bali-next && npm run dev:local        # prints the OTP to the terminal
cd only2bali-next && npm run dev:down         # remove the local database

npm test          # Vitest, 139 tests as of 2026-08-23
npm run test:e2e  # boots Postgres + the app, drives it over HTTP
npm run typecheck
npm run build
npm run db:verify # 38 checks against whatever DATABASE_URL points at
npm run db:seed
```

`db:verify` and `db:seed` read `.env.local` themselves. `test:e2e` uses Docker
unless you set `O2B_DB_URL`, which is how CI runs it against a service
container.

## Architecture as it stands

- **App** on Vercel. **Postgres** is Neon (Vercel integration,
  `o2b_DATABASE_URL` / `DATABASE_URL`, `sslmode=require`). Hostinger VPS
  mTLS and Azure PostgreSQL are not used by this app.
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

## Rules

1. **Never commit secrets.** `.env`, `certs/`, `*.key` and `*.crt` are gitignored.
   Credentials were previously committed and the repos were public — see
   "Outstanding" below.
2. **Treat `only2bali-next/` as the only application.** Legacy copies are
   evidence only and must not return to this repository.
3. **Gemini and database credentials are server-side only.** Never in a client
   component, never in `NEXT_PUBLIC_*`.
4. Update `docs/memory.md` at the end of every session; tick `docs/progress.md`.

## Known traps

Real, verified. Do not be surprised by them, and do not silently "fix" the
load-bearing ones.

- The Vercel Root Directory must stay `only2bali-next`.
- Production currently reports `database: unreachable`; database-backed pages
  are not release-ready until `/api/health` returns 200 and `connected`.
- The old Azure workflows were removed because their applications no longer
  exist in this repository.
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

Clerk is configured in production. Passwordless OTP still cannot deliver codes
until an email or SMS provider is configured; `/api/health` reports
`"otpDelivery": ["none"]`.

Contact details are unset. The Vercel project is now on Sourabh's account and
connected to GitHub, but production cannot store enquiries while its database
connection is down. See `docs/consolidation-audit-2026-08-23.md`.
