# Only2Bali — marketplace build task list

> Phase-level scope of record, decomposed from `docs/MARKETPLACE-SPEC.md`. Written 2026-07-22.
> **To actually start work, use `docs/TODO.md`** — the sequenced execution list with commands,
> file paths and done-when criteria. This file is the scope; that file is the order.
> Scope estimates: **XS** < 2h · **S** ~half day · **M** ~1–2 days · **L** ~3–5 days · **XL** > 1 week.
> Every phase ends with a checkpoint that must pass before the next phase starts.

**Legend** — 🔴 blocking risk · 💰 costs money · ⚖️ needs legal/professional input ·
🧑 needs the owner (account access, credentials, business decision)

---

## Phase 0 — Security and control

Runs first, independently, on the live apps. Nothing else ships until this is done.

- [ ] **0.1 🔴 Lock down the delete-journey endpoint** — `Backend/journeys/views.py:467`.
      Add auth + ownership scoping; set a default DRF permission class in
      `Backend/only2bali/settings.py` so nothing defaults to public.
      *Accept:* unauthenticated delete → 401/403; non-owner delete → 403/404. **S**
- [ ] **0.2 🔴🧑 Revoke the committed credentials at the provider** — Zoho
      (`Backend/journeys/views.py:495-497,537`) and SpringEdge SMS
      (`Backend/users/serializers.py:67`). Both repos were public.
      Zoho is being **dropped as an integration** (owner decision, 2026-07-22) — revoke the
      tokens outright rather than rotating them, and delete the calling code. SMS is still in
      use, so that key is rotated and moved to env.
      *Accept:* old credentials rejected by the provider; no credential literal left in source. **S**
- [ ] **0.3 Harden the OTP flow** — `Backend/users/views.py`. Wire in the existing but unused
      hardened models: 6 digits, hashed at rest, attempt cap, single use, short expiry.
      *Accept:* codes hashed; capped wrong attempts lock; used code cannot replay. **M**
- [ ] **0.4 Rate-limit the auth endpoints** — per identifier and per IP, on OTP request and
      login. Do together with 0.3, same files. **S**
- [ ] **0.5 Guard the AI planner route** — `only2bali-next/app/api/planner/route.ts`.
      Zod on input, size cap, Zod on the model output, 1.5 s timeout, rate limit, clean fallback.
      *Accept:* malformed body → 4xx; malformed model response → curated fallback, no crash. **S**
- [ ] **0.6 🧑 Replace the placeholder lead destinations** — `only2bali-next/lib/config.ts`
      (`6281200000000`, `hello@only2bali.com`) and the hardcoded copies in `app/layout.tsx:67`.
      *Accept:* a test enquiry reaches a real inbox and a real WhatsApp number. **XS**
- [ ] **0.7 Correct `SECURITY_FIXES.md`** — it currently claims OTP hardening and secret removal
      that never reached the view layer. Fix or delete. **XS**
- [ ] **0.8 🧑 Take control of hosting** — own GitHub ownership; production on the owner's own
      Vercel with Root Directory `only2bali-next` and `GEMINI_API_KEY` set.
      *Accept:* live planner returns a real, non-mock itinerary from the owner's account. **S**
- [ ] **0.9 Delete the orphaned FastAPI app** — `Backend/app/`. No auth on any route, not
      deployed, own SQLite DB. Delete rather than secure. **XS**

**Checkpoint 0** — no secrets in source and both rotated · delete endpoint rejects
unauthenticated and non-owner · OTP hardened and rate-limited · AI route guarded · leads reach a
real destination · production on the owner's Vercel · `npm run build` and `npm test` clean.

---

## Phase 1 — Foundations

- [ ] **1.1 ADR-004: adopt Tailwind + shadcn/ui** — `docs/DESIGN.md` currently forbids Tailwind
      without an ADR. Record the decision, the token mapping, and the scope limit (new
      marketplace surfaces only; marketing pages keep their CSS). **S**
