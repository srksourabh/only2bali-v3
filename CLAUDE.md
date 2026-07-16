# CLAUDE.md - Only2Bali v3.0

> Instructions for Claude Code (and Cursor/Windsurf) working in this repo.
> Read `docs/memory.md` and `docs/progress.md` at the start of every session.
>
> A separate `AGENTS.md` at the repo root defines the @FullStackLead persona used by
> Antigravity. It sets the target architecture and SLO budget. This file covers the
> practical facts of the repo. Where they overlap, AGENTS.md wins on standards, this
> file wins on what actually exists today.

## What this product is

Only2Bali sells vegetarian / Jain / vegan group travel packages from India to Bali.
Live site: https://only2bali-v3-0.vercel.app

## Critical context before you touch anything

This repo contains **four separate applications**, not one. Two of them are competing
versions of the same website. Know which one you are in before editing.

| Directory | What it is | Status |
|---|---|---|
| `Backend/` | Django 5.1 + DRF API. Accounts, OTP, journey wizard, Zoho CRM. | **Live** on Azure |
| `Backend/app/` | A *separate* FastAPI app (Gemini AI, SQLAlchemy). | **Not deployed** - see below |
| `Frontend/` | Create React App. Full accounts + booking flow. | **Live**, legacy |
| `only2bali-next/` | Next.js 15. Catalog + Gemini planner. No accounts. | **Live**, the future |
| `only2bali-site/` | Single static `index.html`. | Design benchmark only |

Read `docs/ARCHITECTURE.md` before any non-trivial change. It explains how these fit
together and where the traps are.

## The main thing to understand

`Frontend/` (React) and `only2bali-next/` (Next.js) are **two versions of the same
website**. The Next.js app is the intended destination. The React app is legacy but is
still deployed and still maintained, because it has features Next.js does not yet have:
user accounts, OTP login, the vendor onboarding flow, and booking.

**The migration is incomplete.** Do not assume a feature exists in both. Do not delete
from one assuming the other covers it. Check first.

## Commands

### Backend (Django)
```bash
cd Backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # http://localhost:8000
```
Requires env vars or it will not boot - see `Backend/.env.example`, but note the
warning in `docs/ARCHITECTURE.md` about names in that file not matching `settings.py`.

### Frontend (React, legacy)
```bash
cd Frontend
npm install
npm start                           # http://localhost:3000
```

### Next.js (the future)
```bash
cd only2bali-next
npm install
npm run dev                         # http://localhost:3000
npm test                            # Vitest
```

## Conventions

- **Backend**: Django apps are `users` and `journeys`. There are no DRF viewsets or
  routers here - every endpoint is a hand-written `APIView` subclass. Follow that
  pattern; do not introduce routers into existing apps without an ADR.
- **`journeys`**: uses a `BasePreferenceView` template that the nine preference views
  subclass by setting `model` / `serializer_class`. Extend that pattern.
- **Next.js**: App Router, server components by default. `lib/catalog.ts` is the single
  source of truth for packages. `lib/recommend.ts` is deterministic and tested - keep it
  pure and keep the tests passing.
- **React (legacy)**: prefer fixing bugs over adding features. New work belongs in Next.js.

## Rules

1. **Never commit secrets** - and know that this rule is currently **broken**. Zoho
   credentials are hardcoded at `Backend/journeys/views.py:495-497` and the SpringEdge
   SMS key at `Backend/users/serializers.py:67`, in repos that were public. They need
   rotating at the provider, not just deleting. See `docs/SECURITY.md`.
   `Frontend/.env` is committed but holds only URLs - keep it that way. Real keys go in
   Vercel / Azure environment settings.
2. **Do not restructure the repo.** The layout is load-bearing for two Vercel projects
   and one Azure pipeline. See ADR-001.
3. **Do not "fix" the two-frontend duplication by deleting one.** That is a product
   decision, not a cleanup task.
4. **Gemini keys are server-side only.** `GEMINI_API_KEY` must never reach the client.
5. Update `docs/memory.md` at the end of every session. Tick `docs/progress.md` as work
   lands.

## Known traps

These are real bugs found in the codebase. Do not be surprised by them, and do not
silently "fix" them without a ticket - some are load-bearing.

- `Backend/only2bali/wsgi.py` checks `if '<hostname>' in os.environ` - that tests
  dictionary **keys**, not values. It always resolves to `only2bali.settings`, so
  `deployment.py` is effectively dead code.
- `Frontend/src/App.js` imports from both `./Pages/Home` and `./pages/PlanTrip`. Only
  `Pages/` exists on disk. This works on Windows and breaks on case-sensitive Linux CI.
- `Backend/.env.example` documents `DJANGO_SECRET_KEY`, but `settings.py` actually reads
  `MY_SECRET_KEY`. Several other names diverge too.
- CORS allows regex wildcards on all of `*.vercel.app` and `*.azurestaticapps.net`.
- The FastAPI app under `Backend/app/` has **no auth on any route** and is not deployed.
- **`SECURITY_FIXES.md` is factually false.** It claims the OTP was hardened to 6 digits
  with hashing, constant-time compare, and audit logging. The live path in
  `users/views.py` still generates 4-digit codes, caches them in plaintext, and compares
  with `!=`. The hardened models exist in `models.py` but are never imported. Verify
  security claims against the code, not against that file.

Full detail and context for each: `docs/ARCHITECTURE.md` and `docs/memory.md`.
