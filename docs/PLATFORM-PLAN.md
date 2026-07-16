# Only2Bali - master build-out plan (single, phased)

> The single source of truth for the platform build-out. The main body is the approved,
> phased programme; the appendices carry the detailed schema, payment flow, enlistment flows,
> and seed supply for execution. Approved 2026-07-16.

## Context

Only2Bali sells fully-managed, 100% vegetarian, own-language (Tamil/Hindi) guide-led group
trips to Bali for Indian travellers worldwide - airport pickup, roam Bali, airport drop.
Founder Loganathan has confirmed the direction: turn today's questionnaire-that-emails-Zoho
into a **managed two-sided marketplace** organised around **four themed circuits**, where
**Only2Bali holds the money and pays vendors a margin-net amount**.

A full codebase review (2026-07-16) found the product is four apps in one repo with real
security debt (an unauthenticated delete-any-trip endpoint, a brute-forceable OTP, hardcoded
credentials), a live "100% veg" promise that isn't actually enforced in code, and every lead
from the new site going to placeholder contacts. This plan consolidates everything into one
phased programme: fix the urgent risks, take control of hosting, then build the marketplace on
the Next.js stack, preserving and polishing the existing look and feel.

**Locked decisions (2026-07-16):**
- Backend = **Next.js full-stack** (Postgres + ORM on Vercel), migrating off legacy Django
  gradually. Delete the dead FastAPI app.
- v1 = **curated matcher** (Only2Bali enlists/verifies vendors; self-onboarding later).
- Payment model = **managed marketplace / merchant of record** (money routes through Only2Bali,
  margin kept, vendors paid out).
- Four circuits (**Ramayana, Adventure, Culinary, Artistic**) are first-class.
- Traveller **accounts-lite** (passwordless) built in Next.js.
- Look & feel = **preserve & polish** the current identity.
- New marketplace UI = **Tailwind + shadcn/ui themed with existing tokens** (needs ADR-004).

Loganathan's five tasks map to the phases: (1) fix Vercel + go live, (2) take over the GitHub
repo, (3) payment gateway, (4) marketplace with two logins, (5) the four circuits.

---

## The four circuits (product spine)

A `circuit` is a first-class object; packages, listings and points-of-interest tag to it, and
travellers pick one as planning step 1. Real Bali supply already exists to seed each:
- **Ramayana** - Kecak Fire Dance at Uluwatu; temple circuit (Tanah Lot, Besakih, Tirta Empul,
  Lempuyang); Ubud Barong/Ramayana ballet.
- **Adventure** - Ayung rafting, ATV + jungle trek, Mount Batur sunrise, Nusa Penida snorkelling,
  glass bridge, jungle swings.
- **Culinary** - vegetarian food trail; seed vendors: Sattvik By Nature, Darbar (separate 100%
  veg kitchen), Punjabi Grill, Queen's of India, Vinayak.
- **Artistic** - wood-carving, sculpture and painting workshops with local artisans.

---

## Design system - preserve & polish (the look and feel)

The identity is strong and stays. The work is to remove drift and make it consistent and fast,
then extend it into marketplace screens.

**Keep (the identity):**
- Palette (tokens in `globals.css:1-5`): emerald `#0e4f44` / `#093830`, saffron `#e8941a` /
  `#c97a0a`, ivory `#faf6ee`, cream `#f3ecdd`, ink `#1d2a27`, muted `#5d6f6a`, line `#e3dccb`,
  ok `#1e7d4f`, err `#c0392b`. Emerald-tinted shadow, pill (`99px`) buttons/chips.
- Fraunces display headings; Bali hero photography + friendly chef/guide illustrations
  (`COOK.png`, `TOURGUIDE.png`); the custom cursor (`app/components/CustomCursor.tsx`);
  multilingual Indian-script chips; the warm editorial mood.

