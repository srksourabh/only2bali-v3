# Architecture - Only2Bali v3.0

> How the system actually fits together, as of 2026-07-16.
> This describes what **is**, not what should be. For the target architecture and
> performance budgets, see `AGENTS.md` at the repo root.

## In one paragraph

Only2Bali is a travel product that sells vegetarian / Jain / vegan group packages from
India to Bali. It is currently **four separate applications in one repository**, two of
which are competing versions of the same website. A Django API serves the legacy React
app. A newer standalone Next.js app is the intended replacement but has no accounts and
no backend. A FastAPI service exists but is not deployed. Understanding which app you
are in is the single most important thing about this codebase.

## The four applications

```
Only2bali_v3.0/
├── Backend/                  Django 5.1 + DRF        →  Azure App Service   [LIVE]
│   └── app/                  FastAPI + Gemini        →  nowhere            [DEAD]
├── Frontend/                 Create React App        →  Vercel             [LIVE, legacy]
├── only2bali-next/           Next.js 15 App Router   →  Vercel             [LIVE, future]
└── only2bali-site/           Static index.html       →  nothing            [reference]
```

### Backend/ - Django (live)

The real backend. Serves the React app.

- **Stack**: Django 5.1.2, Django REST Framework, SimpleJWT, PostgreSQL, Redis
- **Apps**: `users` (accounts, OTP, profile), `journeys` (the Bali trip questionnaire)
- **Config**: `only2bali/` - settings, urls, wsgi. Not an app.
- **Auth**: JWT via `djangorestframework_simplejwt`. Access token 60 min, refresh 1 day.
  Login and registration are OTP-driven over Twilio SMS.
- **No DRF viewsets or routers.** Every endpoint is a hand-written `APIView` subclass.
- **Database**: Azure PostgreSQL. The connection string is parsed by hand from the
  space-separated `AZURE_POSTGRESQL_CONNECTIONSTRING` env var.
- **Cache**: Azure Redis over TLS. Holds OTPs and rate-limit counters.
- **Third party**: Twilio (SMS OTP), Zoho (CRM push + FAQ tickets)
- **Deploy**: GitHub Actions → Azure App Service `pybackend`, on push to `main`.
  Gunicorn + WSGI. No test step in the pipeline.

#### Data model

`users`:
| Model | Represents |
|---|---|
| `CustomUser` | `AbstractUser` subclass. Unique email + mobile. Is `AUTH_USER_MODEL`. |
| `OTP` | SHA-256 hashed OTP, salted with `SECRET_KEY[:16]`. **Dead code - never imported.** |
| `OTPAuditLog` | Intended audit trail with IP and user agent. **Dead code - nothing writes to it.** |
| `RateLimitLog` | Intended per-mobile and per-IP throttling. **Dead code - never imported.** |

> **Only `CustomUser` is actually used.** `users/views.py:19` imports it and nothing
> else. The live OTP flow generates 4-digit codes, caches them in plaintext, and
> compares with `!=`. `SECURITY_FIXES.md` claims otherwise and is wrong. See
> `docs/SECURITY.md`.

`journeys` - a hub-and-spoke schema around one root record:
- **Hub**: `JourneyPreferences` (FK to user; name, age, party size, crew type, confirmed)
- **Spokes** (one-to-one): `TravelDetails`, `StayPreferences`, `FoodPreferences`,
  `VehiclePreferences`, `TourGuidePreferences`, `CateringOrChef`,
  `PaperworkAssistance`, `Vendor`, `ExtraRequests`
- **FK, not 1:1**: `PlacesToVisit`
- **Lookup tables** (M2M): `Place`, `StayType`, `VegetarianChoice`,
  `NonVegetarianChoice`, `DietaryChoice`, `BalineseChoice`, `VehicleType`,
  `Language`, `AssistanceType`, `VendorType`
- 35 migrations exist.

All nine spoke views subclass `BasePreferenceView` (`journeys/views.py:70`) and key off
a `journey_preferences_id`, scoped to `request.user`. **Extend this pattern** rather
than writing new view shapes.

