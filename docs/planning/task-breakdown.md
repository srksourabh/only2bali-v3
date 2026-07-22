# Implementation Plan: Only2Bali platform upgrade

## Overview

Decomposition of the approved upgrade programme (`docs/planning/upgrade-plan-v1.md`,
`docs/planning/platform-plan.md`) into small, verifiable tasks. The work that is ready to build now - a
parallel discovery track, Phase 0 security, and Phase 1 go-live/design fixes - is broken down to
task level with acceptance and verification criteria. Phases 2-6 remain epics here and are broken
into tasks at their own phase gate, because task-level detail depends on decisions not yet made
(ORM, payment provider, commission model).

## Architecture Decisions

- Backend is Next.js full-stack (Postgres + ORM on Vercel), migrated off Django gradually; the
  dead FastAPI app is deleted. (Locked in `docs/planning/platform-plan.md`.)
- v1 is a curated matcher; the platform holds money and pays vendors net of margin; four circuits
  are first-class; traveller accounts are passwordless.
- Design is preserve-and-polish; new marketplace surfaces use Tailwind + shadcn/ui themed with the
  existing tokens (pending ADR-004).
- Security (Phase 0) ships before any new backend surface; secrets live in environment variables
  from the first commit.

## Dependency graph

```
Track V (discovery, non-code)            Phase 0 (security, on the LIVE apps)
        │  (informs go/no-go)                     │  (independent, do first)
        └──────────────┬──────────────────────────┘
                       ▼
        Phase 1 (own hosting + design quick fixes)
                       │
                       ▼
        Phase 2 (Postgres + auth + Tailwind/shadcn + seed + catalog migration)
                       │
      ┌────────────────┼───────────────────────────┐
      ▼                ▼                             ▼
 Phase 3           Phase 4                      Phase 5
 (traveller side)  (vendor side)   ───────►     (payments; also needs Track V2
      │                │                          + the PA-CB compliance rail)
      └────────────────┴───────────────┬──────────┘
                                        ▼
                                 Phase 6 (retire legacy)
```

Order follows the graph bottom-up. High-risk items (unauthenticated data deletion; the payment
compliance gate) are surfaced early.

---

## Task List

### Track V: Discovery validation (parallel, non-code, from `docs/planning/assumptions.md`)

## Task V1: Concierge willingness-to-pay + trust test
**Description:** Run ~10 real trip enquiries through a manual concierge (Wizard-of-Oz) flow at target
margin and measure enquiry-to-deposit, validating assumptions G1/V1/V2. Doubles as curated-matcher v1.
**Acceptance criteria:**
- [ ] 10 enquiries sourced from a real community channel and quoted
- [ ] Enquiry-to-deposit rate recorded with reasons for drop-off
**Verification:**
- [ ] Manual check: a short written result with the conversion number and 3 verbatim objections
**Dependencies:** None
**Files likely touched:** none (operational)
**Estimated scope:** Medium (operational, not code)

## Task V2: Cross-border payout provider quote
**Description:** Obtain a written quote and onboarding requirements from an RBI PA-CB-licensed
provider or AD Category-I bank for India→Indonesia payouts (assumption B2, gates Phase 5).
**Acceptance criteria:**
- [ ] Written pricing + KYC/onboarding requirements received from at least one provider
**Verification:**
- [ ] Manual check: quote saved and summarised against the Phase 5 needs
**Dependencies:** None
**Files likely touched:** none (operational)
**Estimated scope:** Small (operational)

## Task V3: Veg-verifiability audit
**Description:** Check whether every meal on three real itineraries can be verified vegetarian/Jain;
where not, scope the guarantee to the traveling-cook tier (assumption E1).
**Acceptance criteria:**
- [ ] Three itineraries audited meal-by-meal with a verifiable/not-verifiable verdict each
**Verification:**
- [ ] Manual check: a note on which meals need the traveling-cook fallback
**Dependencies:** None
**Files likely touched:** none (operational)
**Estimated scope:** Small (operational)

### Checkpoint: Discovery
- [ ] V1 conversion number, V2 provider quote, and V3 audit are documented
- [ ] Review with human before scaling the build (go/no-go on Phases 2+)

---

### Phase 0: Security hardening (on the live apps; do first)

## Task 0.1: Lock down the delete-journey endpoint
**Description:** Require authentication and owner-scoping on the delete endpoint so only the owner can
delete their own journey, and set a default DRF permission so no endpoint defaults to public.
**Acceptance criteria:**
- [ ] Unauthenticated delete returns 401/403
- [ ] A user cannot delete another user's journey (404/403), only their own
- [ ] A sensible default permission class is set globally
**Verification:**
- [ ] Manual check: `cd Backend && python manage.py runserver`, then attempt the delete without a
      token and with a non-owner token; both are rejected