**Fix (drift found in the review + design exploration):**
- **Fonts:** remove the Montserrat CDN `@import` + `body{...!important}` (`globals.css:102-106`).
  Standardise the body face on **Inter** (already wired via `next/font` in `app/layout.tsx`,
  matches the `index.html` benchmark and DESIGN.md). One display + one body face, via CSS vars.
- **Radius drift:** reconcile 14px vs 20px cards into a token scale (`--r-sm/--r/--r-lg`).
- **Inline hardcoded hex** (`#4b352d`, `#f6b85a`, mint tints) → move into tokens; stop scattering
  colours in `style={{}}`.
- **Images:** `COOK.png` / `TOURGUIDE.png` are ~6.7MB each; many section backgrounds are multi-MB.
  Convert to optimised WebP and render via `next/image` (replaces raw `<img>`) - big LCP/CLS win
  on Indian mobile connections.
- **Accessibility:** the planner's click-only `<div>` selection cards get real
  `button`/`role`/keyboard support; keep saffron for large text/fills only (WCAG per DESIGN.md).
- **SEO:** add per-page metadata, `sitemap.ts`, `robots.ts`, `metadataBase`, and fix the OG `url`
  to the live domain.

**Extend (marketplace UI):** adopt **Tailwind + shadcn/ui** for the new surfaces (vendor and
traveller dashboards, listing management, checkout, admin verification queue), themed with the
tokens above (map emerald/saffron/ivory into the Tailwind theme; Fraunces/Inter as font vars).
Marketing pages stay on the polished existing CSS and migrate opportunistically. This needs
**ADR-004** because DESIGN.md currently forbids Tailwind without one.

---

## Architecture & data model (summary)

**Stack:** Next.js App Router (server components by default) + Postgres via an ORM
(Prisma/Drizzle) + Vercel KV for rate-limit/session, on Vercel. One auth layer (passwordless),
httpOnly server sessions - not JWT-in-localStorage.

**Core schema (condensed; money always integer minor units, never float; full detail in
Appendix A):**
- **Identity:** `account` (email/mobile, role `traveller|vendor|admin`), `session`.
- **Traveller:** `traveller`; `trip_request` (**circuit_id**, protocol [hard filter], tier,
  group_size, crew_type, dates, interests, kitchen/cook); `itinerary`
  (source, `compliance_checked`, days jsonb schema-validated).
- **Vendor:** `vendor` (business, `vendor_type` = restaurant|accommodation|transport|guide|cook|
  produce|artisan|activity_operator|tour_agency; languages; `verification_status`;
  `commission_rate`); `service_listing` (circuits M2M, area, capacity, tier, price + unit,
  currency); `listing_compliance` (protocol, guarantee_level, evidence_url, **verified_by admin**);
  `availability`.
- **Circuit spine:** `circuit`, `point_of_interest`, `package` (migrates `lib/catalog.ts` into DB).
- **Glue:** `lead` (server-written on every intent), `quote`, `booking` (**server-recomputed
  price**), `review`.
- **Money:** `payment` (traveller in), `vendor_payout_account` (tokenised), `payout`
  (gross/commission/net), `ledger_entry` (append-only).

**Matching + compliance engine (wires in the currently-dead `lib/recommend.ts`):** circuit filter
→ **hard verified-veg filter** → score (tier/interest/kitchen/language/cook) → AI itinerary that
is **schema-validated and protocol-checked** before it is ever labelled compliant. Rate-limit +
validate the public AI route (`app/api/planner/route.ts`).

---

## What we can upgrade (consolidated)