### Backend/app/ - FastAPI (not deployed)

A parallel, unrelated API. Do not confuse it with the Django backend.

- **Stack**: FastAPI, SQLAlchemy, Pydantic. Own models with UUID string PKs:
  `VendorOnboarding`, `User`, `Trip`, `Vendor`, `Itinerary`, `Booking`
- **Own database**: `DATABASE_URL`, defaulting to `sqlite:///./only2bali.db`.
  Completely separate from Django's Postgres.
- **AI**: Google Gemini `gemini-2.0-flash` in `app/services/ai_engine.py`, with a
  fallback itinerary when the key is missing or the response will not parse.
- **Routes**: all under `/api/v1` - vendors, users, trips, generate-itinerary,
  calculate-price, match-vendors, create-booking, health
- **No auth on any route.**
- **Not deployed.** No uvicorn start command, no ASGI mount, nothing outside `app/`
  references `app.main`. The React app calls it at `REACT_APP_FASTAPI_URL`, which in
  practice means it only works if someone runs it locally.

> **Decision needed.** This layer duplicates parts of Django and parts of Next.js. It
> is either a third product direction or dead weight. See `docs/progress.md`.

### Frontend/ - Create React App (live, legacy)

- **Stack**: React 18, react-scripts 5, Bootstrap 5.3 + react-bootstrap, React Router 7
- **Routes**: 27, flat, no nesting, **no route guards, no 404 fallback**
- Two generations of routes coexist: the legacy wizard (`/journeystart`,
  `/placestovisit`, `/choosefoods`, …) and a newer sprint (`/plan`, `/itinerary`,
  `/booking`)
- **Two separate API clients**:
  - `src/axios.js` → Django, from `REACT_APP_API_BASE_URL`, hardcoded Azure fallback.
    **No auth interceptor.**
  - `src/services/api.js` → FastAPI, from `REACT_APP_FASTAPI_URL`
- **Auth**: JWT in `localStorage`. Not httpOnly cookies. The
  `localStorage.getItem("access_token")` + manual `Authorization` header pattern is
  repeated in 16+ files rather than centralised in the axios instance.
- **Deploy**: root `vercel.json` builds this (`cd Frontend && npm install`, output
  `Frontend/build`, SPA rewrite).

### only2bali-next/ - Next.js 15 (live, the future)

- **Stack**: Next 15.3, React 19, TypeScript 5.6, Vitest 3. App Router.
- **Routes**: `/`, `/planner`, `/about`, `/faq`, `/food`, `/inquiry`, `/vendors`,
  `/privacy`, `/terms`, and `POST /api/planner`
- **`lib/`**:
  - `catalog.ts` - typed package catalog. **Single source of truth.**
    `Protocol = jain | vegetarian | vegan`, `Tier = economical | comfort | premium`
  - `recommend.ts` - deterministic scoring. Food protocol is a hard filter; then
    +3 tier match, +2 per interest overlap, +2 kitchen, +1 language, +2 cook for
    groups ≥10
  - `recommend.test.ts` - Vitest persona and edge-case tests
  - `config.ts` - WhatsApp / email / brand config
- **AI**: Gemini `gemini-2.5-flash` in `app/api/planner/route.ts`. Server-side only.
  Two fallback layers: no key → mock; unparseable JSON → mock.
- **Standalone.** It does not call Django or FastAPI. Data comes from `lib/catalog.ts`;
  leads leave via WhatsApp deep-link and mailto. No auth, no accounts, no tokens.
- **Deploy**: `only2bali-next/vercel.json` pins `framework: nextjs`. Vercel Root
  Directory must be set to `only2bali-next`.

### only2bali-site/ - static (reference)

One self-contained 535-line `index.html` with inline styles and JSON-LD `TravelAgency`
schema. The Next.js README calls it the pixel-complete design benchmark for the rebuild.
Not deployed. Treat as the design source of truth - see `docs/DESIGN.md`.

## Request flow

