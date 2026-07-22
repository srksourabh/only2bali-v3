# Only2Bali — execution to-do list

> The working checklist. Sequenced, with exact file paths, commands, and a done-when for
> every item. Written 2026-07-22, line references verified against the code that day.
>
> - **What to build and why** → `docs/MARKETPLACE-SPEC.md`
> - **Full scope and phases** → `docs/MARKETPLACE-TASKS.md`
> - **This file** → what to do next, in order, starting now.

## How to use this

Work top to bottom. Do not skip ahead — the order encodes real dependencies.

Tags: 🧑 **you do this** (browser, account, phone call — cannot be automated) ·
💻 **code** · ⚖️ **needs a professional** · 🔴 **security, do not defer**

Commit convention: `type: what changed and why` — `feat`, `fix`, `refactor`, `docs`, `test`,
`chore`. Commit at each done-when, not at the end of a sprint.

Before every commit:
```bash
cd only2bali-next && npm run typecheck && npm test && npm run build
```

---

## Sprint −1 — Start these now, they have long lead times

These block later sprints but take weeks of calendar time, not weeks of work. Start them today
and let them run in the background.

- [ ] **🧑⚖️ L1 — Cross-border payout partner.** Contact Razorpay about **PA-CB (Payment
      Aggregator – Cross-Border)** onboarding for India → Indonesia vendor payouts. Ask for:
      written pricing, KYC requirements, purpose-code handling, timeline.
      *Blocks Sprint 12.* Weeks of lead time.
- [ ] **🧑⚖️ L2 — Payments/tax advisor.** Merchant-of-record structure, GST/VAT, travel
      regulation. You hold traveller money and pay Bali vendors — that has a legal shape and it
      is not an engineering decision.