| Area | Upgrades |
|---|---|
| Security | Auth on delete endpoint; passwordless/hashed rate-limited OTP; rate limits on auth + AI routes; rotate Zoho + SMS secrets; secrets to env; server sessions |
| Product | Four circuits; enforced veg compliance; working lead capture + CRM; save/share/PDF itineraries; vendor & traveller dashboards; payments |
| Performance | `next/image` + WebP for the multi-MB assets; server components for the marketing page (currently all client); trim the always-on cursor RAF; bundle budget |
| Design | Font reconciliation; token scale for radius/colours; remove inline hex; Tailwind+shadcn design system for dashboards |
| SEO | Per-page metadata, sitemap, robots, correct OG/domain |
| Code quality | Remove `any` at input boundaries; validate AI output shape; add Vitest + CI; delete FastAPI dead code |
| Infra | Own Vercel account; `GEMINI_API_KEY` set; Root Directory `only2bali-next` |

---

## Phased delivery

Each phase ships something usable. Design fixes and upgrades are woven into the phase where they
naturally land, not saved for the end.

### Phase 0 - Security hardening (now, independent)
Rotate Zoho (`Backend/journeys/views.py:495-537`) + SpringEdge SMS (`Backend/users/serializers.py:67`)
credentials at the providers; add an auth + ownership check to `DeleteJourneyPreferences`
(`Backend/journeys/views.py:467`); fix placeholder WhatsApp/email in `only2bali-next/lib/config.ts`
and `app/layout.tsx:67`; add rate limiting + input validation to `app/api/planner/route.ts`.

### Phase 1 - Take control + go live *(Tasks 1 & 2)*
Accept the GitHub collaboration and take over the repo; move production to our own Vercel with
Root Directory `only2bali-next` and `GEMINI_API_KEY` set; confirm the live site. Land the quick
design drift-fixes that need no backend: remove the Montserrat override (`globals.css:102-106`),
start image optimisation (`next/image` + WebP for `COOK.png`/`TOURGUIDE.png`/section bgs), add
metadata/sitemap/robots.

### Phase 2 - Foundations
Stand up Postgres + ORM + passwordless auth + Vercel KV; **ADR-004** and set up Tailwind +
shadcn/ui themed with the tokens; seed lookups **including the four circuits, POIs, and the real
seed vendors**; migrate `lib/catalog.ts` into `package`/`service_listing`. Build the token scale
and reconcile radius/colour drift here.

### Phase 3 - Circuits + traveller side *(Tasks 4-traveller & 5)*
Circuit picker as planning step 1 → upgraded planner → **compliance-checked, circuit-themed
itinerary** (validate Gemini output) → server-side lead capture → traveller accounts-lite →
save/share/PDF. Polish the marketing pages (a11y fixes on selection cards, server-component the
static home sections).

### Phase 4 - Vendor side *(Task 4-vendor)*
Vendor accounts + onboarding + **admin verification queue** (evidence-checked veg compliance);
curated listings go live in circuit-aware matching; vendor dashboard on shadcn/ui.

### Phase 5 - Payments *(Task 3)*
Booking → server-priced quote → traveller pays Only2Bali → margin deducted → vendor payout +
ledger → reviews. Adopt the travel-standard patterns (Appendix E-E): **deposit + instalment**
plan (travel norm; ~+30-40% conversion), **split-payment / commission-at-capture** (Stripe
destination charges or Razorpay Route), **hold the vendor payout until confirmation vouchers are
issued** (escrow / fraud control), and **refund-first-from-platform, claw-back-from-vendor**.
Start manual/hybrid; automate as volume grows.
**⚠ Compliance gate (not optional, not just advice):** cross-border payout India→Indonesia must
route through an **RBI PA-CB (Payment Aggregator - Cross-Border) licensed provider** (e.g.
Razorpay) or an AD Category-I bank, with **RBI purpose codes** on every payout (bake a
purpose-code field into `payout` from day one); LRS does not apply to a company. Only2Bali
**cannot self-build** a "pay Bali vendors from India" rail. Resolve with a licensed partner +
payments/legal advisor before any payout goes live - this shapes the Phase 5 architecture.
*(Still open: provider, default commission rate, legal structure.)*

### Phase 6 - Retire legacy
Migrate remaining users off Django; delete the FastAPI app; sunset the React frontend.

---

## Critical files to create / modify (representative)