**Dependencies:** None
**Files likely touched:**
- `Backend/journeys/views.py:467`
- `Backend/only2bali/settings.py:98`
**Estimated scope:** Small

## Task 0.2: Guard the AI planner route (validation, output-check, timeout, rate limit)
**Description:** Add schema + length validation on the request body, validate the AI JSON response shape
before returning it, add a request timeout, and rate-limit the public route.
**Acceptance criteria:**
- [ ] Oversized or malformed bodies are rejected with a 4xx, not passed to the model
- [ ] A malformed AI response falls back cleanly instead of crashing the client
- [ ] Repeated rapid calls are throttled
**Verification:**
- [ ] Tests pass: `cd only2bali-next && npm test`
- [ ] Build succeeds: `cd only2bali-next && npm run build`
- [ ] Manual check: post an oversized body and confirm rejection
**Dependencies:** None
**Files likely touched:**
- `only2bali-next/app/api/planner/route.ts`
**Estimated scope:** Small

## Task 0.3: Fix the lead-destination placeholders
**Description:** Replace the placeholder WhatsApp number and email in config and the hardcoded copies in
the footer with the owner-supplied real contact details so leads reach a real destination.
**Acceptance criteria:**
- [ ] No placeholder number/email remains in config or layout
- [ ] A test enquiry reaches the real inbox/number
**Verification:**
- [ ] Manual check: click the footer WhatsApp/email links and confirm the real destination
**Dependencies:** None (owner supplies details)
**Files likely touched:**
- `only2bali-next/lib/config.ts`
- `only2bali-next/app/layout.tsx:67`
**Estimated scope:** XS

## Task 0.4: Harden the OTP flow
**Description:** Wire in the existing hardened OTP models: lengthen and hash the code, add an attempt
counter and lockout, and invalidate the code after successful use, on both the verify and login paths.
**Acceptance criteria:**
- [ ] Codes are hashed at rest, not plaintext
- [ ] A capped number of wrong attempts locks the code
- [ ] A used code cannot be replayed
**Verification:**
- [ ] Manual check: `cd Backend && python manage.py runserver`, exercise register/login OTP and confirm
      lockout and single-use behaviour
**Dependencies:** None
**Files likely touched:**
- `Backend/users/views.py`
- `Backend/users/models.py`
**Estimated scope:** Medium

## Task 0.5: Rate-limit the auth endpoints
**Description:** Add rate limiting to the login and OTP-generation paths to stop SMS flooding and
credential stuffing.
**Acceptance criteria:**
- [ ] Repeated OTP requests for one identifier are throttled
- [ ] Repeated password/login attempts are throttled
**Verification:**
- [ ] Manual check: rapid repeated requests return a throttled response
**Dependencies:** Task 0.4 (same files/area; do together to avoid churn)
**Files likely touched:**
- `Backend/users/views.py`
**Estimated scope:** Small

## Task 0.6: Rotate and env-migrate the hardcoded secrets
**Description:** Rotate the Zoho credentials and the SpringEdge SMS key at the providers (owner-side),
then replace the hardcoded values in source with environment-variable reads mirroring the correct
existing pattern.
**Acceptance criteria:**
- [ ] No live Zoho or SMS credential remains in source
- [ ] Both secrets are rotated at the provider and read from env
**Verification:**
- [ ] Manual check: source scan finds no secret literals; app boots reading the env values
**Dependencies:** None (owner rotates)
**Files likely touched:**
- `Backend/journeys/views.py:495`
- `Backend/users/serializers.py:67`
**Estimated scope:** Small

## Task 0.7: Correct the misleading security doc
**Description:** Fix or delete `docs/security-fixes-status.md`, which falsely claims the OTP and secrets were already
hardened.
**Acceptance criteria:**
- [ ] The doc no longer asserts fixes that are not in the code
**Verification:**
- [ ] Manual check: doc reflects reality
**Dependencies:** Tasks 0.4, 0.6 (so the doc can state what was actually done)
**Files likely touched:**
- `docs/security-fixes-status.md`
**Estimated scope:** XS

### Checkpoint: Phase 0
- [ ] Unauthenticated delete rejected; AI route guarded; OTP hardened and rate-limited
- [ ] No secrets in source and both rotated at the provider
- [ ] Next.js builds clean (`npm run build`) and tests pass (`npm test`)
- [ ] Review with human before Phase 1

---

### Phase 1: Take control and go live (Tasks 1 & 2 from the founder's list)

## Task 1.1: Repo takeover and own-Vercel hosting
**Description:** Accept the GitHub collaboration and move production to the owner's own Vercel account
with Root Directory `only2bali-next` and `GEMINI_API_KEY` set. Owner-side account actions.
**Acceptance criteria:**
- [ ] Repo is owned/administered by the owner
- [ ] Production serves from the owner's Vercel with real (non-mock) itineraries
**Verification:**
- [ ] Manual check: the live planner returns a non-mock itinerary; env var present
**Dependencies:** None
**Files likely touched:** hosting config (no app code)
**Estimated scope:** Small (operational)