- [ ] **1.2 Token scale** — add `--r-sm/--r/--r-lg/--r-pill`, `--cocoa`, `--saffron-l`,
      `--veg-green/amber/red` to `globals.css`. Map all tokens into the Tailwind theme; wire
      Fraunces/Inter as the font vars. **No colour changes** — `--cocoa` and `--saffron-l` are
      the hex values already inline in `page.tsx`. **S**
- [ ] **1.3 Remove the Montserrat override** — `globals.css:102-106`, the CDN `@import` plus
      `body{...!important}` fighting Inter.
      *Accept:* no Montserrat request; body computes to Inter, headings to Fraunces. **XS**
- [ ] **1.4 Replace inline hex with tokens** — ~30 occurrences in `app/page.tsx`.
      *Accept:* no raw hex in components; rendered output pixel-identical. **M**
- [ ] **1.5 Image optimisation** — `COOK.png` and `TOURGUIDE.png` are ~6.7 MB each; several
      section backgrounds are multi-MB. Convert to WebP, serve via `next/image` with explicit
      dimensions. **Same artwork, same crop — compression only.**
      *Accept:* Lighthouse LCP and CLS improve measurably against a recorded baseline. **M**
- [ ] **1.6 Server-component the homepage** — `app/page.tsx` is entirely `"use client"` for one
      filter. Convert to a server component with a small client island. **M**
- [ ] **1.7 🧑💰 Provision Postgres** — Neon (recommended) or Supabase. Dev, preview and prod
      branches. **S**
- [ ] **1.8 Drizzle setup** — `lib/db/`, config, migration runner, `npm run db:push`,
      `db:migrate`, `db:studio`. Seed script skeleton. **M**
- [ ] **1.9 Zod validator package** — `lib/validators/` shared by client and server. **S**
- [ ] **1.10 Passwordless auth** — `account`, `otp_code`, `session` tables; request-OTP and
      verify-OTP routes; httpOnly Secure SameSite=Lax cookie sessions; role guard middleware.
      **Not JWT in localStorage.**
      *Accept:* OTP hashed, attempt-capped, single-use; session cookie not readable from JS. **L**
- [ ] **1.11 🧑 Vercel KV** — rate limiting, session lookup cache, seat holds. **S**
- [ ] **1.12 Service and repository layering** — `lib/services/`, `lib/repositories/`.
      Rule: route handlers never touch Drizzle; services never read `request`. **S**
- [ ] **1.13 API envelope + error classes** — `{ success, data?, error?, meta? }`;
      `NotFoundError`, `UnauthorizedError`, `ValidationError`, `RateLimitError`. **S**
- [ ] **1.14 Structured logging** — request id on every request, JSON logs, no `console.log`. **S**
- [ ] **1.15 PWA shell** — `app/manifest.ts` (emerald theme, ivory background, icons generated
      from the existing logo — no new artwork), `@serwist/next`, precache the app shell, branded
      offline fallback page, `OfflineBanner`.
      *Accept:* Lighthouse PWA installable; app shell loads with the network off. **M**
- [ ] **1.16 CI pipeline** — GitHub Actions: lint → typecheck → `vitest run` → build →
      bundle-budget check (fail over 170 KB gz per route). **M**

**Checkpoint 1** — Postgres live with migrations · passwordless login works end to end ·
Tailwind themed with existing tokens, site visually unchanged · one body font · images optimised ·
PWA installs · CI green.

---

## Phase 2 — Content model and packages

- [ ] **2.1 Circuit schema + seed** — `circuit`, `point_of_interest`, `place`. Seed Ramayana,
      Adventure, Culinary, Artistic with their real anchors from the spec §3. **M**
- [ ] **2.2 Package schema** — `package` + `package_circuit`, `package_place`,
      `package_inclusion`, `package_highlight`, `package_day`, `package_day_place`,
      `package_day_meal`, `package_price_tier`. **L**
- [ ] **2.3 Migrate `lib/catalog.ts` into the database** — all six packages, expanded to the full
      field set: nights, places, inclusions, exclusions, why-choose bullets, structured price,
      day-by-day itinerary parsed from the existing `outline` strings.
      *Accept:* `lib/catalog.ts` deleted; all reads come from Postgres; `recommend.test.ts` still
      passes against DB rows. **L**
