# Only2Bali — Indonesia Travel Marketplace Master Plan

> Source of truth for the end-to-end marketplace build.
> Written 2026-08-06 against live code in `only2bali-next/`.
> Supersedes the *product positioning* in older plans where they conflict;
> keeps the money / compliance / schema decisions that remain correct.
>
> Companion: `docs/planning/indonesia-marketplace-todo.md` (sequenced tasks).

---

## 1. Product verdict

Only2Bali is an **aggregator marketplace** for Indian travellers booking travel
services across **Indonesia** (Bali first, then Jakarta and other destinations),
and for Indonesian **service providers** (restaurants, stays, transport, guides,
tour packages, activities, cooks, artisans) who list and sell through the platform.

**Money model (locked):** merchant of record. Travellers pay Only2Bali.
Only2Bali pays verified vendors net of commission. Vendors never set the
traveller-facing price on bids; the platform derives it.

**Quality model (locked):** nothing public until an admin verifies the provider
and publishes the listing. Self-serve upload + curated gate.

**Dietary layer (repositioned):** vegetarian / Jain / vegan compliance remains a
**first-class differentiator and filter**, not the sole brand claim. The landing
page leads with Indonesia tourism, circuits, destinations, and logistics.
Food protocol is one trust surface among stays, rides, guides, and budget fit.

---

## 2. Actors and jobs

| Actor | Job to be done |
|---|---|
| **Traveller** | Discover destinations & circuits → browse packages and a-la-carte services → request custom trips → compare offers → book → pay INR → rate the provider after the trip |
| **Service provider** | Apply / sign up → complete profile + KYC docs → upload listings (photos, price, capacity, area) → go live after admin verify → bid on open requests → fulfil bookings → receive payout → rate the traveller after the trip |
| **Admin (Only2Bali)** | Approve/reject applications → verify vendors → publish/pause listings & media → moderate reviews → manage rates/promotions/events → release payouts |

---

## 3. Gap analysis (verified 2026-08-06)

### Already shipped (do not rebuild)

| Capability | Where |
|---|---|
| Passwordless OTP + password + Google auth; roles `traveller\|vendor\|admin` | `lib/auth/`, `/login`, `/account` |
| Provider dashboard: profile, listings, events, promotions, media URL, payout account | `/provider`, `/api/provider/*` |
| Admin content moderation: listing publish/pause, media approve, events/promos | `/admin`, `/api/admin/*` |
| Package catalogue + meal compliance colours on package detail | `/packages/[slug]` |
| Booking seat hold + Razorpay checkout/verify/webhook path | `/api/bookings`, `/api/payments/*` |
| Lead + vendor application persistence | `/api/leads`, `/api/vendor-applications` |
| Marketplace schema spine (vendor, listing, offer, booking, payment, disbursement, review) | `lib/db/schema/*` |
| Postgres on VPS with mTLS; demo seed data | `infra/postgres/` |

### Critical gaps vs the end-to-end product

| Gap | Impact | Priority |
|---|---|---|
| **No public marketplace browse of provider services** | Travellers cannot see or book a-la-carte supply | P0 |
| **Admin cannot approve applications or flip `verificationStatus`** | Providers stay forever draft/pending | P0 |
| **Landing still food/guarantee-led in most locales; hero CTA jumps to guarantee** | Brand reads as "veg tour operator", not Indonesia marketplace | P0 |
| **Reviews are schema-only, one-way (traveller→vendor)** | No trust loop; no provider→traveller rating | P0 |
| **Package page CTAs go to inquiry, not checkout** | Payment path exists but is not discoverable | P1 |
| **No listing→booking checkout** | Bookings are package-departure only | P1 |
| **Media is URL paste, not file upload** | Friction for real Indonesian providers | P1 |
| **No payout execution** (account form only; `payment_disbursement` unused) | Cannot pay vendors | P1 |
| **Request board + bid UI missing** (thin APIs exist) | Custom trips stay concierge-only | P2 |
| **Messaging UI missing** | Pre-booking chat API unused | P2 |
| **Bali-only product framing** (Jakarta/elsewhere not first-class) | Blocks "Indonesia marketplace" claim | P1 |
| **Production blocked** on Vercel ownership + OTP + Razorpay keys | Live money and login | Owner |

### Explicit non-goals for the first vertical slice

- Replacing the emerald/saffron identity or regenerating photography
- Building a native mobile app (PWA later)
- Self-built cross-border payout rail (requires RBI PA-CB partner — see Phase 5)
- Retiring Django/CRA before marketplace parity on Next.js

---

## 4. Target information architecture

```
/                         Home — Indonesia tourism hero, destinations, circuits,
                          featured services, packages, food protocol as one trust strip
/destinations             Bali · Jakarta · (later: Yogyakarta, Lombok, …)
/destinations/[region]
/circuits · /circuits/[key]
/packages · /packages/[slug]     Curated group packages (existing)
/services · /services/[id]       Public marketplace of verified listings  ← NEW
/plan                     Custom trip wizard → offers
/providers/[slug]         Public provider profile
/inquiry                  Concierge fallback
/vendors                  Provider apply (existing)
/login · /account
/provider                 Provider console (existing, extend)
/admin                    Admin console (extend: verify + payouts + reviews)
```