- [ ] **🧑 L3 — Recruit seed providers.** Target the five known veg kitchens (Sattvik By Nature,
      Darbar, Punjabi Grill, Queen's of India, Vinayak) plus 2 transport and 2 guide providers.
      *Sprint 10-11 is worthless without supply on the board.*
- [ ] **🧑 L4 — Veg-verifiability audit.** Take three real itineraries. Meal by meal, can you
      actually verify compliance? Where you cannot, the guarantee must be scoped to the
      accompanying-cook tier — **decide this before publishing any refund promise.**
- [ ] **🧑 L5 — Concierge validation.** Run ~10 real enquiries manually at your target margin.
      Record enquiry-to-deposit conversion and three verbatim objections. This tells you whether
      to build sprints 6+ at all.

---

## Sprint 0 — Security 🔴

**Nothing else starts until this sprint is closed.** Two of these are live, exploitable, and in
a repo that was public.

### S0.1 🧑🔴 Revoke the leaked Zoho credentials

`Backend/journeys/views.py:492-496` contains a live Zoho refresh token, client ID and client
secret. The repo was public. Deleting the lines does **not** revoke them.

1. Log into the Zoho API console.
2. Revoke the refresh token and regenerate or delete the client.
3. Zoho is being dropped as an integration — prefer deleting the client outright.

**Done when:** the old refresh token returns an auth error when exercised.

### S0.2 🧑🔴 Rotate the leaked SMS key

`Backend/users/serializers.py:67` — SpringEdge `API_KEY`. Still in use for OTP, so rotate rather
than revoke.

1. Rotate in the SpringEdge dashboard.
2. Put the new key in Azure App Service application settings as `SPRINGEDGE_API_KEY`.

**Done when:** the old key is rejected; the new key exists only in environment settings.

### S0.3 💻🔴 Fix the unauthenticated delete endpoint

`Backend/journeys/views.py:465`. Today it is:

```python
class DeleteJourneyPreferences(APIView):
    def delete(self, request, journey_preferences_id):
        journey_preference = JourneyPreferences.objects.get(id=journey_preferences_id)
        journey_preference.delete()
```

No `permission_classes`. No owner check. Any unauthenticated caller can delete any journey by
guessing an ID.

- Add `permission_classes = [IsAuthenticated]`, matching the pattern already used at lines 20,
  71, 192, 325 and 413 of the same file.
- Scope the lookup to the caller: `JourneyPreferences.objects.get(id=..., user=request.user)`.
- Set a safe global default in `Backend/only2bali/settings.py` so no future endpoint defaults to
  public:
  ```python
  REST_FRAMEWORK = {
      "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
  }
  ```
- Then re-check every existing view still works — a global default will expose any view that was
  silently relying on being open.

**Done when:** unauthenticated delete → 401 · another user's ID → 404 · own ID → 200.

### S0.4 💻 Move the secrets to environment variables

Replace the literals with `os.environ` reads, mirroring the pattern `settings.py` already uses.
Delete the Zoho calling code entirely (dropped integration) rather than env-ifying it.

**Done when:** `git grep -nE "1000\.|146344s"` returns nothing.

### S0.5 💻🔴 Harden the OTP

`Backend/users/views.py` — codes are 4-digit, cached in plaintext, compared with `!=`. Hardened
`OTP` / `OTPAuditLog` / `RateLimitLog` models already exist in `Backend/users/models.py` and are
never imported. Wire them in: 6 digits, hashed at rest, constant-time compare, attempt cap,
single-use, short expiry.

**Done when:** wrong code 5× locks the identifier · a used code cannot be replayed · no plaintext
code in Redis.

### S0.6 💻 Rate-limit the auth endpoints

Same files as S0.5, do them together. Throttle OTP request and login per identifier **and** per
IP. Stops SMS flooding — which costs you real money.

**Done when:** rapid repeated OTP requests return 429.

### S0.7 💻 Guard the AI planner route

`only2bali-next/app/api/planner/route.ts` — public, unauthenticated, calls a paid model.

- Zod-validate the request body, cap its size.
- Zod-validate the **model's response** before returning it.
- 1.5 s timeout, fall back to a curated itinerary.
- Rate-limit per IP.

**Done when:** oversized body → 400 · malformed model response → curated fallback, no crash ·
rapid calls → 429.

### S0.8 🧑💻 Replace the placeholder contacts

Real customers are hitting these right now:

| File | Line | Value |
|---|---|---|
| `only2bali-next/lib/config.ts` | 3 | `whatsapp: "6281200000000"` |
| `only2bali-next/lib/config.ts` | 4 | `email: "hello@only2bali.com"` |
| `only2bali-next/app/layout.tsx` | 67 | hardcoded `wa.me/6281200000000` |
| `only2bali-next/app/layout.tsx` | 68 | hardcoded `mailto:hello@only2bali.com` |

Fix `config.ts`, then make `layout.tsx` import from it instead of hardcoding.

**Done when:** a test enquiry reaches a real inbox and a real WhatsApp.

### S0.9 💻 Delete the dead FastAPI app

`Backend/app/` — no auth on any route, not deployed, its own SQLite DB. Delete it.

### S0.10 💻 Correct `SECURITY_FIXES.md`

It claims OTP hardening and secret removal that never reached the view layer. After S0.1-S0.6 it
can finally say something true.

**Sprint 0 closes when:** no secret literal in source, both revoked/rotated at the provider ·
delete endpoint rejects unauthenticated and non-owner · OTP hardened and throttled · AI route
guarded · leads reach a real destination · Django boots, Next.js builds.

---

## Sprint 1 — Take control of hosting 🧑

- [ ] **S1.1 🧑** Accept the GitHub collaboration; confirm you administer the repo.
- [ ] **S1.2 🧑** Grant the Vercel GitHub App access to `srksourabh/only2bali-v3`.
- [ ] **S1.3 🧑** Import to Vercel with **Root Directory = `only2bali-next`**. Leaving it blank
      builds the legacy CRA instead — this is exactly what the live site does today.
- [ ] **S1.4 🧑** Set `GEMINI_API_KEY` in Vercel environment variables. Without it the planner
      silently serves a mock itinerary.
- [ ] **S1.5 🧑** Point the domain at the new deployment. Verify the old
      `only2bali-v3-0.vercel.app` (running from someone else's account) is no longer the
      customer-facing entry point.
- [ ] **S1.6 💻** Merge the docs branch. `claude/codebase-review-architecture-8d3bb1` holds
      `PLATFORM-PLAN.md`, `ASSUMPTIONS.md`, `IDEAS.md`, `plans/`, `tasks/` — none of it is on
      `main`.

**Closes when:** production serves the Next.js app from your Vercel account and the planner
returns a real, non-mock itinerary.

---

## Sprint 2 — Design drift and performance 💻

No backend. Safe, visible wins. Nothing here changes the visual identity.

- [ ] **S2.1** Delete the Montserrat override — `only2bali-next/app/globals.css:102` (the CDN
      `@import`) and `:105` (`font-family: 'Montserrat' … !important`). It is fighting the Inter
      that `app/layout.tsx` already loads properly via `next/font`.
      *Done when:* no Montserrat network request; body computes to Inter, headings to Fraunces.
- [ ] **S2.2** Add the token scale to `globals.css`: `--r-sm/--r/--r-lg/--r-pill`, `--cocoa:#4b352d`,
      `--saffron-l:#f6b85a`, `--veg-green/amber/red`. **No new colours** — `--cocoa` and
      `--saffron-l` are hex values already inline in `page.tsx`.
- [ ] **S2.3** Replace inline hex with tokens across `app/page.tsx` (~30 occurrences).
      *Done when:* no raw hex in the component; rendering is pixel-identical.
- [ ] **S2.4** Compress `public/Asset/COOK.png` and `TOURGUIDE.png` (~6.7 MB each) to WebP, plus
      the multi-MB section backgrounds. **Same artwork, same crop — compression only.**
- [ ] **S2.5** Convert `<img>` to `next/image` with explicit dimensions across `app/page.tsx`.
      *Done when:* Lighthouse LCP and CLS both improve against a recorded baseline.
- [ ] **S2.6** Make `app/page.tsx` a server component. It is currently `"use client"` (line 1)
      for a single filter — extract that into a small client island.
- [ ] **S2.7** Fix the planner's click-only `<div>` selection cards in
      `app/planner/page.tsx` — real `<button>` / `role="radio"`, keyboard operable.
- [ ] **S2.8** SEO: per-page `metadata`, `metadataBase`, `app/sitemap.ts`, `app/robots.ts`,
      correct OG domain.

**Closes when:** one body font · tokens in place · images optimised · homepage is a server
component · Lighthouse improved · site looks identical to before.

---

## Sprint 3 — Backend foundations 💻

- [ ] **S3.1 🧑💰** Provision Postgres — Neon recommended (branch-per-PR, generous free tier).
      Dev, preview, prod branches.
- [ ] **S3.2** Install and configure Drizzle.
      ```bash
      cd only2bali-next
      npm i drizzle-orm postgres zod
      npm i -D drizzle-kit
      ```
      Create `lib/db/index.ts`, `lib/db/schema/`, `drizzle.config.ts`. Add scripts:
      `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`.
- [ ] **S3.3** Create the layering, and enforce it in review:
      `lib/repositories/` (Drizzle only) · `lib/services/` (pure logic, no `request`) ·
      `lib/validators/` (Zod, shared client + server).
- [ ] **S3.4** API envelope `{ success, data?, error?, meta? }` and error classes
      (`NotFoundError`, `UnauthorizedError`, `ValidationError`, `RateLimitError`).
- [ ] **S3.5 🧑** Provision Vercel KV — rate limits, sessions, seat holds.
- [ ] **S3.6** Passwordless auth: `account`, `otp_code`, `session` tables; request-OTP and
      verify-OTP routes; **httpOnly + Secure + SameSite=Lax cookie sessions**.
      Explicitly *not* JWT in `localStorage` — that is the known defect in the legacy app.
      *Done when:* OTP hashed, attempt-capped, single-use · session cookie unreadable from JS ·
      role guard middleware works for `traveller` / `vendor` / `admin`.
- [ ] **S3.7** Structured logging with a request ID. No `console.log`.
- [ ] **S3.8** CI: GitHub Actions running lint → typecheck → `vitest run` → build →
      **bundle budget check that fails over 170 KB gz per route**.
- [ ] **S3.9** ADR-004 — record the Tailwind + shadcn/ui decision. `docs/DESIGN.md` currently
      forbids Tailwind without one. Set up Tailwind themed with the existing tokens; scope it to
      new marketplace surfaces only.
- [ ] **S3.10** PWA shell: `app/manifest.ts` (emerald theme, ivory background, icons from the
      existing logo — no new artwork), `@serwist/next`, precached shell, branded offline page.
      *Done when:* Lighthouse reports installable; the shell loads with the network off.

**Closes when:** you can log in passwordlessly on a Postgres-backed Next.js app, CI is green, the
site installs as a PWA, and it still looks unchanged.

---

## Sprint 4 — Content model 💻

- [ ] **S4.1** Schema: `circuit`, `point_of_interest`, `place`. Seed Ramayana, Adventure,
      Culinary, Artistic with the real anchors from spec §3.
- [ ] **S4.2** Schema: `package` + `package_circuit`, `package_place`, `package_inclusion`,
      `package_highlight`, `package_day`, `package_day_place`, `package_day_meal`,
      `package_price_tier`.
- [ ] **S4.3** Migrate `only2bali-next/lib/catalog.ts` into the database. All six packages,
      expanded: nights, places, inclusions, exclusions, **why-choose USP bullets**, structured
      integer price, day-by-day parsed from the existing `outline` strings.
      *Done when:* `lib/catalog.ts` is deleted, all reads come from Postgres, and
      `lib/recommend.test.ts` still passes against DB rows.
- [ ] **S4.4** Package repository + service. Filters: circuit, protocol, tier, days, month, group
      size, and **open-ended price min/max**.
      *Done when:* no enforced price floor or ceiling; `tier` is never a price boundary.
- [ ] **S4.5** Public APIs: `/api/packages`, `/api/packages/[slug]`, `/api/circuits`,
      `/api/circuits/[key]`.
- [ ] **S4.6** `PackageCard` — spec §6.2. Name, `Xd/Yn`, places, compliance badges, language
      chips, from-price, next departure.
- [ ] **S4.7** `VegComplianceBadge` — green/amber/red, always colour **plus** icon **plus** text.
- [ ] **S4.8** `/packages` browse page. Price presets over an open range, not fixed buckets.
- [ ] **S4.9** `/packages/[slug]` detail page — every block in spec §6.3.
- [ ] **S4.10** `/circuits` and `/circuits/[key]`.
- [ ] **S4.11** Homepage circuit strip, inserted after the hero. Everything else on the homepage
      untouched.
- [ ] **S4.12** `/verify` — "How we verify every kitchen". Differentiator, and an SEO asset.

**Closes when:** every package is served from Postgres with days, nights, places, inclusions, USP
bullets and a real price, and `lib/catalog.ts` no longer exists.

---

## Sprint 5 — Calendar 💻

- [ ] **S5.1** Schema: `departure`, `availability`, `blackout_date`, `seat_hold`.
- [ ] **S5.2** Seed 12 months of departures per package with seasonal pricing and seat counts.
- [ ] **S5.3** `GET /api/packages/[slug]/availability?from&to` → per-date price, seats, status.
      **Never cached.**
- [ ] **S5.4** `DeparturePicker` — month grid, price under each date, seats-left when ≤ 5,
      disabled sold-out and past dates, peak dates in saffron, return date auto-derived from
      `nights`.
      *Done when:* fully keyboard operable (arrows by day, PageUp/Down by month) and availability
      plus price are announced to screen readers. Record the measured bundle cost.
- [ ] **S5.5** `DateRangePicker` — custom trips, min-nights enforced, **"flexible — pick a month"**
      escape hatch, blackout dates disabled with a reason.
- [ ] **S5.6** Seat-hold service with TTL and automatic release.
      *Done when:* a concurrency test proves two simultaneous holds cannot oversell the last seat.
- [ ] **S5.7** Wire "Check dates" on the package page through to the wizard.

**Closes when:** real dates, real prices, real seat counts, and a sold-out date cannot be
selected or oversold.

---

## Sprint 6 — Trip request and matching 💻

- [ ] **S6.1** Schema: `trip_request`, `lead`, `itinerary`. Include the DB check constraint
      `cook_required = true → group_size >= 10`.
- [ ] **S6.2** `TripRequestWizard` — six steps (spec §6.5), resumable, no signup wall. Step 6
      (post to providers) is built but stays disabled until Sprint 10.
- [ ] **S6.3** `POST /api/trip-requests` — writes `trip_request` + `lead` atomically,
      rate-limited.
      *Done when:* every submission produces a lead row even if a downstream step fails.
- [ ] **S6.4** Matching engine — extend `lib/recommend.ts` onto DB rows. Circuit filter →
      **hard protocol filter** → date availability → capacity → scoring.
      *Done when:* a unit test proves a non-compliant package is never returned at any score.
- [ ] **S6.5** `offer` schema and system-match generation. Price snapshotted into `line_items`.
- [ ] **S6.6** `/plan/[id]/offers` — `OfferComparison`, delta-highlighted, identical rows
      collapsed.
- [ ] **S6.7** `/plan/[id]/offers/[offerId]` with `PriceBreakdown`.
- [ ] **S6.8** AI itinerary hardening — structured prompt, Zod-validated output, **protocol
      re-check on the generated content**, curated fallback.
      *Done when:* a fixture where the model returns a non-veg venue fails closed to the curated
      itinerary.
- [ ] **S6.9** Save and share — no-login link + PDF export.
- [ ] **S6.10** `/admin/leads` — list, filter, status, notes, assign. **No CRM integration.**

**Closes when:** a traveller fills the form and sees multiple real priced offers, every
submission is a workable lead, and nothing non-compliant can appear.

---

## Sprint 7 — Traveller accounts and booking 💻

- [ ] **S7.1** `traveller` profile schema.
- [ ] **S7.2** OTP login UI — request, verify, resend with cooldown.
- [ ] **S7.3** Claim an anonymous trip after login.
- [ ] **S7.4** `/account` — trips, bookings, saved packages, documents.
- [ ] **S7.5** Schema: `booking`, `booking_traveller`, `booking_document`,
      `cancellation_policy`.
- [ ] **S7.6** Accept-offer flow. **Price recomputed server-side; a client-supplied amount is
      ignored.** Seat hold consumed, booking created.
      *Done when:* a test proves a tampered client price has no effect.
- [ ] **S7.7** `BookingStepper` — payment-less for now; booking reaches `pending_payment` and
      settlement happens offline. No dead-end UI.
- [ ] **S7.8** Traveller details capture. Passport numbers encrypted at rest.
- [ ] **S7.9** Voucher, invoice and itinerary PDF generation.
- [ ] **S7.10** `/account/trips/[id]` — itinerary, vouchers, provider contacts.
- [ ] **S7.11** Cancellation, policy-driven, refund computed server-side.
- [ ] **S7.12** Reviews — verified-booking-gated, with the "was the veg guarantee kept?" field.
- [ ] **S7.13** Notifications — email and WhatsApp on confirmation and reminders.

**Closes when:** a traveller logs in, accepts an offer, and holds a confirmed booking with
documents.

---

## Sprint 8-9 — Provider onboarding 💻

- [ ] **S8.1** Schema: `vendor`, `vendor_highlight`, `vendor_document`, `service_listing`,
      `listing_circuit`, `listing_compliance`.
- [ ] **S8.2** `/partner` — rewrite the static `/vendors` pitch into a real funnel: value
      proposition, commission transparency, payout SLA.
- [ ] **S8.3** `/partner/signup` — passwordless, creates `account(role=vendor)`.
- [ ] **S8.4** `OnboardingStepper`, resumable, progress in `vendor.onboarding_step`.
- [ ] **S8.5** Step 1 — business basics, type, area, languages, logo.
- [ ] **S8.6** Step 2 — `ListingForm`: title, type, circuits, capacity, price + unit, photos.
- [ ] **S8.7** Step 3 — `ComplianceEvidenceUpload`: per listing, per protocol, with evidence.
- [ ] **S8.8** Step 4 — payout account, tokenised. Deferrable; blocks payouts, not listing.
- [ ] **S8.9 🔴** File upload security — type and size validation, virus scan, stored off the app
      origin, never executable, signed URLs for reads.
- [ ] **S9.1** `vendor_highlight` — provider USP, **admin-moderated at verification** so nobody
      self-awards "100% Jain certified".
- [ ] **S9.2** `/admin/verification` — queue, evidence viewer, green/amber/red per listing per
      protocol, approve/reject with reason, set commission rate.
      *Done when:* a test proves an unverified listing never enters matching.
- [ ] **S9.3** Compliance expiry — a lapsed record silently drops the listing out of matching.
- [ ] **S9.4** `/partner/dashboard` — bookings, departures, payouts, rating, verification status.
- [ ] **S9.5** `AvailabilityCalendarEditor` — provider edits dates, blocks, price overrides.
- [ ] **S9.6** Provider booking confirmation.
- [ ] **S9.7** `/providers` directory and `/providers/[slug]`, verified only.
- [ ] **S9.8 🔴** PII boundary — traveller contacts released only on booking confirmation.
      *Done when:* a test at the **API layer** proves a provider cannot read traveller name,
      phone, email or address before confirmation.

**Closes when:** a provider self-onboards unaided, an admin verifies, and their listings go live
in matching — with nothing unverified ever publicly visible.

---

## Sprint 10-11 — The request board 💻

Requires real providers on the platform (L3). An empty board is worse than no board.

- [ ] **S10.1** Posting schema on `trip_request`: `visibility`, `published_at`, `bids_close_at`,
      `budget_min`/`budget_max` (**both independently nullable** — that is what keeps the range
      open), `budget_basis`, `special_requirements`, `requirement_tags`, `mobile_verified`.
      Plus `request_invite`, `request_board_view`.
      Check constraint: publishing requires `mobile_verified = true`.
- [ ] **S10.2** `PostRequestPanel` — wizard step 6 goes live. Budget band, special requirements,
      deadline (default 7 days, 2-21 adjustable), visibility. Mobile OTP gate before publishing.
- [ ] **S10.3 🔴** Board projection service. Build it as a **projection, not a filtered row** —
      contact columns are never selected. Eligibility: verified **and** verified for this
      protocol **and** capacity covers the group, reusing the matching engine's compliance rule
      rather than copying it.
      *Done when:* a provider not verified for Jain cannot see a Jain request through any
      endpoint — asserted on the raw API response, not the rendered page.
- [ ] **S10.4** `/partner/requests` — board, filters, countdown, viewing count, sorted by fit.
- [ ] **S10.5** `ProposalBuilder` — provider sets `vendor_net_amount`; **the platform derives the
      traveller-facing total.** Creates `offer(origin='vendor_bid')`.
      *Done when:* a test proves a provider cannot set the traveller price by any input.
- [ ] **S11.1** `proposal_quota` — bid limits tiered by verification age and rating, start at 5
      active. **Blind bidding: no provider sees another's amount.**
- [ ] **S11.2** `MaskedThread` — `body_raw` stored, `body_masked` served with phone numbers,
      emails and URLs stripped; `contact_attempt_detected` logged; unmasks on confirmation.
      *Done when:* a message with a phone number and a URL renders masked to both parties —
      test covers Indian and Indonesian number formats.
- [ ] **S11.3** Merged comparison — system matches and provider bids in one view, labelled by
      origin, **sorted by relevance not price**. Shortlist, request revision, decline with reason.
- [ ] **S11.4** Bid lifecycle — accept closes the request and notifies unsuccessful bidders
      (this is what keeps them bidding again) · deadline auto-close · draft expiry · withdraw ·
      response rate tracked.
- [ ] **S11.5** Abuse controls — scrape detection, admin takedown, provider suspension.

**Closes when:** a traveller publishes a request, eligible providers bid, the traveller compares
bids next to system matches and accepts one — with no PII leaving the platform.

---

## Sprint 12 — Payments (Razorpay) 💻⚖️

Blocked on L1 and L2. Do not start the payout half without them.

- [ ] **S12.1 🧑** Commission rate decision. **Needed earlier than this sprint** — S10.5 derives
      the traveller price from the provider net using it. A working default unblocks Sprint 10.
- [ ] **S12.2** Money schema: `payment`, `payment_schedule`, `vendor_payout_account`, `payout`
      (**with `rbi_purpose_code` from day one**), `ledger_entry`, `refund`.
- [ ] **S12.3 💰** Razorpay integration — checkout, capture, idempotency keys,
      signature-verified webhooks. Keys in environment variables only.
- [ ] **S12.4** Deposit + instalment schedule with reminders.
- [ ] **S12.5** Ledger and reconciliation.
      *Done when:* an automated check proves charge = commission + payout for every booking.
- [ ] **S12.6 ⚖️** Payout run — hold until vouchers are issued, then approve and pay. Manual for
      v1, ledger written either way.
- [ ] **S12.7** Refunds — refund-first-from-platform, claw-back-from-provider, with
      `veg_guarantee_failure` as a first-class reason.
- [ ] **S12.8** Payment security review.

---

## Sprint 13 — PWA completion and hardening 💻

- [ ] **S13.1** Offline booking bundle cached to IndexedDB: itinerary, vouchers, addresses,
      provider phone numbers, emergency contacts.
      *Done when:* with the network fully off, a confirmed booking is completely readable.
- [ ] **S13.2** Caching strategy enforcement — **availability, price, auth, payment and booking
      writes are network-only.**
      *Done when:* a test proves a stale price or sold-out seat can never be served.
- [ ] **S13.3** Background Sync for safe idempotent writes only. Never payments or bookings.
- [ ] **S13.4** `InstallPrompt` on second visit or after a trip request.
- [ ] **S13.5** Performance pass against the budget — TTFB ≤ 200 ms, LCP ≤ 2.5 s, INP ≤ 200 ms,
      ≤ 170 KB gz per route.
- [ ] **S13.6** Accessibility audit — WCAG 2.2 AA, keyboard-only pass through wizard, calendar
      and checkout, saffron never on small text, `prefers-reduced-motion` disables the cursor.
- [ ] **S13.7** Playwright E2E — browse → dates → form → offers → login → book · provider signup
      → listing → evidence → verification → live · post request → bid → accept · offline
      itinerary read.
- [ ] **S13.8** Observability — Sentry, `/api/health`, alerting on booking and payment failures.

---

## Sprint 14 — Retire the legacy stack 💻

- [ ] **S14.1** Account parity audit — Next.js accounts must cover everything Django + CRA do.
- [ ] **S14.2** Migrate users off Django, with a communication plan.
- [ ] **S14.3** Sunset `Frontend/` — redirect legacy routes, remove the Vercel project.
      (This also retires the case-sensitivity landmine in `Frontend/src/App.js`, which imports
      both `./Pages/Home` and `./pages/PlanTrip` when only `Pages/` exists.)
- [ ] **S14.4** Decommission Django after the migration window.
- [ ] **S14.5** Clean up the root `vercel.json`, which still builds `Frontend/`.

**Closes when:** one application, one deployment, one auth system.

---

## Start here, today

1. **S0.1** — revoke the Zoho credentials. Ten minutes in a browser. They are live and were public.
2. **S0.2** — rotate the SMS key.
3. **L1** and **L3** — send the Razorpay email and the first provider messages. Long lead times,
   zero effort to start.
4. Then work S0.3 → S0.10 as code.

Sprint 0 is the only sprint with a hard "do not proceed" gate. Everything after it can flex on
scope, but not that.