- [ ] **2.4 Package repository + service** — filters: circuit, protocol, tier, days, month,
      group size, and **open-ended price min/max**.
      *Accept:* no enforced price floor or ceiling anywhere; `tier` is never used as a price
      boundary; a package priced below the competitor anchor and one priced far above both
      filter correctly (spec §2.3). **M**
- [ ] **2.5 Public package APIs** — `GET /api/packages`, `/api/packages/[slug]`,
      `/api/circuits`, `/api/circuits/[key]`. Cached, stale-while-revalidate. **M**
- [ ] **2.6 `PackageCard` component** — the competitive card from spec §6.2: name, `Xd/Yn`,
      places, compliance badges, language chips, from-price, next departure. **M**
- [ ] **2.7 `VegComplianceBadge`** — green/amber/red, always colour **plus** icon **plus** text,
      tooltip, links to `/verify`. **S**
- [ ] **2.8 `/packages` browse page** — filter rail, sort, pagination, empty state.
      Price filter presets ("under ₹40,000" / "₹40,000–₹80,000" / "₹1,50,000+") over an **open
      range**, not enumerated buckets. **M**
- [ ] **2.8b `package_highlight` — package USP** — "Why choose this package" block on the detail
      page and a condensed two-line version on the card. Ordered benefit statements with icons.
      This is the copy that has to beat a cheaper competitor. **S**
- [ ] **2.9 `/packages/[slug]` detail page** — every block in spec §6.3: hero gallery, why-choose,
      places + map, day-by-day with per-meal compliance colours, inclusions, exclusions, food,
      stay, guides, group size, price breakdown, providers, policies, reviews, sticky CTA. **L**
- [ ] **2.10 `/circuits` and `/circuits/[key]`** — circuit story, POI map, packages on this
      circuit. **M**
- [ ] **2.11 Homepage circuit strip** — five cards inserted after the hero. The primary funnel
      entry. Existing hero and all other sections untouched. **M**
- [ ] **2.12 `/verify` — "How we verify every kitchen"** — the public methodology page:
      inspection checklist, no-onion/no-garlic protocol, separate oil and utensils, photos from
      verification visits. Differentiator #2. **M**
- [ ] **2.13 SEO** — per-page `metadata`, `metadataBase`, `app/sitemap.ts`, `app/robots.ts`,
      JSON-LD `TouristTrip` / `Product` on package pages, correct OG domain. **M**

**Checkpoint 2** — all six packages served from Postgres with the full field set · package detail
page shows days, nights, places, inclusions, why-choose and price · circuits browsable · `/verify`
live · JSON-LD validates.

---

## Phase 3 — Calendar and availability

- [ ] **3.1 Availability schema** — `departure`, `availability`, `blackout_date`, `seat_hold`. **M**
- [ ] **3.2 Seed departures** — fixed departure dates for each package for the next 12 months,
      with seasonal pricing and seat counts. **M**
- [ ] **3.3 Availability API** — `GET /api/packages/[slug]/availability?from&to` returning
      per-date price, seats available and status. **Network-only, never cached.** **M**
- [ ] **3.4 `DeparturePicker`** — month grid, price under each date, seats-left when ≤ 5,
      disabled sold-out and past dates, today marked, peak dates in saffron, auto-derived return
      date from `nights`, legend.
      *Accept:* full keyboard operation (arrows by day, PageUp/Down by month); availability and
      price announced to screen readers; measured bundle cost recorded. **L**
- [ ] **3.5 `DateRangePicker`** — custom trips: range selection, min-nights enforced,
      **"flexible — pick a month"** escape hatch mapping to the existing `month` field, blackout
      dates disabled with an explanatory tooltip, group-size capacity warning. **L**
- [ ] **3.6 Seat-hold service** — TTL hold on entering checkout, automatic expiry release,
      concurrency-safe.
      *Accept:* a concurrency test proves two simultaneous holds cannot oversell the last seat. **M**
- [ ] **3.7 Wire the calendar into the package page** — "Check dates" opens the picker; selecting
      a date carries through to the wizard. **M**