---

## 5. Architecture (stays)

- **App:** Next.js 15 App Router on Vercel (`only2bali-next/` only).
- **DB:** Postgres (VPS, mTLS). Drizzle. Business rules in check constraints.
- **Layering:** route handlers → repositories; Zod at every boundary; money = integer minor units.
- **Auth:** opaque httpOnly session cookies; `requireRole`.
- **Rate limits:** Postgres-backed (`lib/rate-limit-db.ts`).
- **Payments in:** Razorpay (INR traveller). Schema already provider-agnostic.
- **Payments out:** Razorpay Route / PA-CB or AD Category-I bank. Purpose codes on every payout.
- **Caching:** ISR/SWR for catalogue; availability and checkout never cached.

---

## 6. Phased delivery (one coherent product, shipped in vertical slices)

Each phase ends with something a real user can do. No "big bang" rewrite.

### Phase A — Marketplace spine visible *(this PR starts here)*

Make supply discoverable and verifiable.

1. Reposition landing: tourism + destinations + circuits first; veg as filter/trust strip.
2. Public `/services` browse + detail for `status=active AND active=true` listings from **verified** vendors.
3. Admin: approve/reject `vendor_application`, set `vendor.verificationStatus`, publish listings.
4. Bidirectional reviews schema + API (booking-gated, one each direction).
5. Destination framing: Bali + Jakarta on home and service filters (city/region).

**Done when:** a verified Jakarta or Bali provider's published listing appears on `/services`,
an admin can verify a provider from `/admin`, and a completed booking can collect both ratings.

### Phase B — Book and pay any service

1. Listing checkout (hold → pay → confirm) parallel to package departures.
2. Package detail "Book this departure" wired to existing booking API.
3. Traveller account: bookings, vouchers stub, review prompts.
4. Provider account: incoming bookings, fulfilment status.

### Phase C — Media, KYC, trust

1. Real photo upload (Vercel Blob or S3-compatible) with admin moderation (already have approve flag).
2. `vendor_document` upload + admin KYC review UI.
3. Public `/providers/[slug]` with highlights, ratings, published listings.
4. `/verify` methodology page kept; broaden copy beyond kitchens.

### Phase D — Matching and custom trips

1. Provider request board UI + bid UI (APIs partially exist).
2. Traveller offer comparison page.
3. Masked messaging UI until booking confirmed.
4. Compliance matching wired into recommend engine for food-tagged listings.

### Phase E — Payouts and ledger

1. Admin payout queue from `payment_disbursement`.
2. Hold until vouchers / trip start (escrow policy).
3. PA-CB partner integration; purpose codes; refund-first-from-platform.
4. **Owner gate:** legal structure + partner contract before live disbursements.

### Phase F — Indonesia expansion + polish

1. Destination pages; more regions in seed and filters.
2. Design polish pass (motion, LCP, mobile); keep identity tokens.
3. PWA shell for offline vouchers.
4. Retire CRA once Next.js has parity; keep Django only until user migration done.

---

## 7. Design direction

**Keep:** emerald/saffron/ivory tokens, Fraunces + Inter, Balinese photography,
custom cursor, multilingual chips, warm editorial mood.

**Change:**

- Hero leads with destinations and circuits, not dietary protocols.
- Guarantee section remains, but is one trust module — not the first viewport job.
- Marketplace surfaces (`/services`, dashboards) stay token-consistent; no purple SaaS look,
  no cream-serif-terracotta cliché, no card spam in the hero.
- First viewport budget: brand, one headline, one sub, one CTA group, one full-bleed hero image.

---

## 8. Data rules that must stay true

1. Money is integer minor units. Never float.
2. `tier` is a display label only — never a price boundary.
3. Client never sets payable amount; server recomputes.
4. Unverified vendors and draft listings are invisible to travellers.
5. Reviews require a completed booking; one rating per direction per booking.
6. Contact details stay off the request board until booking confirmation.
7. Cross-border payouts require a licensed rail — do not invent one in app code.

---

## 9. Risks and owner actions

| Risk | Mitigation |
|---|---|
| Production on someone else's Vercel | `docs/vercel-handover.md` — owner |
| Leaked Zoho / SpringEdge still unrevoked | Owner rotates at providers |
| OTP / Razorpay env unset | Visible on `/api/health`; blocked until Vercel move |
| Cross-border payout compliance | Phase E gated on PA-CB partner |
| Supply emptiness | Recruit seed providers in Bali + Jakarta in parallel with Phase A |

---

## 10. Success criteria (end state)

A traveller in India can:

1. Land on a tourism-led homepage,
2. Browse verified services in Bali and Jakarta,
3. Book a package or a-la-carte service,
4. Pay Only2Bali in INR,
5. Rate the provider after completion,

and a provider in Indonesia can:

1. Apply and get admin-verified,
2. Upload services with photos and prices,
3. Receive bookings,
4. Get paid net of commission,
5. Rate the traveller after completion,

with every money movement and verification decision audit-logged.
