# ADR-001: Rebuild the site in Next.js rather than extend the React app

**Date**: ~2026-06-12 (decision observed from commit history), documented 2026-07-16
**Status**: Accepted (in progress)
**Deciders**: Original authors (caloganathan). Documented retrospectively by Sourabh.

> **This ADR is written after the fact.** The decision was made and acted on before this
> document existed. It is recorded here because it is the single largest architectural
> thread in the repo, and every future session needs to understand it. If any detail
> misrepresents the original intent, correct it - do not treat it as settled history.

## Context

Only2Bali began as a Create React App SPA (`Frontend/`) talking to a Django REST API
(`Backend/`). That stack delivered a complete product: OTP accounts, a multi-step Bali
trip questionnaire, vendor onboarding, itinerary generation, and booking.

It also carried real costs:

- **Performance.** `AGENTS.md` sets a budget of TTFB ≤ 200 ms (p75), LCP ≤ 2.5 s, and
  ≤ 170 KB gzipped JS per route. A client-rendered CRA hauling Bootstrap, p5, and 27
  flat routes with no code splitting cannot meet those numbers.
- **Architecture drift.** Two generations of routes coexist in one router. Auth is
  re-implemented per component across 16+ files. There are no route guards and no 404.
- **Travel search is read-heavy.** The product is a natural fit for edge caching, ISR,
  and server rendering - none of which CRA offers.

A pixel-complete static design (`only2bali-site/index.html`) already existed as the
target look.

## Decision

> We will build a new Next.js 15 App Router site in `only2bali-next/`, deploy it on
> Vercel, and treat `Frontend/` as legacy - maintained for bug fixes only until parity
> is reached.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **A - New Next.js app alongside (chosen)** | Meets the SLO budget. Clean slate for architecture. Ships incrementally without breaking the live product. | Two frontends to maintain until parity. Duplicated assets. Confusing for newcomers. |
| B - Incrementally migrate the CRA in place | One codebase throughout. No duplication. | CRA → Next.js in place is close to a rewrite anyway, with all the risk landing on a live product. Slow, and the architecture drift comes along for the ride. |
| C - Stay on CRA, optimise it | Cheapest. No migration. | Cannot hit the JS budget or TTFB target. No RSC, no ISR, no edge caching. Structurally the wrong tool for read-heavy travel search. |
| D - Do nothing | Free. | Concedes the performance goals that `AGENTS.md` treats as non-negotiable. |

## Consequences

**What gets better:**
- Server components and edge caching make the SLO budget reachable
- A typed catalog (`lib/catalog.ts`) replaces scattered hardcoded data
- The recommendation engine (`lib/recommend.ts`) is pure, deterministic, and tested -
  the only real test suite in the repo
- The new site has no auth surface at all, which removes a whole class of risk

**What gets worse, or costs us:**
- **Two live frontends.** Both were touched on 2026-07-14 - this is not theoretical
- Assets are byte-for-byte duplicated between `Frontend/src/Asset/` and
  `only2bali-next/public/Asset/`. Change an image, remember both
- Two Vercel projects and two `vercel.json` files to keep straight
- Newcomers reliably get lost. This ADR and `docs/ARCHITECTURE.md` exist because of that
- Two separate Gemini planner implementations now exist (FastAPI on 2.0-flash, Next.js
  on 2.5-flash), which is a third thing to reconcile

**What this commits us to:**
- Maintaining `Frontend/` until Next.js has accounts, OTP, vendor onboarding, and booking
- Either building those four things in Next.js, or accepting two frontends indefinitely

**What we will need to revisit:**
- **Does the Next.js site need accounts at all?** Its model today is catalog + Gemini +
  WhatsApp lead capture, with no backend. If that is enough for the business, the CRA and
  Django serve a different purpose (returning customers, internal ops) and both stay.
  That would make this a product split rather than a migration - a legitimate outcome,
  but it should be decided, not drifted into.
- The orphaned FastAPI layer (`Backend/app/`) overlaps both. See `docs/progress.md`.

## Implementation notes

**Done**: scaffold, deploy, home / planner / about / faq / food / inquiry / vendors /
privacy / terms, typed catalog, tested recommendation engine, Gemini planner with
two-layer mock fallback, legacy assets and custom cursor ported.

**Not done** - this is exactly what blocks retiring `Frontend/`:
accounts · OTP login · vendor onboarding · booking · Zoho CRM · any Django connection.

**Deployment**: `only2bali-next/vercel.json` pins `framework: nextjs`, and Vercel's Root
Directory must be set to `only2bali-next`. Root `vercel.json` separately builds the CRA.
`next.config.mjs` pins `outputFileTracingRoot: __dirname` specifically to stop Next.js
inferring the parent repo as the workspace root - do not remove that line.

**Rollback**: the CRA is still live and still deployed. If the Next.js site fails, point
the domain back. This decision is reversible today. It stops being reversible the moment
`Frontend/` is deleted - do not delete it without a separate ADR.