**Checkpoint 3** — a traveller can see real dates with real prices and real seat counts, cannot
select a sold-out date, and a hold prevents double-booking under concurrent load.

---

## Phase 4 — Trip request, matching and offers

- [ ] **4.1 Trip request schema** — `trip_request`, `lead`, `itinerary`. Includes the
      `cook_required → group_size >= 10` **database check constraint**. **M**
- [ ] **4.2 `TripRequestWizard`** — six steps (spec §6.5), resumable, `localStorage` then server
      draft from step 3, no signup wall. Step 6 (post to providers) is built here but stays
      disabled until Phase 6, when there is a provider audience to post to. **L**
- [ ] **4.3 Fix planner accessibility** — the existing click-only `<div>` selection cards in
      `app/planner/page.tsx` become real `<button>` / `role="radio"`, keyboard operable. **M**
- [ ] **4.4 Server-side lead capture** — `POST /api/trip-requests` writes `trip_request` + `lead`
      atomically, rate-limited. Replaces the WhatsApp/mailto-only path.
      *Accept:* every submission produces a `lead` row even if downstream steps fail. **M**
- [ ] **4.5 Matching engine** — extend `lib/recommend.ts` onto DB rows: circuit filter → **hard
      protocol filter** → date availability → capacity → scoring (existing weights plus provider
      rating and date proximity).
      *Accept:* a non-compliant package is never returned for any score; unit tests cover it. **L**
- [ ] **4.6 Offer schema + generation** — `offer` table; build 2–4 competing offers per trip
      request from packages plus provider listings, price snapshotted into `line_items`. **L**
- [ ] **4.7 `/plan/[id]/offers`** — `OfferComparison`: side by side, delta-highlighted, identical
      rows collapsed, sticky compare bar on mobile. **L**
- [ ] **4.8 `/plan/[id]/offers/[offerId]`** — full offer detail with `PriceBreakdown`. **M**
- [ ] **4.9 AI itinerary hardening** — structured prompt, Zod-validated output, **protocol
      re-check on the generated content**, 1.5 s timeout, curated fallback.
      *Accept:* a fixture where the model returns a non-veg venue fails closed to the curated
      itinerary; test proves it. **M**
- [ ] **4.10 Save and share** — shareable no-login itinerary link + PDF export. **M**
- [ ] **4.11 `/admin/leads`** — the lead working surface: list, filter, status, notes, assign.
      **No CRM integration** — Zoho is dropped (owner decision, 2026-07-22). Leads live in
      Postgres; a CRM can be bolted on later without changing the capture path. **M**

**Checkpoint 4** — a traveller completes the form and sees multiple real, priced offers · every
submission writes a lead · leads are workable in admin · no non-compliant package can appear ·
AI output cannot fake compliance.

---

## Phase 5 — Traveller accounts and booking

- [ ] **5.1 Traveller profile schema** — `traveller`, linked to `account`. **S**
- [ ] **5.2 OTP login UI** — request, verify, resend with cooldown, error states. **M**
- [ ] **5.3 Claim an anonymous trip** — `POST /api/me/trips/[id]/claim` attaches a trip created
      before login to the new account. **M**
- [ ] **5.4 `/account`** — trips, bookings, saved packages, documents. **M**
- [ ] **5.5 Booking schema** — `booking`, `booking_traveller`, `booking_document`,
      `cancellation_policy`. **M**
- [ ] **5.6 Accept-offer flow** — `POST /api/me/offers/[id]/accept`: **price recomputed
      server-side**, seat hold consumed, booking created `pending_payment`.
      *Accept:* a client-supplied amount is ignored; test proves it. **L**
- [ ] **5.7 `BookingStepper`** — offer → traveller details → confirm. **Payment-less until
      Phase 7**: the booking reaches `pending_payment` and settlement happens offline, with the
      step present but marked "payment link sent separately". No dead-end UI. **M**
- [ ] **5.8 Traveller details capture** — per-passenger names, ages, passport (encrypted at
      rest), dietary notes. **M**