- **Security (Phase 0):** `Backend/journeys/views.py`, `Backend/users/views.py`,
  `Backend/users/serializers.py`, `only2bali-next/lib/config.ts`,
  `only2bali-next/app/layout.tsx`, `only2bali-next/app/api/planner/route.ts`.
- **Design polish:** `only2bali-next/app/globals.css` (tokens, remove Montserrat), `app/layout.tsx`
  (fonts, `next/image`), `app/page.tsx` (server components, `next/image`), `app/planner/page.tsx`
  + `planner.css` (a11y selection cards).
- **New backend (Phase 2+):** `only2bali-next/lib/db/` (ORM schema/migrations),
  `only2bali-next/lib/auth/`, `only2bali-next/lib/recommend.ts` (wire in over DB rows),
  `only2bali-next/app/api/**` (auth, listings, quotes, bookings, payments, webhooks),
  `only2bali-next/app/(dashboard)/**` (vendor/traveller/admin), `docs/ADR/adr-004-tailwind.md`.
- **Reuse:** `lib/recommend.ts` scoring, `lib/config.ts` `wa()`/`mailto()` helpers,
  `CustomCursor.tsx`, the existing token block and component CSS.

---

## Verification

- **Phase 0:** confirm `DELETE /api/journeys/journey_preferences/delete/<id>/` returns 401/403
  without a valid owner token; confirm the AI route rejects oversized/malformed bodies and
  rate-limits; confirm secrets no longer appear in source and are rotated at the provider.
- **Design:** `npm run dev` in `only2bali-next`; verify one body font (no Montserrat), consistent
  radii, and run Lighthouse for LCP/CLS before/after image optimisation; keyboard-only pass
  through the planner wizard.
- **Backend/marketplace:** `npm test` (Vitest) for `recommend.ts` over DB rows and for
  AI-output validation; drive each flow end-to-end in the browser (circuit pick → itinerary →
  lead → account → quote → booking); check the ledger balances (charge = commission + payout).
- **Payments:** test-mode transaction proving money-in → margin → payout, with `payout`/`ledger`
  rows written and price server-recomputed (client-sent price ignored).
- **CI:** Vitest runs in CI on `only2bali-next`; add a Django test step.

Phase 0 starts immediately; Phases 1-2 can start given the locked decisions. Payments provider,
commission rate, and legal structure remain open and are only needed by Phase 5.

---
---

# Appendices (execution detail)

## Appendix A - Full schema

UUID `id`, `created_at`, `updated_at` on every table. Money is always **integer minor units**
(paise/cents/sen), never float.

### A.1 Identity
- **`account`** - email (unique), mobile (unique, nullable), role (`traveller`|`vendor`|`admin`),
  status, email_verified_at, last_login_at. **Passwordless** (magic link / 6-digit hashed,
  attempt-limited OTP).
- **`session`** - account_id, token_hash, expires_at. httpOnly cookie.

### A.2 Traveller
- **`traveller`** - account_id (unique), full_name, home_city, default_protocol, preferred_language.
- **`trip_request`** - traveller_id (nullable = anonymous/lead), circuit_id, status
  (`draft`|`submitted`|`quoted`|`confirmed`|`completed`|`cancelled`), protocol (hard filter),
  tier, group_size, crew_type, from_date, to_date, departure_airport, interests[],
  kitchen_required, cook_required (valid only when group_size ≥ 10, server-enforced).
- **`itinerary`** - trip_request_id (unique), source (`ai`|`curated`|`hybrid`),
  compliance_checked (bool), days (jsonb, schema-validated).

### A.3 Vendor
- **`vendor`** - account_id (unique), business_name, vendor_type
  (`restaurant`|`accommodation`|`transport`|`guide`|`cook`|`produce`|`artisan`|`activity_operator`|`tour_agency`),
  areas (M2M), languages (M2M), whatsapp, verification_status
  (`pending`|`in_review`|`verified`|`rejected`), verified_at, commission_rate.