## Task 1.2: Font reconciliation
**Description:** Remove the Montserrat CDN override and standardise the body face on Inter (already wired
via next/font), keeping Fraunces for headings.
**Acceptance criteria:**
- [ ] No Montserrat request; body renders Inter; headings render Fraunces
**Verification:**
- [ ] Build succeeds: `cd only2bali-next && npm run build`
- [ ] Manual check: `npm run dev`, inspect computed body font
**Dependencies:** None
**Files likely touched:**
- `only2bali-next/app/globals.css:102`
**Estimated scope:** XS

## Task 1.3: Image optimisation
**Description:** Convert the multi-megabyte assets (notably the chef and guide illustrations) to optimised
formats and render them via the framework image component instead of raw image tags.
**Acceptance criteria:**
- [ ] Large assets are compressed/modern-format
- [ ] Home hero and section images use the image component with dimensions
**Verification:**
- [ ] Manual check: Lighthouse shows improved LCP/CLS versus baseline
**Dependencies:** None
**Files likely touched:**
- `only2bali-next/public/Asset/` (assets)
- `only2bali-next/app/page.tsx`
- `only2bali-next/app/layout.tsx`
**Estimated scope:** Medium

## Task 1.4: SEO metadata, sitemap, robots
**Description:** Add per-page metadata, a sitemap, a robots file, and a correct canonical/OpenGraph domain.
**Acceptance criteria:**
- [ ] Each page exports its own title/description
- [ ] Sitemap and robots resolve; OG points at the live domain
**Verification:**
- [ ] Build succeeds: `cd only2bali-next && npm run build`
- [ ] Manual check: view source on three pages confirms distinct metadata
**Dependencies:** Task 1.1 (correct live domain known)
**Files likely touched:**
- `only2bali-next/app/**` (per-page metadata)
- `only2bali-next/app/sitemap.ts`, `only2bali-next/app/robots.ts`
**Estimated scope:** Medium

### Checkpoint: Phase 1
- [ ] Production on own Vercel serving real itineraries
- [ ] Single body font; improved image performance; per-page SEO in place
- [ ] Build clean; review with human before Phase 2

---

### Phase 2-6: Epics (broken into tasks at their phase gate)

- [ ] Epic P2 - Foundations: Postgres + ORM, passwordless auth + sessions, ADR-004 + Tailwind/shadcn,
      token scale, seed circuits/POIs/vendors, migrate `only2bali-next/lib/catalog.ts` into the DB.
- [ ] Epic P3 - Traveller side: circuit picker, wire `only2bali-next/lib/recommend.ts` in as the compliance
      filter + AI-output validation, lead capture, accounts-lite, save/share/PDF, group voting, a11y fixes,
      the "how we verify" page + per-meal compliance rating.
- [ ] Epic P4 - Vendor side: vendor accounts, onboarding with evidence, admin verification queue, vendor
      dashboard with availability/hold, payout SLA.
- [ ] Epic P5 - Payments: PA-CB compliance rail + purpose codes, money chain (capture → margin → hold →
      payout → ledger), deposit+instalment, refund-first-claw-back. Gated on Track V2.
- [ ] Epic P6 - Retire legacy: migrate users off Django, delete `Backend/app/` (FastAPI), sunset `Frontend/`.

Each epic is decomposed into S/M tasks (like Phase 0-1 above) once its predecessor checkpoint passes.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cross-border payout is a hard legal gate (PA-CB licence) | High | Gate P5 on Track V2; keep v1 manual/hybrid with a full ledger |
| Veg guarantee cannot be honoured every meal | High | Track V3 audit; traveling-cook tier; visible per-meal rating |
| Unknown brand fails to earn trust | High | Run Track V1 before scaling; lead with the whitespace trust plays |
| Security regressions on new surfaces | High | Finish Phase 0 first; security review for money/PII changes |
| OTP hardening breaks live login | Medium | Do Tasks 0.4/0.5 together; manual test register+login before deploy |
| Small team ops overload | Medium | Keep v1 curated; measure ops hours (Track V4) before automating |
| Backlog scope creep | Medium | Gate Appendix E items behind their phase; ship core flow first |

## Open Questions

- ORM choice (Prisma vs Drizzle) - decide at the start of Epic P2.
- Payment provider and default commission rate - decide at Epic P5, informed by Track V2.
- Legal/tax structure for holding and moving money cross-border - needs a professional advisor.
- Does the Next.js site ultimately need full accounts, or is accounts-lite sufficient long term?