- [ ] **5.9 Voucher and document generation** — itinerary PDF, vouchers, invoice. **M**
- [ ] **5.10 `/account/trips/[id]`** — itinerary, vouchers, payment schedule, provider contacts. **M**
- [ ] **5.11 Cancellation flow** — policy-driven, refund amount computed server-side. **M**
- [ ] **5.12 Reviews** — verified-booking-gated, includes the
      "was the veg guarantee kept?" field. **M**
- [ ] **5.13 Notifications** — email and WhatsApp on booking confirmed, payment due, trip
      reminder. **M**

**Checkpoint 5** — a traveller logs in, accepts an offer and reaches a confirmed booking with
documents · price is never client-controlled · anonymous trips survive login.

---

## Phase 6 — Provider self-onboarding, verification, and the request board

- [ ] **6.1 Vendor schema** — `vendor`, `vendor_highlight`, `vendor_document`, `service_listing`,
      `listing_circuit`, `listing_compliance`. **L**
- [ ] **6.2 `/partner` marketing page** — rewrite the current static `/vendors` pitch into a real
      funnel: value proposition, commission transparency, payout SLA, "list your business". **M**
- [ ] **6.3 `/partner/signup`** — passwordless signup creating `account(role=vendor)` +
      `vendor(status=draft)`. **M**
- [ ] **6.4 `OnboardingStepper`** — four steps, resumable, progress persisted in
      `vendor.onboarding_step`. Incremental KYC: minimum to activate, more requested later. **L**
- [ ] **6.5 Onboarding step 1 — business** — name, legal name, type, base area, languages,
      contacts, logo, cover. **M**
- [ ] **6.6 Onboarding step 2 — listings** — `ListingForm`: title, service type, circuits,
      area, capacity range, tier, price + unit, photos. Multiple listings. **L**
- [ ] **6.7 Onboarding step 3 — compliance evidence** — `ComplianceEvidenceUpload`: per listing,
      per protocol — guarantee level, kitchen type, evidence files, notes.
      **This is the quality gate's raw material.** **L**
- [ ] **6.8 Onboarding step 4 — payout account** — tokenised, never raw bank details. Deferrable:
      blocks payouts, not listing. **M**
- [ ] **6.9 🔴 File upload security** — type and size validation, virus scan, stored off the app
      origin, never executable, signed URLs for reads. **M**
- [ ] **6.10 `/admin/verification` queue** — `VerificationQueue` + `EvidenceViewer`: review
      documents and evidence, set green/amber/red per listing per protocol, approve or reject
      with a reason, set `commission_rate`.
      *Accept:* nothing a provider entered is publicly visible before approval; test proves an
      unverified listing never enters matching. **L**
- [ ] **6.11 Compliance expiry** — `listing_compliance.expires_at`; a lapsed record silently
      drops the listing out of matching. Scheduled job + provider reminder. **M**
- [ ] **6.12 `/partner/dashboard`** — bookings, upcoming departures, payout status, rating,
      verification status banner. **L**
- [ ] **6.13 `AvailabilityCalendarEditor`** — provider edits per-date availability, blocks dates,
      sets price overrides. **L**
- [ ] **6.14 Provider booking confirmation** — `POST /api/partner/bookings/[id]/confirm`. **M**
- [ ] **6.15 `/providers` directory + `/providers/[slug]`** — public, verified only, with
      compliance badges and reviews. SEO asset and proof-of-work flywheel. **M**
- [ ] **6.16 🔴 PII boundary** — traveller contact details are exposed to a provider only after
      the booking is confirmed. Applies to bookings **and** to the request board.
      *Accept:* test proves a provider cannot read traveller name, phone, email or exact address
      pre-confirmation, through any endpoint. **S**
- [ ] **6.17 `vendor_highlight` — provider USP** — "Why this provider is best". Provider enters
      them during onboarding; **admin moderates them at verification**, so a provider cannot
      self-award an unchecked claim like "100% Jain certified". Rendered on the provider profile,
      every offer card and every bid. **M**

### Request board — traveller posts, providers bid (spec §6.7)

