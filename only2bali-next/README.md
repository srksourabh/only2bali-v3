# Only2Bali — Next.js Reference Implementation

Production-grade scaffold matching the @FullStackLead rules pack (AGENTS.md + `.agent/`).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest — recommendation engine tests
npm run typecheck  # tsc --noEmit
```

## Structure

| Path | Purpose |
|---|---|
| `app/page.tsx` | Homepage (server component): hero, USP, package catalog |
| `app/planner/page.tsx` | Client-side rules-based itinerary recommendation engine |
| `app/vendors/page.tsx` | Vendor onboarding form (WhatsApp payload submission) |
| `app/inquiry/page.tsx` | Group inquiry / lead capture form (WhatsApp + mailto) |
| `lib/catalog.ts` | Typed package catalog (single source of truth) |
| `lib/recommend.ts` | Deterministic scoring engine — food protocol is a HARD filter |
| `lib/recommend.test.ts` | Vitest persona + edge-case tests |
| `lib/config.ts` | WhatsApp/email config — **replace placeholders before launch** |

## Real vs mocked

| Item | Status |
|---|---|
| Recommendation engine | Real, client-side, tested |
| Form validation | Real |
| Form delivery | WhatsApp deep-link + mailto (by design for v1; Zoho CRM = marked TODO) |
| Pricing | Indicative bands — placeholder until confirmed |
| Testimonials | Sample, labeled — replace before launch |
| WhatsApp number | Placeholder `6281200000000` in `lib/config.ts` — **must replace** |

## Deploy to Vercel

This Next.js app lives in the **`only2bali-next/` subdirectory** of the repo (the
repo root also contains a legacy Create-React-App in `Frontend/`). Vercel must be
told to build this subdirectory, or the deployment will fail:

1. Vercel Project → **Settings → Build & Deployment → Root Directory** → set to
   **`only2bali-next`** and save.
2. Framework Preset: **Next.js** (auto-detected; also pinned in `vercel.json`).
3. Add environment variable **`GEMINI_API_KEY`** (Production + Preview) for live
   AI itineraries. Without it the `/api/planner` route returns a structured mock
   itinerary — the site still deploys and works, just with template days.
4. Redeploy.

Build/install commands and framework are pinned in [`vercel.json`](./vercel.json).

## For Antigravity

Open this folder as the workspace (with `AGENTS.md` + `.agent/` from the agent pack at root), then paste `ONLY2BALI-MASTER-PROMPT-v2.md` into agent chat. Remaining build-out: About, FAQ, Stays/Guides detail pages, privacy/terms, image assets, analytics, Vercel deploy.

A pixel-complete single-file preview of the full site (all sections) is in `only2bali-site/index.html` — use it as the design benchmark.
