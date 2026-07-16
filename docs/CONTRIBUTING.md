# Contributing - Only2Bali v3.0

> Read this first. Then `docs/ARCHITECTURE.md`. Then `docs/memory.md`.
> Budget twenty minutes for all three - this repo has traps that will cost you more
> than that if you skip them.

## Before you write any code

**This repo contains four applications, and two of them are competing versions of the
same website.** Work out which one you are in before you start. `docs/ARCHITECTURE.md`
explains it.

The short version:
- Fixing the live customer site? → `only2bali-next/`
- Fixing accounts, OTP, or the booking wizard? → `Frontend/` + `Backend/`
- Touching `Backend/app/`? → stop, that layer is orphaned and its fate is undecided

## Setup

You need Python 3.12, Node 18+, and access to the Azure Postgres and Redis instances.

### 1. Clone
```bash
git clone https://github.com/srksourabh/Only2bali_v3.0.git
cd Only2bali_v3.0
```

### 2. Next.js site - start here, it is the easiest
```bash
cd only2bali-next
npm install
npm run dev                  # http://localhost:3000
npm test                     # Vitest - the only real test suite in the repo
```
Works with no backend and no database. Without `GEMINI_API_KEY` the planner falls back
to a mock itinerary, which is fine for most UI work.

### 3. Django API
```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver   # http://localhost:8000
```

> **`settings.py` is authoritative, not `.env.example`.** The example file is out of
> date and names variables that the code does not read. You need at minimum
> `MY_SECRET_KEY`, `AZURE_POSTGRESQL_CONNECTIONSTRING`, and `WEBSITE_HOSTNAME` - all
> three hard-fail on boot if missing.

### 4. React app (legacy)
```bash
cd Frontend
npm install
npm start                    # http://localhost:3000 - conflicts with Next.js
```
Run one frontend at a time, or change the port.

## Workflow

1. **Read `docs/memory.md`** - the latest session note tells you where things stand.
2. **Branch.** Never commit to `main`. Push to `main` deploys Django to Azure
   automatically, with no test gate.
3. **Make the change.** Match the surrounding style - see Conventions below.
4. **Test what you can.** `npm test` in `only2bali-next/`. There are no Django tests
   yet; if you are touching the backend, consider being the person who adds the first one.
5. **Check the security list** in `docs/SECURITY.md` if you touched input handling,
   auth, or config.
6. **Update the docs.** Add a session note to `docs/memory.md`. Tick `docs/progress.md`.
7. **Open a PR.**

## Conventions

### Django
- **No DRF viewsets or routers.** Every endpoint here is a hand-written `APIView`
  subclass. That is the established pattern - follow it, or write an ADR arguing to
  change it everywhere at once.
- The nine `journeys` preference views all subclass `BasePreferenceView`
  (`journeys/views.py:70`) and set `model` / `serializer_class`. Extend that pattern.
- Serializers: `ModelSerializer` where a model backs it, plain `Serializer` for OTP and
  auth flows.
- Everything is scoped to `request.user`. Keep it that way.

### Next.js
- App Router, server components by default. `"use client"` only when you need state,
  effects, or handlers.
- `lib/catalog.ts` is the single source of truth for packages.
- `lib/recommend.ts` is deterministic and tested. **Keep it pure.** If you change the
  scoring, update `lib/recommend.test.ts` in the same commit.
- Never expose `GEMINI_API_KEY` to the client. No `NEXT_PUBLIC_` on it, ever.
- Respect the ≤ 170 KB gzipped JS per route budget from `AGENTS.md`.

### React (legacy)
- **Bug fixes only.** New features belong in Next.js.
- Be aware of the case-sensitivity landmine: `App.js` imports both `./Pages/Home` and
  `./pages/PlanTrip`, and only `Pages/` exists on disk. It works on Windows and breaks
  on Linux. Do not add more imports with the wrong casing.

### Commits
Format: `type: what changed and why`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

## Things not to do

1. **Do not restructure the repo.** The layout is load-bearing - root `vercel.json`
   builds `Frontend/`, `only2bali-next/vercel.json` plus a Vercel Root Directory setting
   builds Next.js, and the Azure workflow zips `Backend/*`. Moving folders breaks three
   pipelines at once. See ADR-002.
2. **Do not delete one of the two frontends** to "clean up the duplication". That is a
   product decision. See `docs/progress.md`.
3. **Do not deploy `Backend/app/`** (FastAPI). It has no auth on any route.
4. **Do not weaken the OTP implementation.** It is the best-built part of the system.
5. **Do not commit secrets.** `Frontend/.env` is tracked and currently holds only URLs.
6. **Do not "fix" a failing test by weakening the assertion**, or disable a lint rule to
   pass CI. `AGENTS.md` §5 is explicit about this.

## PR checklist

- [ ] Branched from `main`, not committed directly to it
- [ ] I know which of the four apps I changed, and why it was the right one
- [ ] `npm test` passes if I touched `only2bali-next/`
- [ ] No secrets in the diff
- [ ] Casing is correct on every new import path (Linux CI is case-sensitive)
- [ ] `docs/memory.md` has a session note
- [ ] `docs/progress.md` updated if a tracked item moved
- [ ] An ADR added to `docs/ADR/` if I made an architectural decision
