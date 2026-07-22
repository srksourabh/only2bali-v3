# Only2Bali Platform Upgrade - Implementation Strategy

## Objective

Turn Only2Bali from a questionnaire-that-emails-Zoho into a managed two-sided marketplace for
100% vegetarian, own-language, guide-led group trips to Bali, delivered without taking the live
site down. This plan sequences the work described across three source documents into a single,
step-by-step, execution-ready strategy, and pairs the build with cheap discovery tests so the
riskiest assumptions are validated before large investment.

Source documents (all on `main`):
- `docs/planning/platform-plan.md` - the approved phased plan: locked decisions, four circuits, design
  "preserve & polish", condensed architecture, and Appendices A-E (full schema, enlistment flows,
  payment flow, seed supply, and the competitive feature backlog).
- `docs/planning/ideas.md` - product-trio brainstorm with the top five prioritized ideas.
- `docs/planning/assumptions.md` - eight-category risk map and the five leap-of-faith assumptions to test first.

Expected outcomes: the urgent security risks are closed; production runs on the owner's own
hosting; the marketplace ships incrementally on the Next.js stack; the verified-vegetarian promise
is enforced in code and made visible; and the money model is built behind the required cross-border
compliance rail.

## Assumptions Made

- The engineering direction locked in `docs/planning/platform-plan.md` stands: Next.js full-stack backend,
  curated-matcher v1, managed-marketplace payments, four first-class circuits, traveller
  accounts-lite, preserve-and-polish design, and Tailwind + shadcn/ui for new surfaces.
- Credential rotation and hosting/account moves that require provider dashboards or account access
  are performed by the owner; this plan marks those as owner-side tasks.
- The discovery/validation track (Track V) can run in parallel with early build phases and is
  cheaper than discovering the answers after building.
- ORM choice (Prisma vs Drizzle) and payment provider are decided during Phase 2 and Phase 5
  respectively; the plan is written to be agnostic until then.

## Implementation Plan

### Track V - Discovery validation (run in parallel with Phase 0-2, from `docs/planning/assumptions.md`)

- [ ] V1. Run a trust/willingness-to-pay test: take ~10 real trip enquiries through a concierge
      (Wizard-of-Oz) flow at target margin and measure enquiry-to-deposit, to validate assumptions
      G1, V1, and V2 in `docs/planning/assumptions.md`. Rationale: everything downstream depends on an unknown
      brand winning trust and a premium; this doubles as the curated-matcher v1 motion.
- [ ] V2. Obtain a written quote and onboarding requirements from an RBI PA-CB-licensed provider
      (e.g. Razorpay) or an AD Category-I bank for India→Indonesia payouts, validating assumption B2.
      Rationale: this is a hard compliance gate on Phase 5 and must be de-risked before the payment build.
- [ ] V3. Audit whether every meal on three real itineraries can actually be verified vegetarian/Jain
      (assumption E1); where kitchens cannot be verified, scope the guarantee to the traveling-cook
      tier. Rationale: the moat and the ethics both rest on honouring the promise.
- [ ] V4. Run one trip end-to-end fully manually and log the hours for verification, vendor relations,
      concierge, and reconciliation (assumption T1). Rationale: this reveals the true ops cost the
      software must later reduce.

### Phase 0 - Security hardening (start now, independent of the build)

- [ ] 1. Rotate the hardcoded Zoho credentials at the provider and remove them from source at
      `Backend/journeys/views.py:495` through `:537`, replacing with environment-variable reads that
      mirror the correct pattern already used in `Backend/users/views.py`. Owner-side action for the
      provider rotation. Rationale: the credentials were in public repos and reach customer CRM data;
      deleting the lines does not revoke them.
- [ ] 2. Rotate the SpringEdge SMS API key at the provider and remove it from `Backend/users/serializers.py:67`,
      moving it to an environment variable. Owner-side rotation. Rationale: it sends billable login OTPs.
- [ ] 3. Add authentication and an ownership check to the delete-journey endpoint at
      `Backend/journeys/views.py:467` (`DeleteJourneyPreferences`), so only the authenticated owner can
      delete their own record. Consider setting a default permission class in the DRF config at
      `Backend/only2bali/settings.py:98` so no endpoint silently defaults to public. Rationale: the review
      confirmed any unauthenticated caller can delete any customer's trip by iterating IDs.