**Legacy path (accounts + booking):**
```
Browser → Frontend/ (CRA on Vercel)
            ├── src/axios.js       → Django on Azure → PostgreSQL + Redis → Twilio / Zoho
            └── src/services/api.js → FastAPI (localhost only - not deployed)
```

**New path (browse + plan):**
```
Browser → only2bali-next/ (Vercel) → app/api/planner → Gemini
                                   → lib/catalog.ts (local data)
                                   → WhatsApp / mailto (lead capture)
```

The two paths do not talk to each other. There is no shared session, no shared data.

## Why there are two frontends

The Next.js app is a leaner v1 rebuild of the same product, not a feature superset.
Evidence that they are the same site: identical brand and content, byte-for-byte
duplicated assets (`Frontend/src/Asset/` = `only2bali-next/public/Asset/`), ported
features (`StopMotionCursor.js` → `CustomCursor.tsx`), and the Next.js README stating
that `Frontend/` is legacy.

What Next.js still lacks: accounts, OTP login, vendor onboarding, booking.
That is why the React app is still deployed and still being maintained - both were last
touched on the same day (2026-07-14).

## Security boundaries

| Boundary | Control |
|---|---|
| Django API | JWT required (`IsAuthenticated`); OTP for login/registration |
| OTP | **Weak.** 4-digit, plaintext cache, plaintext compare. Not audit-logged. |
| Zoho + SMS credentials | **Hardcoded in source.** See `docs/SECURITY.md` §1. |
| CORS | Whitelist **plus** regex wildcards on `*.vercel.app`, `*.azurestaticapps.net` |
| Gemini key | Server-side only, both in FastAPI and in the Next.js route handler |
| FastAPI | **None.** No auth on any route. Mitigated only by not being deployed. |
| React routes | **None.** Auth is enforced per-component, not by the router. |

See `docs/SECURITY.md`. Do **not** rely on `SECURITY_FIXES.md` - it asserts hardening
that never reached the running code.

## Known architectural defects

Real, verified, and currently live. Recorded here so nobody rediscovers them.

0. **Credentials are hardcoded in source, and the OTP is weak.** Zoho refresh token,
   client id, client secret and an access token sit in `journeys/views.py:495-497,537`;
   the SpringEdge SMS key in `users/serializers.py:67`. The OTP flow is 4-digit
   plaintext. `SECURITY_FIXES.md` claims both were fixed - it is wrong. These outrank
   everything below. See `docs/SECURITY.md`.
1. **`wsgi.py` settings selection is broken.** It does
   `if 'pybackend-….azurewebsites.net' in os.environ` - which tests dict **keys**, not
   values. It always falls through to `only2bali.settings`, so `deployment.py` never
   loads and is effectively dead code. `deployment.py` also forces `HOST: localhost`,
   which would break production if it ever did load.
2. **Case-sensitivity landmine.** `Frontend/src/App.js` imports `./Pages/Home` and
   `./pages/PlanTrip`. Only `Pages/` exists. Fine on Windows, breaks on Linux.
3. **`.env.example` lies.** It documents `DJANGO_SECRET_KEY`; `settings.py` reads
   `MY_SECRET_KEY`. Other names diverge too. Trust `settings.py`.
4. **Hardcoded production values in `settings.py`**: `FRONTEND_URL` is
   `http://localhost:3000`, plus a hardcoded Twilio number and Redis host.
5. **FastAPI is orphaned** - unauthenticated, undeployed, own database, duplicating
   both neighbours.
6. **Placeholder contact details** in `only2bali-next/lib/config.ts`: WhatsApp
   `6281200000000` and `hello@only2bali.com`, both marked TODO. These are user-facing.
7. **No CI tests.** The Azure workflow has a commented-out "add tests here" step.

## Deployment summary

| App | Trigger | Target |
|---|---|---|
| Django | push to `main` | Azure App Service `pybackend` (OIDC login, zip deploy) |
| React | push (root `vercel.json`) | Vercel |
| Next.js | push (Root Directory = `only2bali-next`) | Vercel |
| FastAPI | - | not deployed |