- [ ] **6.18 Posting schema** — `trip_request` posting fields (`visibility`, `published_at`,
      `bids_close_at`, open-ended `budget_min`/`budget_max` **both independently nullable**,
      `budget_basis`, `special_requirements`, `requirement_tags`, `mobile_verified`),
      plus `request_invite` and `request_board_view`.
      Check constraint: `visibility != 'private'` requires `mobile_verified = true`. **M**
- [ ] **6.19 `PostRequestPanel`** — wizard step 6 goes live: budget band, special requirements,
      deadline (default 7 days, adjustable 2–21), visibility toggle. Mobile OTP verification
      gate before a request can be published. **M**
- [ ] **6.20 🔴 Board projection service** — the anonymised view providers see. Built as a
      **projection, not a filtered row** — contact fields are never selected, not merely hidden.
      Eligibility: verified **and** verified for this protocol **and** capacity covers the group.
      One compliance rule shared with the matching engine, not a second copy.
      *Accept:* a provider not verified for Jain cannot see a Jain request through any endpoint;
      test asserts on the raw API response, not the rendered page. **L**
- [ ] **6.21 `/partner/requests` board** — `RequestBoardCard`, `RequestBoardFilters`, live
      "closes in" countdown, viewing count, sorted by fit. **L**
- [ ] **6.22 `ProposalBuilder`** — provider builds a bid from their own listings. Provider sets
      `vendor_net_amount`; **the platform derives the traveller-facing `total_amount`**. Creates
      `offer(origin='vendor_bid')` — same object as a system match, one code path downstream.
      *Accept:* a provider cannot set the traveller-facing price by any input; test proves it. **L**
- [ ] **6.23 Bid quotas and rate limits** — `proposal_quota`, tiered by verification age and
      rating. Start at 5 active proposals. Blind bidding: **a provider never sees another
      provider's amount.** **M**
- [ ] **6.24 `MaskedThread`** — pre-booking traveller ↔ provider Q&A. `body_raw` stored,
      `body_masked` served: phone numbers, emails and URLs stripped, `contact_attempt_detected`
      logged. Unmasks on booking confirmation.
      *Accept:* a message containing a phone number and a URL renders masked to both parties and
      raises the flag; test covers Indian and Indonesian number formats. **L**
- [ ] **6.25 Merged offer comparison** — `/plan/[id]/offers` shows system matches and provider
      bids in one view, labelled honestly by origin, **sorted by relevance not price**.
      Shortlist, request revision, decline with reason. **M**
- [ ] **6.26 Bid lifecycle** — accept one → request auto-closes → unsuccessful bidders notified
      (this is what keeps providers bidding again) · deadline auto-close job · abandoned draft
      expiry · provider withdraw · response rate and time tracked on `vendor`. **M**
- [ ] **6.27 Board abuse controls** — scrape detection from `request_board_view`, fake-demand
      prevention via the OTP gate, admin takedown of a posted request, provider suspension. **M**

**Checkpoint 6** — a provider signs up, uploads listings and evidence unaided · an admin verifies
and the listings go live · nothing unverified is ever publicly visible or matchable · a traveller
publishes a request, eligible providers bid, the traveller compares bids alongside system matches
and accepts one · **no traveller PII leaves the platform before booking confirmation**.

---

## Phase 7 — Payments (Razorpay, deferred)

**Deferred by owner decision, 2026-07-22.** Provider is settled — **Razorpay** — but the
integration is not part of the initial build. Everything up to Phase 6 ships payment-less:
booking confirms, settlement happens offline, the ledger is still written so nothing has to be
back-filled later.

Gated on the compliance work below. Do not start the payout half without it.

- [ ] **7.1 ⚖️🧑 Cross-border payout partner** — written quote, licensing confirmation and KYC
      requirements from an **RBI PA-CB licensed provider** (Razorpay holds this) or an AD
      Category-I bank for India → Indonesia payouts. **Blocks 7.8 onward.**
      Long lead time — start this conversation well before the phase begins. **M**
- [ ] **7.2 ⚖️🧑 Legal and tax structure** — merchant-of-record implications, GST/VAT, travel
      regulation. Professional advice, not an engineering decision. **M**