- **`service_listing`** - vendor_id, service_type, circuits (M2M), area, capacity_min,
  capacity_max, tier, price_amount (minor units), price_unit
  (`per_person`|`per_day`|`per_group`|`per_night`), currency (`INR`|`USD`|`IDR`), active.
- **`listing_compliance`** - service_listing_id, protocol, guarantee_level
  (`certified`|`capable`|`on_request`), evidence_url, verified_by (admin).
- **`availability`** - service_listing_id, date, status (`open`|`held`|`booked`).

### A.4 Circuit spine
- **`circuit`** - key (`ramayana`|`adventure`|`culinary`|`artistic`), name, blurb, hero_image.
- **`point_of_interest`** - circuit_id, name, area, description, typical_duration.
- **`package`** - name, circuits (M2M), tier, protocols, days, band, tags, kitchen, cookReady,
  langs, blurb, outline. (Migrates `lib/catalog.ts`.)

### A.5 Marketplace glue
- **`lead`** - account_id (nullable), source (`whatsapp`|`web`|`planner`), trip_request_id
  (nullable), contact, message, status (`new`|`contacted`|`converted`).
- **`quote`** - trip_request_id, total_amount, currency, valid_until, status
  (`sent`|`accepted`|`expired`), line_items (jsonb: listing_id + price snapshot + circuit).
- **`booking`** - trip_request_id (unique), traveller_id, gross_amount (**server-recomputed**),
  currency, status, selected_listings (M2M).
- **`review`** - booking_id, vendor_id, rating 1-5, comment, published.

### A.6 Money
- **`payment`** - booking_id, provider, provider_ref, amount, currency, status
  (`authorized`|`captured`|`refunded`|`failed`).
- **`vendor_payout_account`** - vendor_id, method (`bank`|`wise`|`connect`), currency, tokenised
  destination reference (never raw bank details).
- **`payout`** - booking_id, vendor_id, gross_amount, commission_rate, commission_amount,
  net_amount, currency, status (`pending`|`paid`|`failed`|`reversed`), provider_ref.
- **`ledger_entry`** - append-only (booking_id, type `charge`|`commission`|`payout`|`refund`,
  amount, currency).

## Appendix B - Enlistment flows

### B.1 Vendors (service providers) - curated in v1
1. Recruit / land on `/vendors`. 2. Passwordless account → `vendor(status=pending)`.
3. Onboarding: business basics → listings (service type, circuit(s), price + unit) →
   **vegetarian capability per listing with evidence upload** → payout account (tokenised).
4. Admin verifies evidence (especially veg) → `verified`/`rejected`.
5. Verified listings enter circuit-aware matching and can be booked and paid.

### B.2 Travellers (service seekers)
1. Land → **pick a circuit** or browse. 2. Plan anonymously (no signup wall; `trip_request`
   with `traveller_id=null`). 3. To save/quote: enter contact → `lead` written immediately +
   CRM sync; passwordless verify creates `traveller` and claims the trip. 4. Save & share
   (link + PDF). 5. Quote (circuit-aware match). 6. Pay Only2Bali → `booking` confirmed.
   7. Travel → review.

## Appendix C - Payments money flow (managed marketplace)

```
Traveller ──pays full price──► Only2Bali account (merchant of record)
                                     ├── keeps margin (commission_rate, e.g. 10-20%)
                                     └── pays vendors the net amount ──► Vendor payout accounts
```
Per booking: capture `payment` → `ledger_entry(charge)` → compute `commission_amount` → per
vendor create `payout(gross, commission, net)` → on settlement `ledger_entry(payout)`. Refunds
reverse the chain. **Price is always server-recomputed; the client never sends an amount.**

**Provider options** (travellers global, vendors in Bali = cross-border, multi-currency):