- [ ] 4. Harden the OTP flow in `Backend/users/views.py` (verify path near `:315`, login path near `:251`):
      lengthen and hash the code, add an attempt counter and lockout, and invalidate the code after use,
      wiring in the already-existing hardened models in `Backend/users/models.py`. Rationale: the live 4-digit
      plaintext, unlimited-attempt OTP is brute-forceable into account takeover.
- [ ] 5. Add rate limiting to the login and OTP-generation endpoints and to the public AI planner route at
      `only2bali-next/app/api/planner/route.ts`. Rationale: prevents SMS flooding, credential stuffing, and
      an unbounded Gemini bill.
- [ ] 6. Add input validation (schema and length caps) and a request timeout to
      `only2bali-next/app/api/planner/route.ts`, and validate the shape of the AI JSON response before it is
      returned. Rationale: untrusted body currently flows straight into the prompt (injection / cost
      amplification) and unvalidated output can crash the results screen.
- [ ] 7. Replace the placeholder WhatsApp number and email in `only2bali-next/lib/config.ts` and the
      hardcoded copies in the footer at `only2bali-next/app/layout.tsx:67`, so every lead reaches a real
      destination. Owner supplies the real contact details. Rationale: every lead from the new site currently
      goes nowhere.
- [ ] 8. Correct or delete `docs/security-fixes-status.md`, which falsely claims the OTP and secrets were already fixed.
      Rationale: it actively misleads future work.

### Phase 1 - Take control and go live (Tasks 1 & 2 from the founder's list)

- [ ] 9. Accept the GitHub collaboration and take over repository development on the owner's account.
      Owner-side action. Rationale: the founder's task 2; establishes ownership of the codebase.
- [ ] 10. Move production hosting to the owner's own Vercel account with Root Directory set to
      `only2bali-next`, and set `GEMINI_API_KEY` in Vercel; confirm the live site serves real (non-mock)
      itineraries. Owner-side account action. Rationale: the founder's task 1; until this moves, the owner
      cannot change env vars, fix placeholders, or roll back production.
- [ ] 11. Remove the Montserrat font override at `only2bali-next/app/globals.css:102` through `:106` and
      standardise the body face on Inter (already wired via next/font in `only2bali-next/app/layout.tsx`),
      keeping Fraunces for headings. Rationale: the override contradicts the design source of truth and breaks
      benchmark parity; a no-backend quick win.
- [ ] 12. Begin image optimisation: convert the multi-megabyte assets in `only2bali-next/public/Asset/`
      (notably the chef and guide illustrations) to optimised formats and render them via the framework image
      component instead of raw image tags in `only2bali-next/app/page.tsx` and `only2bali-next/app/layout.tsx`.
      Rationale: large LCP/CLS win on the Indian mobile connections the product targets.
- [ ] 13. Add per-page metadata, a sitemap, a robots file, and a correct canonical/OpenGraph domain across
      `only2bali-next/app`. Rationale: secondary pages currently share generic metadata and point social previews
      at the wrong domain.

### Phase 2 - Foundations (backend, design system, seed data)

- [ ] 14. Stand up Postgres with a chosen ORM and passwordless authentication with server-side httpOnly
      sessions, plus a key/value store for rate-limit and session state, creating the identity tables described
      in `docs/planning/platform-plan.md` Appendix A.1. Rationale: one auth layer replaces the JWT-in-localStorage pattern
      and the auth logic duplicated across many legacy files.
- [ ] 15. Write ADR-004 authorising Tailwind + shadcn/ui (the design doc currently forbids Tailwind without an
      ADR) in `docs/adr/`, then set up Tailwind and shadcn themed with the existing tokens from
      `only2bali-next/app/globals.css:1`. Rationale: gives a consistent component base for dashboards, listings,
      and checkout without hand-rolling each one.
- [ ] 16. Introduce the token scale and reconcile the radius and inline-colour drift (the 14px-vs-20px card radii
      and the hardcoded hex values scattered in inline styles) into `only2bali-next/app/globals.css`. Rationale:
      makes the preserve-and-polish design consistent and maintainable.
- [ ] 17. Create the circuit spine and lookup tables from `docs/planning/platform-plan.md` Appendix A.4, and seed them with
      the four circuits, the real points of interest, and the real seed vendors listed in Appendix D. Rationale:
      gives the curated matcher real inventory on day one.
