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

## For Antigravity

Open this folder as the workspace (with `AGENTS.md` + `.agent/` from the agent pack at root), then paste `ONLY2BALI-MASTER-PROMPT-v2.md` into agent chat. Remaining build-out: About, FAQ, Stays/Guides detail pages, privacy/terms, image assets, analytics, Vercel deploy.

A pixel-complete single-file preview of the full site (all sections) is in `only2bali-site/index.html` — use it as the design benchmark.