| Route | Inbound | Vendor payout | Fit |
|---|---|---|---|
| **Manual/hybrid (v1)** | Razorpay/Stripe checkout into Only2Bali | Manual bank / Wise, tracked in `payout`/`ledger` | Simplest; fine at low curated volume |
| **Stripe Connect** | Global cards/wallets, multi-currency | Automated cross-border incl. Indonesia | Best long-term for worldwide diaspora |
| **Razorpay Route** | Strong INR / UPI | India-centric splits; cross-border to Indonesia is the constraint | Good if mostly INR |

**Boundaries:** engineering builds the integration, money tables, payout logic, and
reconciliation. It will **not** enter or store live payment credentials (set in the provider
dashboard + Vercel env), and this plan does **not** give financial or legal advice. Merchant-of-
record cross-border money movement has licensing, tax (GST/VAT), and travel-regulation
implications - engage a payments/compliance/legal advisor before go-live.

**Hard regulatory gate (research 2026-07-16):** moving money cross-border for Indian payers
requires an **RBI PA-CB (Payment Aggregator - Cross-Border) licensed** provider (e.g. Razorpay)
or an AD Category-I bank - a generic gateway is not sufficient and unauthorised channels are a
FEMA violation. Every vendor payout must carry an **RBI purpose code** (add the field to
`payout` now). LRS ($250k/yr) applies to individuals only, not to Only2Bali as a company - this
is a B2B remittance handled by an AD bank / licensed partner. This is a blocker to resolve
before any payout, and it reinforces starting **manual/hybrid** while the licensed rail is set up.

## Appendix D - Seed supply (for the curated v1)

- **Culinary vendors (pure-veg / Jain-capable, operating in Bali):** Sattvik By Nature
  (Kuta & Ubud), Darbar (separate 100% veg kitchen, large groups), Punjabi Grill (Kuta),
  Queen's of India (Kuta), Vinayak (Kuta).
- **Ramayana anchors:** Uluwatu Kecak (sunset), Tanah Lot, Besakih, Tirta Empul, Lempuyang;
  Ubud Barong / Ramayana ballet.
- **Adventure anchors:** Ayung rafting, ATV + jungle trek, Mount Batur sunrise, Nusa Penida
  snorkelling, glass bridge, jungle swings.
- **Artistic anchors:** Ubud/Mas wood-carving workshops, stone/sculpture studios, painting.

These populate `circuit`, `point_of_interest`, and the first `vendor`/`service_listing` rows so
the curated matcher has real inventory on day one.

## Appendix E - Competitive feature backlog (research 2026-07-16)

Synthesised from four parallel research streams - tour/activity marketplaces (Viator,
GetYourGuide, Klook, TourRadar, Rezdy); AI planners + group travel (Wanderlog, Mindtrip, Layla,
Troupe, SquadTrip); dietary/faith niche travel (HalalBooking, CrescentRating, Kosherica, Indian
Jain operators); India-outbound OTAs + payment mechanics (TravelTriangle, Thrillophilia, MMT,
Stripe Connect, Razorpay Route) - plus the product-trio brainstorm (`docs/IDEAS.md`). `[P#]` =
target phase. **★** = surfaced independently from multiple streams (strong signal).

### Three category "whitespace" differentiators (no competitor - halal, kosher, or Jain - does these)
1. **"How We Verify Every Kitchen" public methodology page** - inspection checklist, no-onion/garlic
   protocol, separate oil/utensils, photos from the verification visit. [P3 + marketing]
2. **Refund-if-the-guarantee-fails policy** - "if a verified meal is not compliant, that day's
   package cost is refunded." First-in-category. [P5]
3. **Colour-coded per-listing/per-meal compliance rating** (green = fully Jain-safe · amber = veg
   but shared kitchen · red = avoid) - makes the "100% veg" claim scannable and auditable. [P3/P4]

### A. Trust & the veg moat  [Phase 3-4 + marketing]
- ★ **Traveling cook / "Kitchen Caravan" premium tier** for group departures - matches Loganathan's
  accompanying-cook idea; the most-trusted mechanism in Indian Jain travel. [P4]
