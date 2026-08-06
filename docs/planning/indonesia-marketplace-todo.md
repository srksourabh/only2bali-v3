# Only2Bali — Indonesia marketplace task list

> Sequenced execution list for `docs/planning/indonesia-marketplace-master-plan.md`.
> Tags: 🧑 owner · 💻 code · ⚖️ legal · 🔴 security
> Estimates are relative (XS/S/M/L), not calendar time.

Work top to bottom within a phase. Commit at each done-when.

---

## Phase A — Marketplace spine visible

### A0. Docs (this delivery)
- [x] **A0.1 💻** Master plan written — `indonesia-marketplace-master-plan.md`
- [x] **A0.2 💻** This task list

### A1. Landing reposition (tourism first)
- [x] **A1.1 💻** Rewrite EN `meta` / `hero` / `rail` / `nav` / `footer` / `close` toward
      Indonesia destinations + circuits; keep veg as one trust strip, not the hero claim.
- [x] **A1.2 💻** Mirror the positioning in `hi`, `ta`, `gu`, `te`, `kn`, `mr` (same keys).
- [x] **A1.3 💻** Homepage: primary secondary CTA → `#circuits`; add Services nav + strip.
- [x] **A1.4 💻** Soften guarantee section heading so it reads as trip-quality, not food-only.

**Done when:** removing the nav, the first viewport still reads as Indonesia group travel
(not a vegetarian restaurant pitch). `npm run typecheck` clean across all locales.

### A2. Public services catalogue
- [x] **A2.1 💻** Repository: list/get published listings joined to **verified** vendors only.
- [x] **A2.2 💻** `GET /api/services` (filters: type, city/region, price min/max, protocol optional).
- [x] **A2.3 💻** `GET /api/services/[id]` — detail with vendor slug, photos, price, inclusions.
- [x] **A2.4 💻** Pages `/[lang]/services` and `/[lang]/services/[id]` (RSC, ISR).
- [x] **A2.5 💻** Nav + home strip link; empty state when no published supply.
- [x] **A2.6 💻** Vitest: unpublished / unverified listings never returned.

**Done when:** demo verified + active listings appear publicly; draft ones do not.

### A3. Admin verification gate
- [x] **A3.1 💻** `adminDecideApplication(approve|reject)` — on approve, create/link vendor
      account path documented (application stays; status flips; if matching email account
      exists as vendor, mark verified).
- [x] **A3.2 💻** `adminSetVendorVerification(verified|rejected|suspended)` with audit log.
- [x] **A3.3 💻** API routes `PATCH /api/admin/applications/[id]`, `PATCH /api/admin/vendors/[id]`.
- [x] **A3.4 💻** Admin UI: Approve / Reject / Verify buttons (not read-only lists).
- [ ] **A3.5 💻** E2E or repository tests for the gate.

**Done when:** an admin can take a pending application to verified and a listing from that
vendor can be published and appear on `/services`.

### A4. Bidirectional ratings
- [x] **A4.1 💻** Migration: `review.direction` enum
      (`traveller_to_vendor` | `vendor_to_traveller`); drop unique on `booking_id` alone;
      unique `(booking_id, direction)`; add `reviewee_account_id`.
- [x] **A4.2 💻** Repository + Zod: create review only if booking `completed`/`confirmed`
      and caller is the correct side; update vendor `rating_avg` / `rating_count` for
      traveller→vendor only.
- [x] **A4.3 💻** `POST /api/reviews`, `GET /api/reviews?vendorId=` (published only).
- [x] **A4.4 💻** UI: review form on traveller account for completed bookings; form on
      provider dashboard for completed bookings. *(Traveller account form shipped; provider
      booking list UI deferred to Phase B with provider bookings API.)*
- [x] **A4.5 💻** `db:verify` checks for rating range + unique direction.

**Done when:** both sides can rate once per completed booking; public vendor rating rolls up.

### A5. Destination framing
- [x] **A5.1 💻** Service filters expose Bali / Jakarta (and "Other Indonesia") via `city`/`area`.
- [x] **A5.2 💻** Home destinations strip (copy + links into `/services?region=`).
- [x] **A5.3 💻** Seed at least one Jakarta demo listing in sample marketplace seed.

**Done when:** a traveller can filter services by Bali vs Jakarta.

**Phase A checkpoint:** typecheck + unit tests + e2e green; `/services` live; admin verify works;
reviews both directions; landing tourism-led.

---

## Phase B — Book and pay any service

- [ ] **B1** Listing availability calendar (reuse `availability` table) — M
- [ ] **B2** `POST /api/bookings` accepts `listingId` path (or sibling endpoint) with
      server-priced amount — L
- [ ] **B3** Service detail → checkout → Razorpay (same verify/webhook) — M
- [ ] **B4** Package detail "Book departure" CTA (stop routing money intent to WhatsApp) — M
- [ ] **B5** Traveller account: pay, status, review prompt — M
- [ ] **B6** Provider: incoming bookings list + fulfilment status — M

**Checkpoint:** traveller books a listing end-to-end in staging with test Razorpay keys.

---

## Phase C — Media, KYC, trust

- [ ] **C1** Multipart photo upload to blob store; replace URL-paste as primary path — L
- [ ] **C2** `vendor_document` upload + admin KYC review — M
- [ ] **C3** Public `/providers/[slug]` profile — M
- [ ] **C4** Broaden `/verify` copy beyond kitchens — S
- [ ] **C5** Show ratings on service cards and provider profile — S

---

## Phase D — Matching and custom trips

- [ ] **D1** Provider request board UI — L
- [ ] **D2** Bid compose UI (vendor sets net; platform derives traveller price) — L
- [ ] **D3** Traveller offer comparison — L
- [ ] **D4** Masked messaging UI — M
- [ ] **D5** Wire compliance hard-filter into matching — M

---

## Phase E — Payouts (⚖️ gated)

- [ ] **🧑⚖️ E0** PA-CB / AD bank partner chosen and contracted
- [ ] **E1** Admin disbursement queue UI + approve action — M
- [ ] **E2** Escrow hold until voucher / trip start policy — M
- [ ] **E3** Gateway transfer + purpose code + ledger entries — L
- [ ] **E4** Refund-first-from-platform path — M

---

## Phase F — Expansion and retirement

- [ ] **F1** Destination pages + more regions — M
- [ ] **F2** Design polish / LCP / motion pass — M
- [ ] **F3** PWA shell for vouchers — M
- [ ] **F4** Migrate remaining Django users; sunset CRA — L
- [ ] **🧑 F5** Vercel handover + real contact + OTP + Razorpay live keys

---

## Owner blockers (parallel, start immediately)

- [ ] 🧑🔴 Revoke Zoho tokens; rotate SpringEdge key
- [ ] 🧑 Move production to own Vercel (`docs/vercel-handover.md`)
- [ ] 🧑 Set `RESEND_API_KEY` or SMS key; set Razorpay secrets
- [ ] 🧑 Recruit seed providers in Bali + Jakarta
- [ ] ⚖️ PA-CB payout partner conversation