- [ ] 18. Migrate the hardcoded package catalog in `only2bali-next/lib/catalog.ts` into the database package and
      service-listing tables. Rationale: the catalog becomes editable data instead of code and can be tagged to
      circuits and compliance.

### Phase 3 - Circuits and the traveller side (Tasks 4-traveller & 5)

- [ ] 19. Add a circuit picker as the first step of planning (Ramayana / Adventure / Culinary / Artistic) and
      make the planner and matching circuit-aware, feeding the trip-request circuit field from Appendix A.2.
      Rationale: the founder's task 5; circuits are the product spine.
- [ ] 20. Wire the currently-dead scoring logic in `only2bali-next/lib/recommend.ts` in over database rows as a
      hard vegetarian/Jain compliance filter plus scoring, and validate every AI-generated meal against the
      trip's protocol before the itinerary is marked compliant. Rationale: enforces the "100% veg" promise in code
      rather than as an unbacked claim.
- [ ] 21. Implement server-side lead capture that writes a lead record on every serious intent and syncs to CRM,
      then traveller accounts-lite that claims an anonymous trip on verification, per the flow in
      `docs/planning/platform-plan.md` Appendix B.2. Rationale: no lead is lost, and plans persist across the multi-week
      family decision cycle.
- [ ] 22. Add save, shareable no-login itinerary link, and PDF export, and the group collaboration features from
      the backlog (voting/polling on circuit and dates, item-level comments) prioritised in `docs/planning/platform-plan.md`
      Appendix E-B and `docs/planning/ideas.md`. Rationale: the family/committee approval step is the real conversion bottleneck.
- [ ] 23. Fix the planner accessibility gaps by giving the click-only selection cards near
      `only2bali-next/app/planner/page.tsx:455` real button semantics and keyboard support, and convert the static
      home sections in `only2bali-next/app/page.tsx` to server components. Rationale: keyboard/screen-reader users
      currently cannot complete the wizard, and the whole home page ships as client JS for one filter.
- [ ] 24. Stand up the verified-veg trust surface from `docs/planning/platform-plan.md` Appendix E: a public "how we verify"
      methodology page, the per-listing/per-meal colour-coded compliance rating, and verified-booking-gated dietary
      reviews. Rationale: these are the category-whitespace differentiators that make the moat credible.

### Phase 4 - The vendor side (Task 4-vendor)

- [ ] 25. Build vendor accounts and the onboarding flow that captures business details, listings tagged to
      circuits, per-listing dietary capability with evidence upload, and a tokenised payout account, per Appendix
      A.3 and B.1. Rationale: the supply side of the two-sided marketplace.
- [ ] 26. Build an admin verification queue where evidence (especially dietary claims) is checked before a listing
      goes live, with named accountable verification. Rationale: the promise is "guaranteed vegetarian"; a
      self-attested checkbox would destroy it.
- [ ] 27. Add a simple vendor dashboard (bookings, availability with a hold to prevent overbooking, and payout
      status) and a published vendor payout SLA, from Appendix E-D. Rationale: reduces ops load and builds vendor trust.

### Phase 5 - Payments (Task 3)

- [ ] 28. Resolve the cross-border compliance rail before any payout: select an RBI PA-CB-licensed provider or an
      AD Category-I bank, and add an RBI purpose-code field to the payout record, per the compliance gate in
      `docs/planning/platform-plan.md` Phase 5 and Appendix C. Depends on Track V2. Rationale: Only2Bali cannot legally
      self-build a "pay Bali vendors from India" rail.
- [ ] 29. Build the money chain from Appendix A.6: capture a traveller payment, deduct margin, hold the vendor
      payout until confirmation vouchers are issued, and record every movement in an append-only ledger with
      server-recomputed prices. Rationale: escrow-style holding is the key fraud/trust control and the client must
      never set a price.
- [ ] 30. Add the deposit-plus-instalment payment plan and a refund-first-from-platform, claw-back-from-vendor
      cancellation flow, from Appendix E-E. Rationale: deposits and instalments are the travel norm and materially
      lift conversion; traveller refunds should never wait on vendor cooperation.

### Phase 6 - Retire legacy