- Verified-booking-gated dietary reviews ("veg guarantee kept"). [P3]
- Named, accountable veg-compliance lead per trip (kosher "mashgiach" model). [P4]
- Public directory of verified veg/Jain places in Bali - SEO + proof-of-work flywheel. [P3]
- Private veg-only group departures (removes cross-contamination anxiety). [P3/P5]
- Temple/derasar access + fasting-day (Paryushan/Ekadashi) meal handling alongside the food filter. [P3]
- Founder / community-credential storytelling. [marketing]
- Vendor performance/quality ranking so reliable veg vendors surface first. [P4]

### B. Planning & group decision  [Phase 3]
- ★ Group voting/polling on circuit, dates, activities (the family/committee bottleneck).
- ★ Collaborative itinerary with edit attribution + item-level comment threads.
- ★ Shareable no-login itinerary link + PDF export.
- In-app trip chat with @AI tag to reconcile group preferences.
- Saved trips / collections (persist across the multi-week decision cycle).
- Structured diet/pace/budget fields in the AI prompt (harden the veg logic, not free text).
- Conversational refinement - swap one stop without a full regenerate (also cuts AI cost).
- Map-first route sequencing; a "pace" slider (relaxed / moderate / packed).

### C. Lead, quote & support  [Phase 1-3]
- ★ **Curated multi-quote** (2-3 vetted vendors, ~24h SLA) - the proven UX for curated-matcher v1.
- ★ **WhatsApp Business API as the primary channel**, pre-trip and in-trip concierge (not a deep link).
- Departure-city-localised package pages (SEO + flight-cost accuracy: Mumbai/Delhi/Dubai…).
- "Free customization" + visible free-cancellation badges; all-in, tax-inclusive pricing.
- Single booking-conversation thread per trip (docs, dietary confirmation, room-sharing).

### D. Marketplace mechanics  [Phase 4]
- Manual vendor verification before go-live, shown as a trust badge (already the v1 model).
- Simple vendor dashboard (bookings, availability, payout status).
- Real-time availability + hold to prevent overbooking on capacity-limited villas/departures.
- Published vendor payout SLA (e.g. "paid within 14 days of trip completion").
- Instant-book (fixed departures) vs request-to-book (custom/private) labelling.
- AI-assisted vendor listing creation - reuse the existing Gemini access.
- Incremental KYC onboarding (collect minimum-to-activate, request more later).

### E. Payments & money  [Phase 5]
- ★ **Deposit + instalment** plan with reminders/retries (travel norm; ~+30-40% conversion).
- ★ **Hold vendor payout until confirmation vouchers are issued** (escrow / fraud control).
- Split-payment / commission-at-capture (Stripe destination charges or Razorpay Route) - avoids
  hand-rolled reconciliation.
- Refund-first-from-platform, claw-back-from-vendor (traveller refund never waits on the vendor).
- Per-traveller split deposit via a shareable link (each group member pays their share).
- India-consumer options: no-cost EMI, book-now-pay-later, ₹1 price-lock soft-commit.
- Multi-currency virtual accounts for diaspora (USD/AED/SGD) collection.
- **⚠ Compliance gate:** RBI PA-CB-licensed provider + purpose codes (see Phase 5 / Appendix C).

### Deprioritised (scale problems Only2Bali doesn't have yet)
Reseller / channel-manager distribution network, self-serve global vendor onboarding, AI dynamic
pricing, native mobile app. Revisit after traction.

### Brainstorm top 5 (from `docs/IDEAS.md`, folded in above)
WhatsApp two-way concierge (C) · Community Trust Engine (A + the 3 whitespace items) · Group
organizer toolkit + community-leader referral (C/D) · Collaborative shareable itinerary (B) ·
Fixed-date festival departures (A/D - dated `availability` + `package`).
