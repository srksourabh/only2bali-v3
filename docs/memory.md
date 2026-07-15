# Memory - Only2Bali v3.0

> Project context and decision log. Updated at the end of every session.
> AI agents read this at session start to resume context.
>
> Agent config lives in `CLAUDE.md` (Claude Code / Cursor) and `AGENTS.md` (Antigravity).

## Project metadata

- **Product**: Vegetarian / Jain / vegan group travel packages, India → Bali
- **Live site**: https://only2bali-v3-0.vercel.app
- **Repository**: https://github.com/srksourabh/Only2bali_v3.0
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
**Link**: `docs/ADR/adr-001-nextjs-migration.md`

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
**Link**: `docs/ADR/adr-template.md` (use this template if the decision is revisited)

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
  `docs/ADR/adr-template.md`, `docs/ADR/adr-001-nextjs-migration.md`.
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

## Known issues

Verified against the codebase on 2026-07-16. Not yet fixed.

| Issue | Severity | Status | Notes |
|---|---|---|---|
| Placeholder WhatsApp + email on live site | **High** | open | `only2bali-next/lib/config.ts` - `6281200000000`, `hello@only2bali.com`. Both marked TODO. Real customers hit these. |
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