- [ ] 31. Migrate remaining users off the Django backend, delete the orphaned FastAPI app under `Backend/app/`,
      and sunset the React frontend under `Frontend/` once the Next.js app covers accounts and booking. Rationale:
      removes dead and duplicated code that confuses every future session.

## Verification Criteria

- Phase 0: an unauthenticated request to the delete-journey endpoint at `Backend/journeys/views.py:467` returns
  an unauthorized/forbidden status; the AI route at `only2bali-next/app/api/planner/route.ts` rejects oversized or
  malformed bodies and enforces a rate limit; a source scan shows no live Zoho or SMS credentials, and both are
  rotated at the provider; the contact details in `only2bali-next/lib/config.ts` resolve to a real inbox and number.
- Phase 1: production serves from the owner's Vercel account with real (non-mock) itineraries; the rendered body
  font is Inter with no Montserrat request; a Lighthouse run shows improved LCP/CLS after image optimisation.
- Phase 2: identity, circuit, and package data exist in Postgres; the four circuits and seed vendors are queryable;
  the design tokens render consistently with a single radius scale.
- Phase 3: a keyboard-only pass completes the planner wizard; the recommendation engine returns only
  protocol-compliant options and no AI itinerary is labelled compliant without passing validation; a lead record is
  written for every enquiry.
- Phase 4: a vendor can be onboarded and verified through the admin queue, and only verified listings appear in
  matching.
- Phase 5: a test-mode transaction proves money-in, margin deducted, and vendor payout held until voucher, with
  balanced ledger entries and a server-recomputed price that ignores any client-sent amount; a purpose code is
  present on every payout record.
- Discovery: Track V produces measured enquiry-to-deposit numbers, a written payment-provider quote, a verifiability
  audit of three itineraries, and a logged ops-hours figure for one manual trip.

## Potential Risks and Mitigations

1. **Cross-border payout is a hard legal gate, not a feature toggle.**
   Mitigation: treat Track V2 and task 28 as blockers; do not build automated payouts until a licensed provider is
   contracted; keep v1 on the manual/hybrid path with a full ledger so the model is provable before automation.

2. **The verified-vegetarian promise cannot be honoured for every meal, causing real harm and reputational damage.**
   Mitigation: Track V3 audit; scope the guarantee to a traveling-cook tier where kitchens cannot be verified;
   ship the colour-coded per-meal rating so the exact assurance level is always visible rather than blanket.

3. **An unknown brand fails to win trust for a high-ticket purchase, so demand never materialises.**
   Mitigation: run Track V1 before scaling the build; lead with the three whitespace trust plays; use
   community-channel and referral acquisition rather than cold paid channels first.

4. **Security regressions while adding new surfaces (accounts, payments) on top of existing debt.**
   Mitigation: complete Phase 0 before Phase 2; route any change touching money or PII through a security review;
   keep secrets in environment variables from the first commit of the new backend.

5. **A small team is overwhelmed by ops load while also building.**
   Mitigation: Track V4 measures the real ops cost; keep v1 curated (owner enlists/verifies vendors) so
   self-serve onboarding is deferred; automate only the ops steps proven expensive.

6. **Scope creep from the large Appendix E backlog delays shipping.**
   Mitigation: gate the backlog behind the phase it maps to; ship the phase's core flow first, then add backlog
   items; treat the deprioritised list in Appendix E as explicitly out of scope until traction.

## Alternative Approaches

1. Keep the Django backend as the API and add marketplace models to it, with Next.js as a thin frontend. Trade-off:
   reuses live accounts and data and is faster short-term, but carries the existing security debt and runs two stacks
   indefinitely; rejected in `docs/planning/platform-plan.md` in favour of the Next.js full-stack bridge.

2. Ship a simpler managed tour operator (buy from vendors, sell to travellers) with no self-serve marketplace and no
   platform-held payments. Trade-off: much less to build and avoids the cross-border payout gate initially, but
   forgoes the marketplace margin model and data flywheel; effectively what the curated-matcher v1 already is, so it
   can serve as a fallback if payment compliance proves too costly.

3. Build the four circuits and trust surface first as a content/lead site and defer accounts, vendor onboarding, and
   payments. Trade-off: fastest path to testing demand and the trust moat with least engineering, but leaves revenue
   and retention features for later; aligns well with running Track V before committing to the full build.
