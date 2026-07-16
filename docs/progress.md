# Progress - Only2Bali v3.0

> Task and milestone tracker. Updated whenever work completes or blockers arise.
> AI agents: read this at session start to know where work left off.
>
> This tracks the **real project**, not a greenfield build. The product is already live.

## Status overview

| Area | Status | Note |
|---|---|---|
| Django API | **Live** | Azure App Service. Accounts, OTP, journey wizard, Zoho. |
| React site | **Live**, legacy | Full features. Being replaced. |
| Next.js site | **Live**, incomplete | No accounts, OTP, vendor onboarding, or booking. |
| FastAPI layer | **Orphaned** | Not deployed, unauthenticated. Fate undecided. |
| Migration CRA → Next.js | **In progress** | Blocked on accounts. See below. |
| Test coverage | **Minimal** | Vitest in Next.js only. Nothing runs in CI. |
| Docs | **Done** (2026-07-16) | This set of files. |

---

## Urgent

> Things that affect real customers right now.

- [ ] **Replace placeholder contact details on the live site.**
      `only2bali-next/lib/config.ts` ships WhatsApp `6281200000000` and
      `hello@only2bali.com`, both marked TODO. Lead capture is WhatsApp + mailto only,
      so **every lead from the Next.js site currently goes nowhere.**
- [ ] **Get production onto Sourabh's own Vercel.** `only2bali-v3-0.vercel.app` runs
      from caloganathan's Vercel account, not Sourabh's. Until it moves, he cannot
      change env vars, fix the placeholders, or roll back his own production site.
- [ ] **Add a 404 route to the React app.** The SPA catch-all returns HTTP 200 with a
      blank page for any unmatched URL - verified live on `/food`. Google indexes those
      as successful pages.
- [ ] **The chat widget says "We're offline" on the live site.** It calls the FastAPI
      service in `Backend/app/`, which is deployed nowhere. Either deploy it (with auth
      added first), or remove the widget.

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
- [ ] `Frontend/src/App.js` - imports `./Pages/Home` and `./pages/PlanTrip`; only
      `Pages/` exists. Windows-only luck; breaks on case-sensitive CI
- [ ] `Backend/.env.example` - documents `DJANGO_SECRET_KEY`, code reads `MY_SECRET_KEY`
- [ ] `Backend/only2bali/settings.py` - hardcoded `FRONTEND_URL=localhost:3000`,
      Twilio number, Redis host
- [ ] CORS regex allows all `*.vercel.app` and `*.azurestaticapps.net`
- [ ] `Backend/app/` - no auth on any FastAPI route
- [ ] `Frontend/` - JWT in localStorage, no route guards, auth repeated in 16+ files
- [ ] `Frontend/.env` is committed (URLs only today - keep it that way)

## Health and quality

- [ ] Add a test step to `.github/workflows/main_pybackend.yml` (currently commented out)
- [ ] Run Vitest in CI for `only2bali-next/`
- [ ] Add Django tests - there are none
- [ ] Add route guards to the React app, or accept as-is given it is being retired
- [ ] Playwright E2E for the booking flow (`AGENTS.md` mandates it; none exist)

---

## Completed milestones

| Date | Milestone | Notes |
|---|---|---|
| 2026-07-16 | Repo cloned locally + docs added | Project folder had been empty. Four apps mapped, seven live defects found and recorded. |
| 2026-07-15 | Forked from `caloganathan/Only2bali_v3.0` | Now taken forward as Sourabh's own product. |
| 2026-07-14 | Vercel 404 + backend CORS fixes | Last upstream work. Both frontends touched same day. |
| 2026-06-13 | Gemini 2.5 Flash planner + legacy asset integration | Next.js site buildout. |
| 2026-06-12 | Next.js site buildout + Antigravity agent config | `AGENTS.md`, `.agent/` rules and workflows added. |

## Blockers

| Date | Blocker | Affects | Status |
|---|---|---|---|
| 2026-07-16 | Fate of FastAPI layer undecided | Cleanup, onboarding clarity | open |
| 2026-07-16 | Next.js lacks accounts | Retiring the React app | open |

## Next up

- [ ] Sourabh reviews these docs and corrects anything wrong
- [ ] Fix the placeholder WhatsApp number and email (customer-facing, highest impact)
- [ ] Decide the FastAPI question
- [ ] Pick the next feature: either accounts in Next.js, or a business feature on the
      existing stack
