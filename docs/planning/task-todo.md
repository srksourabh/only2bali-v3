# Only2Bali upgrade - task checklist

> Flat checklist for the ready-to-build work. Full detail (acceptance criteria, verification,
> dependencies, files, scope) in `docs/planning/task-breakdown.md`. Phases 2-6 are epics, decomposed at their gate.

## Track V - Discovery (parallel, non-code)
- [ ] V1 - Concierge willingness-to-pay + trust test (~10 real enquiries → deposit)  [M]
- [ ] V2 - Cross-border payout provider quote (PA-CB / AD bank)  [S]
- [ ] V3 - Veg-verifiability audit of 3 itineraries  [S]
- [ ] **Checkpoint:** results documented; human go/no-go before scaling build

## Phase 0 - Security (do first; on the live apps)
- [ ] 0.1 - Lock down delete-journey endpoint (auth + owner scope + default permission)  [S] · high risk
- [ ] 0.2 - Guard AI planner route (input/output validation, timeout, rate limit)  [S]
- [ ] 0.3 - Fix lead-destination placeholders (WhatsApp/email)  [XS]
- [ ] 0.4 - Harden OTP flow (hash, attempt cap, single-use)  [M]
- [ ] 0.5 - Rate-limit auth endpoints  [S] · do with 0.4
- [ ] 0.6 - Rotate + env-migrate Zoho + SMS secrets (owner rotates)  [S]
- [ ] 0.7 - Correct/delete misleading docs/security-fixes-status.md  [XS] · after 0.4, 0.6
- [ ] **Checkpoint:** delete rejected, route guarded, OTP hardened, no secrets in source, build clean

## Phase 1 - Take control + go live
- [ ] 1.1 - Repo takeover + own-Vercel hosting + GEMINI_API_KEY  [S] · owner
- [ ] 1.2 - Font reconciliation (remove Montserrat, standardise Inter)  [XS]
- [ ] 1.3 - Image optimisation (WebP + framework image component)  [M]
- [ ] 1.4 - SEO metadata, sitemap, robots, OG domain  [M] · after 1.1
- [ ] **Checkpoint:** live on own Vercel, single font, faster images, per-page SEO; build clean

## Phase 2-6 - Epics (decompose at each gate)
- [ ] P2 - Foundations (Postgres, auth, Tailwind/shadcn, seed, catalog migration)
- [ ] P3 - Traveller side (circuits, compliance filter, accounts-lite, group tools, trust surface)
- [ ] P4 - Vendor side (accounts, verification queue, dashboard)
- [ ] P5 - Payments (PA-CB rail, money chain, deposits, refunds)  · gated on V2
- [ ] P6 - Retire legacy (migrate off Django, delete FastAPI, sunset React)