- [ ] **7.3 🧑 Commission rate decision** — default plus per-vendor override. Needed earlier than
      the rest of this phase: `offer` derives the traveller price from the provider's net using
      this rate, so a working default is required by task 6.22. **XS**
- [ ] **7.4 Money schema** — `payment`, `payment_schedule`, `vendor_payout_account`, `payout`
      (**including `rbi_purpose_code` from day one**), `ledger_entry`, `refund`. **L**
- [ ] **7.5 💰 Razorpay integration** — checkout, capture, idempotency keys, signature-verified
      webhooks. Keys in environment variables only, never in source — the mistake this repo has
      already made twice. **L**
- [ ] **7.6 Deposit + instalment** — schedule generation, reminders, retries. Travel norm,
      materially lifts conversion. **L**
- [ ] **7.7 Ledger and reconciliation** — append-only entries.
      *Accept:* an automated check proves charge = commission + payout for every booking. **M**
- [ ] **7.8 ⚖️ Payout run** — `/admin/payouts`, hold until vouchers are issued, then approve and
      pay. Manual/hybrid for v1 with the full ledger written either way. **L**
- [ ] **7.9 Refund flow** — refund-first-from-platform, claw-back-from-provider. Includes
      `veg_guarantee_failure` as a first-class reason. **L**
- [ ] **7.10 Veg-guarantee refund policy** — the public policy page plus the operational process
      behind it. Differentiator #3. **M**
- [ ] **7.11 Payment security review** — PCI scope, no card data touched, server-only paths,
      webhook replay protection, idempotency on every write. **M**

**Checkpoint 7** — a test-mode transaction proves money in → commission → payout with ledger rows
· price is server-recomputed everywhere · payout carries a purpose code · reconciliation balances.

---

## Phase 8 — PWA completion and polish

- [ ] **8.1 Offline booking bundle** — `GET /api/me/bookings/[id]/bundle`; cached to IndexedDB:
      itinerary, vouchers, addresses, provider phone numbers, emergency contacts.
      *Accept:* with the network fully off, a confirmed booking is completely readable. **L**
- [ ] **8.2 Caching strategy enforcement** — precache shell; cache-first images; SWR for package
      and circuit pages; **network-only for availability, price, auth, payment and booking
      writes**.
      *Accept:* a test proves a stale price or a sold-out seat can never be served. **M**
- [ ] **8.3 Background Sync** — safe idempotent writes only (trip draft, notes). Payments and
      bookings are never queued; the UI states that a connection is required. **M**
- [ ] **8.4 `InstallPrompt`** — captured `beforeinstallprompt`, shown on second visit or after a
      trip request, dismissible and remembered. **S**
- [ ] **8.5 Performance pass** — measure against the budget: TTFB ≤ 200 ms, LCP ≤ 2.5 s,
      INP ≤ 200 ms, ≤ 170 KB gz per route. Fix what breaches. **L**
- [ ] **8.6 Accessibility audit** — WCAG 2.2 AA across all new surfaces; keyboard-only pass
      through wizard, calendar and checkout; saffron never on small text;
      `prefers-reduced-motion` disables the cursor trail. **M**
- [ ] **8.7 Playwright E2E** — browse → dates → form → offers → login → book;
      provider signup → listing → evidence → verification → live; offline itinerary read. **L**
- [ ] **8.8 Error and empty states** — every list, every async region, every failure path.
      Skeletons, not spinners. **M**
- [ ] **8.9 Observability** — Sentry, structured logs, `/api/health`, alerting on booking and
      payment failure rates. **M**

**Checkpoint 8** — installs and works offline for booked trips · all budgets met · WCAG AA ·
E2E green · monitored.

---

## Phase 9 — Retire the legacy stack

- [ ] **9.1 Account parity audit** — confirm the Next.js accounts cover everything the Django +
      CRA accounts do. **M**
- [ ] **9.2 Migrate users off Django** — data migration plus a communication plan. **L**
- [ ] **9.3 Fix or retire the case-sensitivity landmine** — `Frontend/src/App.js` imports both
      `./Pages/Home` and `./pages/PlanTrip`; only `Pages/` exists. Moot once the CRA is gone. **XS**
- [ ] **9.4 Sunset `Frontend/`** — redirect the legacy routes, remove the Vercel project. **M**
- [ ] **9.5 Decommission Django** — after the migration window closes. **M**
- [ ] **9.6 Root `vercel.json` cleanup** — currently builds `Frontend/`. **S**

**Checkpoint 9** — one application, one deployment, one auth system.

---

## Parallel discovery track

Non-code, runs alongside. Informs go/no-go on the later phases.

- [ ] **V1 🧑 Concierge validation** — run ~10 real trip enquiries manually at target margin.
      Record enquiry-to-deposit conversion and three verbatim objections. **M**
- [ ] **V2 🧑⚖️ Payout provider quote** — see task 7.1. Start early; it has a long lead time. **S**
- [ ] **V3 🧑 Veg-verifiability audit** — check whether *every* meal on three real itineraries can
      genuinely be verified. Where it cannot, scope the guarantee to the accompanying-cook tier
      **before** the refund promise is published. **S**
- [ ] **V4 🧑 Provider recruitment** — sign the seed supply: Sattvik By Nature, Darbar, Punjabi
      Grill, Queen's of India, Vinayak, plus transport and guides. Phase 6 is worthless without
      supply. **L**
- [ ] **V5 🧑 Widen the range** — decided: keep pricing open, no floor and no ceiling (spec §2.3).
      The work is sourcing supply to fill it — a lean entry circuit below the ₹39.5k competitor
      anchor, and premium inventory above the current ₹1.45L top. Feeds V4. **M**

---

## Dependency graph

```
Phase 0 ─────────────────────────────► (blocks everything)
   │
Phase 1 (foundations: DB, auth, Tailwind, PWA shell)
   │
Phase 2 (content model + packages)
   │
Phase 3 (calendar) ──┐
   │                 │
Phase 4 (trip request + matching + offers)
   │                 │
Phase 5 (accounts + booking) ◄───┤
   │                             │
Phase 6 (provider onboarding + REQUEST BOARD) ───┘   ◄── needs V4 supply
   │
Phase 7 (payments — Razorpay, DEFERRED)  ◄── V2 + 7.1 + 7.2 (⚖️ hard gate)
   │
Phase 8 (PWA completion + polish)
   │
Phase 9 (retire legacy)

V1–V5 run in parallel throughout.
```

Phases 5 and 6 can run concurrently once Phase 4 lands, by different people. Everything else is
sequential.

---

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Cross-border payout is a hard legal gate | High | Gate Phase 7 on V2 + 7.1; keep v1 manual with a full ledger |
| The veg guarantee cannot be honoured at every meal | High | V3 audit **before** publishing the refund promise; accompanying-cook tier; visible per-meal rating |
| No provider supply when Phase 6 ships | High | V4 recruitment runs from day one. **The request board is worthless with an empty provider side** — an empty board is worse than no board, because a traveller who posts and gets nothing does not come back |
| Competitors anchor 30% cheaper | High | Open price range (§2.3) + V5 supply sourcing; differentiators visible on the card, not buried |
| Traveller PII leaks to providers via the board | High | Board is a projection, not a filtered row (6.20); masked threads (6.24); dedicated test at the API layer (6.16) |
| Bids race to the bottom and erode the veg guarantee | High | Blind bidding, relevance-not-price sorting, compliance weighted equally with price in the comparison |
| Providers take the deal off-platform | High | Masked threads, contact-attempt logging, contacts released only on confirmation |
| Fake or spam demand on the board | Medium | Mobile OTP gate before publishing; per-provider bid quotas; scrape detection |
| Security regressions on new surfaces | High | Phase 0 first; security review on every money and PII change |
| Bundle budget breached by the calendar or shadcn | Medium | CI bundle check in 1.16 fails the build |
| Offline cache serves a stale price | Medium | Availability and price are network-only, enforced by test 8.2 |
| Two frontends maintained in parallel too long | Medium | Phase 9 has a dated window |
| Scope creep from the competitive backlog | Medium | Ship the core flow first; backlog items are gated to their phase |
