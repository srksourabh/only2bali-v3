# Only2Bali — marketplace design specification

> Complete design document for the revamped Only2Bali: frontend, backend, database, and PWA.
> Written 2026-07-22. Supersedes nothing that is live; extends `docs/planning/platform-plan.md`
> (currently on branch `claude/codebase-review-architecture-8d3bb1`, not merged to `main`).
>
> Companion documents:
> - `docs/planning/marketplace-tasks.md` — phase-level scope of record
> - `docs/planning/todo.md` — the sequenced execution list. **Start there.**

---

## 1. Scope

### 1.1 What this builds

A two-sided aggregator for Indian travellers going to Bali and wider Indonesia.

- **Travellers** pick a circuit, choose dates on a calendar, fill a requirement form, compare
  multiple offers, choose a package and a service provider, log in, and book. They can also
  **post their own requested package** — group size, days, nights, budget, special requirements —
  onto a request board that verified providers can see and bid against.
- **Service providers** (vegetarian food providers, travel agents, car/transport providers,
  villas, guides, cooks, artisans) sign themselves up, upload their business and listings,
  and go live after Only2Bali verifies them. They browse open traveller requests and submit
  proposals.
- **Only2Bali** curates, verifies, matches, holds the money, and pays providers net of margin.

Supply and demand each flow both ways: providers publish listings that travellers search, and
travellers publish requests that providers bid on. Both directions converge on the same `offer`
object.

The whole site is a React application (Next.js App Router) and is installable as a PWA.

### 1.2 What is explicitly preserved

Per the instruction not to change photos or themes:

- Every asset in `only2bali-next/public/Asset/` stays. Filenames, artwork, photography,
  the chef and guide illustrations, the logo `bali loogoo.svg` (misspelling and all).
- The colour tokens: emerald `#0e4f44` / `#093830`, saffron `#e8941a` / `#c97a0a`,
  ivory `#faf6ee`, cream `#f3ecdd`, ink `#1d2a27`, muted `#5d6f6a`, line `#e3dccb`.
- The typography pairing: **Fraunces** display + **Inter** body.
- The emerald-tinted shadow, the pill buttons and chips, the 14px base radius.
- The custom cursor (`app/components/CustomCursor.tsx`).
- The warm editorial mood and the multilingual Indian-script chips.

Changes are **structural and functional**, not visual identity. Where the visual language is
extended (new marketplace surfaces), it is extended using these same tokens.

### 1.3 What changes

| Today | After |
|---|---|
| 6 packages hardcoded in `lib/catalog.ts` | Packages in Postgres, with days, nights, places, inclusions, rationale, structured price |
| No dates anywhere | Calendar-driven departure dates and custom date ranges, with per-date price and seats |
| Lead goes to WhatsApp / mailto | Server-side lead capture, then quote, then booking |
| No accounts on the Next.js site | Passwordless traveller login + provider login + admin |
| `/vendors` is a static pitch page | Provider self-onboarding portal, listing upload, verification queue, dashboard |
| One indicative price band string | Multiple competing offers per trip request, each priced |
| Demand is invisible to supply | Traveller-posted request board; providers bid against real demand |
| Web page only | Installable PWA with offline itinerary and voucher access |

### 1.4 Interpretation of two ambiguous requirements

Stated so they can be corrected rather than silently assumed:

1. **"Why they are based"** — confirmed by the owner as **"why they are best" / "why you choose"**:
   the USP and benefit points. It exists at two levels:
   - **Package USP** — `package_highlight` → renders as *"Why choose this package"*.
   - **Provider USP** — `vendor_highlight` → renders as *"Why this provider is best"* on the
     provider profile, the offer card and every bid.

   Both are ordered, short benefit statements — not prose. They are the copy that has to beat a
   competitor anchoring 30% cheaper (§2.3), so they carry real commercial weight.
2. **"Service providers upload themselves"** conflicts with the previously locked decision that
   v1 is a *curated* matcher. This spec resolves it as: **self-serve signup and self-serve
   upload, but nothing is publicly visible until an admin verifies it.** Providers do the data
   entry; Only2Bali keeps the quality gate. This is the standard marketplace pattern and it
   keeps the "100% verified veg" promise honest.

3. **Travellers post their own requested package, visible to providers** (owner instruction,
   2026-07-22). This makes the platform bidirectional: providers publish listings travellers
   search, and travellers publish requests providers bid on. Both converge on one `offer`
   object, distinguished by `offer.origin`. Full design in §6.7.

---

## 2. Competitive position

Research 2026-07-22, extending the four-stream study of 2026-07-16.

### 2.1 Who already sells this

| Competitor | Model | Weakness Only2Bali attacks |
|---|---|---|
| NFTT World, Nagfani Tours | Mumbai/Surat agents selling "pure veg & Jain Bali" packages | Phone-and-brochure. No online inventory, no dates, no self-service booking, no verification evidence |
| Pickyourtrail | Tech-led customisable Bali packages from ₹39.6k | Veg is a filter, not a guarantee. No Jain protocol. No own-language guides |
| Travalot, Gokite | Fixed Bali packages from ₹39.5k | Generic. Veg "options available" |
| Viator / GetYourGuide / Klook | Activity marketplaces | No dietary layer at all, no Indian-language layer, no group logistics |

The market is split between **agents with trust but no technology** and **platforms with
technology but no dietary trust**. Only2Bali's position is the intersection.

### 2.2 The three defensible differentiators

None of the halal, kosher, or Jain travel players currently do all three:

1. **Per-meal, colour-coded compliance rating** — green (fully Jain-safe, dedicated kitchen),
   amber (veg, shared kitchen), red (avoid). Makes the "100% veg" claim scannable and auditable
   instead of a marketing line.
2. **A public "How we verify every kitchen" page** — the inspection checklist, the
   no-onion/no-garlic protocol, separate oil and utensils, and photos from the verification
   visit. Proof of work as marketing.
3. **Refund-if-the-guarantee-fails** — if a verified meal turns out non-compliant, that day's
   package cost is refunded. First in category.

### 2.3 Price anchoring — open ranges, not fixed bands

Competitors anchor at **₹39,499–₹39,659 per person ex-flights** for 5–6 nights. The current
catalog opens at ₹58,000 and stops at ₹1,45,000.

**Decision (owner, 2026-07-22): expand the range and keep it open.** Pricing is not modelled as
a fixed set of bands. Concretely:

- `tier` (`economical` / `comfort` / `premium`) is a **display label only**. It is never a price
  boundary and never used in filtering by amount.
- Price filters are **open-ended min/max**, with no enforced ceiling and no enforced floor. UI
  affordances read "under ₹40,000", "₹40,000 – ₹80,000", "₹1,50,000+" — presets over an open
  range, not enumerated buckets.
- The catalog is free to go below the competitor anchor (a lean entry circuit) and above the
  current top (private villa estates, long-stay, multi-island Indonesia) without a schema or
  code change.
- Providers set their own listing prices with no platform-imposed cap; the range widens as
  supply arrives.
- Traveller budget bands on posted requests are likewise open-ended: "up to ₹X", "₹X – ₹Y",
  "₹X and above", or "not sure — advise me".

The competitive gap is therefore closed by *supply*, not by discounting the existing packages.
What the design still has to do is make the veg guarantee, the own-language guide and the
managed logistics visible **above the fold on the package card** — otherwise a wider range just
means losing on price at every point in it.

### 2.4 What the research says about the specific features requested

- **Calendar**: showing price under each date is now the expected pattern (Booking.com, Airbnb,
  every flight app). Unavailable dates must be visibly disabled, not merely rejected on submit —
  discovering unavailability after selection is one of the highest-abandonment moments in travel
  booking.
- **Provider self-onboarding**: mature marketplaces use incremental KYC — collect the minimum to
  activate, request the rest later. Supply drives roughly 70% of marketplace success metrics, so
  onboarding friction is the thing to minimise, second only to quality.
- **PWA**: a production PWA in 2026 needs three non-negotiables — a service worker, a web app
  manifest, and HTTPS. The travel-specific win is offline access to booked itineraries, vouchers
  and maps, which matters directly for Indian travellers on roaming in Bali.

Sources: [Pickyourtrail Bali](https://pickyourtrail.com/packages/bali) ·
[NFTT World veg/Jain Bali](https://www.nfttworld.com/bali-veg-jain-tour-package-mumbai/) ·
[Travalot Bali](https://www.travalot.com/package/bali) ·
[Nagfani pure veg & Jain](https://www.nagfanitoursandtravels.com/borivali/latest-update/discover-enchanting-bali-with-pure-veg-jain-food/110) ·
[Offline-first PWA patterns](https://rohitraj.tech/en/notes/pwa-offline-sync) ·
[PWAs for travel](https://www.nevinainfotech.com/blog/pwas-for-travel-app) ·
[PWA build guide 2026](https://yusmpgroup.com/blog/progressive-web-app-development-2026) ·
[Date pickers in booking apps](https://blog.mobiscroll.com/date-pickers-in-flight-booking-apps/) ·
[NN/g date-input guidelines](https://www.nngroup.com/articles/date-input/) ·
[Baymard date picker examples](https://baymard.com/ecommerce-design-examples/date-picker) ·
[Marketplace vendor onboarding](https://appscrip.com/blog/marketplace-vendor-onboarding/) ·
[Stripe two-sided marketplace strategy](https://stripe.com/resources/more/two-sided-marketplace-strategy)

---

## 3. The product spine: circuits

A **circuit** is the first-class organising object. Packages, listings, and points of interest
all tag to a circuit, and picking one is the traveller's first decision.

| Circuit | Anchors | Seed supply |
|---|---|---|
| **Ramayana** | Uluwatu Kecak fire dance, Tanah Lot, Besakih, Tirta Empul, Lempuyang, Ubud Barong/Ramayana ballet | Exists |
| **Adventure** | Ayung rafting, ATV + jungle trek, Mount Batur sunrise, Nusa Penida snorkelling, glass bridge, jungle swings | Exists |
| **Culinary** | Vegetarian food trail | Sattvik By Nature, Darbar, Punjabi Grill, Queen's of India, Vinayak |
| **Artistic** | Wood-carving, stone sculpture, painting workshops | Ubud / Mas artisan studios |
| **Wellness** *(fifth, optional)* | Yoga, spa, retreat, silent days | Ubud / Canggu |

The existing six catalog packages map onto these: Sattvik Serenity and Temple & Tranquility →
Ramayana; Active Bali → Adventure; Vegan Vitality → Culinary + Wellness; Bali Veg Explorer →
mixed; Premium Family Celebration → mixed.

---

## 4. Information architecture

```
/                             Home — hero, circuits, featured packages, trust, why-us
/circuits                     All circuits
/circuits/[key]               One circuit: story, map, POIs, packages on this circuit
/packages                     Browse + filter (circuit, protocol, tier, days, month, price)
/packages/[slug]              Package detail — the money page (§6.3)
/plan                         Trip request wizard (circuit → dates → group → food → extras)
/plan/[id]/offers             All offers compared — system matches + provider bids
/plan/[id]/offers/[offerId]   One offer in full
/plan/[id]/manage             Traveller controls the posting: open/close bids, extend deadline
/verify                       "How we verify every kitchen" — public methodology
/food                         Food protocols (Jain / vegetarian / vegan)
/providers                    Directory of verified providers
/providers/[slug]             One provider: profile, listings, compliance badges, reviews
/about  /faq  /terms  /privacy

/account                      Traveller: trips, bookings, saved packages, documents
/account/trips/[id]           One trip: itinerary, vouchers, payment schedule, chat
/account/trips/[id]/offline   Offline-cached itinerary bundle

/partner                      Provider marketing + "list your business"
/partner/signup               Self-serve provider signup
/partner/onboarding           Multi-step: business → listings → compliance evidence → payout
/partner/dashboard            Bookings, calendar, availability, payouts, reviews
/partner/listings             CRUD listings
/partner/listings/[id]/availability   Calendar editor
/partner/requests             Request board — open traveller requests this provider can serve
/partner/requests/[id]        One request in full (anonymised) + bid history
/partner/requests/[id]/propose   Build and submit a proposal
/partner/proposals            My submitted proposals and their status

/admin/verification           Verification queue — the quality gate
/admin/vendors  /admin/bookings  /admin/payouts  /admin/content

/api/**                       Route handlers (§7)
/manifest.webmanifest         PWA manifest
/sw.js                        Service worker
```

---

## 5. Design system

### 5.1 Token scale (extends, does not replace)

The existing tokens stay exactly as they are. Three additions, all derived from what is already
in the codebase, to remove the drift found in the review:

```css
:root {
  /* existing — unchanged */
  --emerald:#0e4f44; --emerald-d:#093830;
  --saffron:#e8941a; --saffron-d:#c97a0a;
  --ivory:#faf6ee;   --cream:#f3ecdd;
  --ink:#1d2a27;     --muted:#5d6f6a;   --line:#e3dccb;
  --ok:#1e7d4f;      --err:#c0392b;

  /* additions: radius scale — reconciles the 14px vs 20px drift */
  --r-sm:8px; --r:14px; --r-lg:20px; --r-pill:99px;

  /* additions: the browns currently hardcoded inline in page.tsx */
  --cocoa:#4b352d;      /* was inline #4b352d in ~12 places */
  --saffron-l:#f6b85a;  /* was inline #f6b85a on hero + tags */

  /* additions: compliance rating — the differentiator, needs its own semantics */
  --veg-green:#1e7d4f;  /* dedicated veg/Jain kitchen, verified */
  --veg-amber:#c97a0a;  /* vegetarian but shared kitchen */
  --veg-red:#c0392b;    /* not recommended for this protocol */

  --shadow:0 10px 30px rgba(14,79,68,.10);
}
```

No new colours are invented. `--cocoa` and `--saffron-l` are literally the hex values already
scattered through `app/page.tsx` inline styles, promoted to tokens.

### 5.2 Drift to fix

| Problem | Where | Fix |
|---|---|---|
| Montserrat loaded over CDN and forced with `!important`, fighting Inter | `globals.css:102-106` | Delete. Inter is already wired via `next/font` |
| Raw hex in `style={{}}` in ~30 places | `app/page.tsx` | Move to the tokens above |
| `COOK.png` and `TOURGUIDE.png` are ~6.7 MB each | `public/Asset/` | Convert to WebP, serve via `next/image`. **Same artwork, same crop** — compression only |
| `<img>` everywhere | `app/page.tsx` | `next/image` with explicit dimensions (fixes CLS) |
| Whole homepage is `"use client"` for one filter | `app/page.tsx:1` | Server component + one small client island for the filter |
| Planner selection cards are click-only `<div>`s | `app/planner/page.tsx` | Real `<button>` / `role="radio"`, keyboard operable |
| Radius 14px vs 20px inconsistently | across | Use the scale |

### 5.3 New component inventory

Built with Tailwind + shadcn/ui themed to the tokens above (requires **ADR-004** — the current
`docs/DESIGN.md` forbids Tailwind without one). Marketing pages keep their existing hand-written
CSS and migrate opportunistically; only the new marketplace surfaces are Tailwind from day one.

**Traveller-facing**

| Component | Notes |
|---|---|
| `CircuitCard` | Hero image, name, blurb, package count, POI count |
| `PackageCard` | The competitive card. Above the fold: name, `Xd/Yn`, price from, veg badge, language chips. §6.2 |
| `VegComplianceBadge` | Green / amber / red pill with tooltip and link to `/verify` |
| `DeparturePicker` | Month calendar, price under each date, seats-left, disabled sold-out. §6.4 |
| `DateRangePicker` | Custom trips. Min-nights enforced from package |
| `TripRequestWizard` | 6 steps, resumable, saves to `localStorage` then to server |
| `PostRequestPanel` | Step 6: publish to providers — budget band, deadline, visibility toggle |
| `BidActivityStrip` | Live state on the traveller's request: N providers viewing, M bids, closes in X |
| `OfferComparison` | System matches + provider bids side by side; sticky compare bar on mobile |
| `BidCard` | One provider proposal: price, provider, compliance, inclusions delta, validity |
| `MaskedThread` | Traveller ↔ provider Q&A before booking. Contact details stripped |
| `ItineraryDay` | Day number, places, meals with compliance colour, stay, transport |
| `PriceBreakdown` | Per-person, group total, inclusions, exclusions, taxes, deposit due |
| `ProviderMiniCard` | Logo, name, type, verified badge, rating, response time |
| `BookingStepper` | Offer → travellers → payment → confirmed |
| `InstallPrompt` | PWA install, dismissible, shown after second visit |
| `OfflineBanner` | Appears when `navigator.onLine === false` |

**Provider-facing**

`OnboardingStepper` · `ListingForm` · `ComplianceEvidenceUpload` · `AvailabilityCalendarEditor`
· `BookingRequestCard` · `PayoutStatement` · `VerificationStatusBanner` · `RequestBoardCard` ·
`RequestBoardFilters` · `ProposalBuilder` · `ProposalStatusChip`

**Admin**

`VerificationQueue` · `EvidenceViewer` · `VendorApprovalPanel` · `BookingOverride` ·
`PayoutRunner`

### 5.4 Accessibility floor

- WCAG 2.2 AA. Saffron on ivory fails AA for body text — keep it for large text, fills and
  borders only. This is already the documented rule; the new components must not break it.
- Every calendar is keyboard-navigable (arrow keys move by day, PageUp/Down by month) and
  announces availability and price to screen readers.
- Compliance rating is never colour-alone: always colour **plus** icon **plus** text label.
- Skeletons, not spinners, for every async region.
- `prefers-reduced-motion` disables the custom cursor trail and all transitions.

---

## 6. Frontend design

### 6.1 Home page structure

Sections 1–11 of the current homepage stay in the same order with the same assets. Three
changes:

1. **After the hero**, insert a **circuit selector strip** — five cards, the primary entry point
   into the funnel. This is the single most important structural change.
2. **Section 5 (packages)** upgrades from the static six-card grid to real package cards with
   dates, nights, places and a real "from" price, plus a "See all packages" link.
3. **Add a trust strip** linking to `/verify` — the verification methodology page.

Everything else — about, why-us, destinations, food protocols, stays and cook, language guides,
traveller stories, FAQ, get-started banner — keeps its current copy, layout and imagery.

### 6.2 Package card (the card that has to win)

Because competitors anchor ~₹39.5k, the differentiators must be visible without a click:

```
┌────────────────────────────────────┐
│ [hero image — existing asset]      │
│ ● Ramayana Circuit                 │  circuit tag, saffron
├────────────────────────────────────┤
│ Sattvik Serenity                   │  Fraunces 600
│ 6 days · 5 nights · Ubud, Uluwatu  │  days/nights/places
│                                    │
│ 🟢 Jain-safe  🟢 Pure veg          │  compliance, colour+icon+text
│ हिन्दी  ગુજરાતી  English            │  language chips
│                                    │
│ from ₹1,18,000 /person             │  Fraunces, ink
│ ex-flights · next departure 12 Sep │  muted
│                                    │
│ [ View details ]  [ Check dates ]  │  emerald / saffron
└────────────────────────────────────┘
```

### 6.3 Package detail page — every field requested

| Block | Contents |
|---|---|
| **Hero** | Gallery (existing assets), package name, circuit tag, `X days / Y nights`, from-price, next departure |
| **Why choose this** | `why_choose[]` — 3–5 rationale bullets. *This is the "why" field.* |
| **Places covered** | `places[]` as chips + a map — Ubud, Uluwatu, Nusa Dua, Tegallalang… |
| **Day-by-day itinerary** | Per day: title, places, activities, meals with compliance colour, stay, transport |
| **What's included** | `inclusions[]` — stays, all meals to protocol, private transport, guide, activities, entry fees |
| **What's not included** | `exclusions[]` — international flights, visa on arrival, personal expenses, tips |
| **Food & compliance** | Protocol supported, kitchen type, per-meal ratings, accompanying-cook availability |
| **Stay** | Category, villa vs hotel, kitchen access, rooms and occupancy |
| **Guides & languages** | `languages[]` with Indian-script chips |
| **Group** | `group_size_min`–`group_size_max`, private vs shared departure |
| **Dates & price** | `DeparturePicker` — calendar, per-date price, seats left. §6.4 |
| **Price breakdown** | Per person by occupancy, group total, deposit, instalments, taxes |
| **Providers on this package** | Which verified providers deliver it, each with compliance badges |
| **Policies** | Cancellation, refund, the veg-guarantee refund promise |
| **Reviews** | Verified-booking-gated only |
| **Sticky CTA** | Mobile: from-price + "Check dates". Desktop: right rail booking box |

### 6.4 Calendar design

Two distinct calendars, deliberately different:

**A. Departure picker** — fixed departures on a package.

- Month grid, continuously scrollable on mobile.
- Every available date shows the **per-person price under the date** and a **seats-left** hint
  when ≤ 5.
- Sold-out and past dates are visually disabled with `aria-disabled`, never merely rejected.
- Today is always marked. Selection is high-contrast emerald fill.
- Price-variance legend: low season / regular / peak. Peak dates in saffron.
- Selecting a date auto-derives the return date from `nights` and highlights the whole span.

**B. Custom trip range picker** — the wizard.

- From/to range selection with min-nights enforced from the chosen package or circuit.
- A **"flexible — pick a month"** escape hatch, which is how most Indian group trips actually
  start. This maps to the existing `month` field in `PlannerInput` so nothing is lost.
- Blackout dates (Nyepi, provider-declared closures) disabled with an explanatory tooltip.
- Group-size-aware: warns when the requested size exceeds capacity available on those dates.

Both are one component with a `mode` prop. Both work fully by keyboard. Neither uses a
date-picker library that breaches the bundle budget — `react-day-picker` (~10 KB gz) or a
hand-rolled grid, decided at build time by measurement.

### 6.5 Trip request form — the traveller form

Six steps, resumable, no signup wall. State persists to `localStorage` immediately and to the
server as a `trip_request` draft once step 3 is reached.

| Step | Fields | Validation |
|---|---|---|
| 1. Circuit | Circuit (or "not sure yet") | — |
| 2. Dates | Exact range **or** flexible month + nights | Future dates; nights ≥ circuit minimum |
| 3. Group | Group size, crew type (family / friends / corporate / senior / honeymoon), rooms, children and ages, departure city | Size ≥ 1 |
| 4. Food & language | Protocol (Jain / vegetarian / vegan) **required**, kitchen access needed, accompanying cook, preferred guide language | **Cook requires group ≥ 10 — server-enforced, not just client** |
| 5. Contact | Name, mobile, email, WhatsApp opt-in, notes | Writes a `lead` row server-side on submit |
| 6. Post to providers *(optional)* | Budget band, special requirements, bid deadline, visibility toggle | Deadline 2–21 days ahead. §6.7 |

Protocol is a **hard filter**, never a scoring input. A non-compliant package must never be
shown, regardless of score. This is the promise the whole brand rests on.

On submit: `lead` written server-side → offers generated → traveller sees `/plan/[id]/offers`.
Login is requested only when saving, quoting or booking — not to browse.

### 6.6 Multiple offers

Against one trip request, the traveller sees 2–4 offers. Each is a `quote` built from a package
plus a specific provider's listings. Compared on: total price, price per person, provider and
their rating, compliance rating, inclusions delta, cancellation policy, response time.

The comparison view highlights the delta between offers rather than repeating identical rows —
identical inclusions collapse into "same as offer 1".

### 6.7 Traveller-posted requests — the request board

The traveller publishes their own asking package; verified providers see it and bid.

#### What the traveller posts

Everything already captured in the wizard, plus step 6:

| Field | Note |
|---|---|
| Group size, days, nights | From steps 2–3 |
| Dates or flexible month | From step 2 |
| Protocol, language, kitchen, cook | From step 4 — the hard requirements |
| **Budget band** | Range, per person or total. Optional but strongly encouraged — requests without a band get materially fewer bids |
| **Special requirements** | Free text plus structured tags: wheelchair access, senior-friendly pace, infant, fasting days (Paryushan / Ekadashi), temple access, celebration, corporate invoicing |
| **Bid deadline** | 2–21 days ahead. Auto-closes |
| **Visibility** | `private` (system matches only) · `open_to_verified` (default) · `invite_only` (a shortlist of providers) |

#### What providers see — and what they never see

The board entry is **anonymised by construction**. It is a projection, not the row:

```
Shown:     Group of 14 · Jain · 6D/5N · 12–18 Sep · ex-Ahmedabad
           Budget ₹1,00,000–1,30,000 /pax · Ramayana circuit
           Needs: villa kitchen, Gujarati-speaking guide, senior-friendly pace
           Posted 2 days ago · 4 providers viewing · 3 bids · closes in 5 days

Never shown: name · phone · email · WhatsApp · exact address · other providers' bid amounts
```

Traveller contact details are released **only when a booking is confirmed**. This is enforced in
the service layer with its own test, not by omitting fields from a component.

#### Who can bid

Only providers who are `verification_status = verified` **and** verified for the requested
protocol **and** whose capacity range covers the group size. A provider not verified for Jain
cannot see, let alone bid on, a Jain request. The board is filtered by the same hard compliance
rule as the matching engine — there is one rule, used twice.

#### Anti-abuse and anti-disintermediation

| Risk | Control |
|---|---|
| Bid spam | Max active proposals per provider, tiered by verification age and rating. Rate-limited |
| Lowball race to the bottom | Bids are not publicly ranked by price; the traveller sees compliance, USP and rating with equal weight |
| Taking the deal off-platform | All pre-booking contact goes through `MaskedThread`. Phone numbers, emails and URLs are stripped and the attempt is logged |
| Fake demand | A traveller must verify mobile via OTP before a request can be posted publicly. Anonymous requests stay `private` |
| Stale boards | Auto-close at the deadline; auto-expire abandoned drafts; providers see a live "closes in" countdown |
| Provider ghosting | Response rate and time are tracked on `vendor` and shown on every bid |

#### The proposal

A provider builds a proposal from their own listings; it creates an `offer` with
`origin = 'vendor_bid'`. Same object as a system-generated match, so the comparison view,
acceptance flow, booking, pricing and payout logic are all shared — no parallel code path.

A proposal carries: total price and per-person price, line items drawn from real listings,
inclusions and exclusions, the provider's **USP bullets** (`vendor_highlight`), compliance
ratings per listing, a validity window, and an optional day-by-day plan.

**Only2Bali still prices the traveller-facing total.** The provider proposes their net; the
platform applies commission and shows the traveller one all-in number. The provider never sets
the traveller's price directly — otherwise commission becomes negotiable and the ledger stops
balancing.

#### The traveller's view

`/plan/[id]/offers` merges both origins into one comparison, sorted by relevance not price.
Each card shows origin honestly — "Matched by Only2Bali" or "Proposed by <provider>". The
traveller can shortlist, ask questions through the masked thread, request a revision, decline
with a reason, or accept. Accepting closes the request and notifies the unsuccessful bidders,
which is what keeps providers willing to bid again.

### 6.8 PWA

Three non-negotiables plus travel-specific caching.

**Manifest** (`app/manifest.ts`) — name "Only2Bali", short name "Only2Bali",
`display: standalone`, `theme_color: #0e4f44`, `background_color: #faf6ee`, portrait,
icons 192/512 + maskable, generated from the existing logo asset. No new artwork.

**Service worker** — `@serwist/next` (the maintained successor to the abandoned `next-pwa`).

| Content | Strategy | Why |
|---|---|---|
| App shell, JS, CSS, fonts | Precache | Instant repeat load |
| Existing images in `/Asset/` | Cache-first, 30-day expiry | Large, immutable |
| Package and circuit pages | Stale-while-revalidate | Read-heavy, changes slowly |
| Availability and price | **Network-only** | Never serve a stale price or a sold-out seat |
| Booked itinerary, vouchers, provider contacts | Cache-first + IndexedDB | **The offline win** — works on Bali roaming |
| Auth, payment, booking writes | Network-only | Never queued, never cached |

**Offline behaviour** — booked trips are readable offline: itinerary, day plan, vouchers,
addresses, provider phone numbers, emergency contacts. Everything else falls back to a branded
offline page. `OfflineBanner` shows current state.

**Background Sync** — used only for safe, idempotent writes: saving a trip draft, adding a note.
Payments and bookings are never queued offline; the UI states plainly that a connection is
required.

**Install prompt** — captured `beforeinstallprompt`, shown on second visit or after a trip
request is submitted, dismissible and remembered.

**Deferred to a later phase** — push notifications for booking updates and payment reminders.
Real value, but needs a notification permission strategy that does not burn trust on visit one.

---

## 7. Backend design

### 7.1 Stack

Next.js App Router full-stack on Vercel. Server components by default; route handlers and server
actions for mutations. Postgres (Neon or Supabase) via **Drizzle** — lighter than Prisma, no
engine binary, faster cold starts, which matters on Vercel functions. Vercel KV (Redis) for rate
limiting, sessions and short-lived caches. Zod at every boundary.

The legacy Django backend is bridged, not big-banged: it keeps serving existing accounts until
Phase 6 retires it. The dead FastAPI app under `Backend/app/` is deleted, not secured.

### 7.2 Layering

```
app/**              route handlers + server actions   (HTTP, auth guard, Zod parse)
lib/services/**     business logic                    (pure, unit-tested)
lib/repositories/** data access                       (Drizzle queries only)
lib/db/schema/**    Drizzle schema + migrations
lib/validators/**   Zod schemas, shared client+server
```

Route handlers never touch Drizzle directly. Services never read `request`. This is what makes
the matching engine and the pricing engine testable without a server.

### 7.3 API surface

**Public**

```
GET  /api/circuits
GET  /api/circuits/[key]
GET  /api/packages                 ?circuit&protocol&tier&days&month&minPrice&maxPrice
GET  /api/packages/[slug]
GET  /api/packages/[slug]/availability   ?from&to   → per-date price + seats
GET  /api/providers                ?type&circuit&area&protocol
GET  /api/providers/[slug]
POST /api/trip-requests            → creates trip_request + lead   (rate-limited)
GET  /api/trip-requests/[id]       (token-scoped for anonymous)
POST /api/planner                  AI itinerary — Zod in, Zod out, timeout, rate-limited
```

**Request board**

```
POST  /api/me/trips/[id]/publish     open to providers — requires verified mobile
POST  /api/me/trips/[id]/unpublish   close early
PATCH /api/me/trips/[id]/visibility  private | open_to_verified | invite_only
GET   /api/me/trips/[id]/bids        bids on my request
POST  /api/me/bids/[id]/shortlist
POST  /api/me/bids/[id]/decline      with reason
POST  /api/me/bids/[id]/revision     ask the provider to revise

GET   /api/partner/requests          board, filtered to what this provider may serve
GET   /api/partner/requests/[id]     anonymised projection only
POST  /api/partner/requests/[id]/proposals   submit a bid  (quota + rate limited)
PATCH /api/partner/proposals/[id]    revise while still open
POST  /api/partner/proposals/[id]/withdraw

GET|POST /api/threads/[id]/messages  masked traveller ↔ provider thread
```

**Auth (passwordless)**

```
POST /api/auth/request-otp         rate-limited per identifier AND per IP
POST /api/auth/verify-otp          hashed compare, attempt cap, single use
POST /api/auth/logout
GET  /api/auth/session
```

**Traveller (authenticated)**

```
GET  /api/me/trips
GET  /api/me/trips/[id]
POST /api/me/trips/[id]/claim      attach an anonymous trip to the account
GET  /api/me/offers/[id]
POST /api/me/offers/[id]/accept    → creates booking, server-recomputed price
GET  /api/me/bookings/[id]
GET  /api/me/bookings/[id]/bundle  offline bundle: itinerary + vouchers + contacts
POST /api/me/bookings/[id]/cancel
```

**Provider (authenticated, role=vendor)**

```
POST /api/partner/signup
GET|PATCH /api/partner/profile
GET|POST  /api/partner/listings
GET|PATCH|DELETE /api/partner/listings/[id]
POST /api/partner/listings/[id]/evidence        compliance evidence upload
GET|PUT  /api/partner/listings/[id]/availability
GET  /api/partner/bookings
POST /api/partner/bookings/[id]/confirm
GET  /api/partner/payouts
```

**Admin (role=admin)**

```
GET  /api/admin/verification-queue
POST /api/admin/vendors/[id]/verify        { status, notes, compliance_ratings }
GET  /api/admin/bookings
POST /api/admin/payouts/run
```

**Webhooks**

```
POST /api/webhooks/payments        signature-verified, idempotent
```

Every response uses one envelope: `{ success, data?, error?, meta? }`.

### 7.4 Matching and compliance engine

Extends the existing, already-tested `lib/recommend.ts` rather than replacing it. Its scoring
weights are kept; its data source moves from the hardcoded `CATALOG` to Postgres.

```
1. Circuit filter          — if the traveller picked one
2. HARD protocol filter    — verified compliance only. Non-compliant is invisible. Never scored.
3. Date availability filter— seats ≥ group size on the requested dates
4. Capacity filter         — group_size within [min, max]
5. Score:  +3 budget tier match
           +2 per interest overlap
           +2 kitchen requirement met
           +1 guide language match
           +2 accompanying cook available when group ≥ 10
           +2 provider verification recency and rating      ← new
           +1 departure date proximity to request           ← new
6. Take top N per provider, build 2–4 competing offers
7. Price server-side. The client never sends an amount.
```

**AI itinerary** (Gemini, server-side only — the key never reaches the client): structured
prompt, Zod-validated response shape, and a **protocol re-check on the generated output** before
it is ever labelled compliant. A model that hallucinates a non-veg restaurant must fail closed,
falling back to the curated itinerary. Timeout 1.5 s hard, then serve the curated version.

### 7.5 Pricing engine

Money is **always integer minor units**, never float. Every amount carries a currency.

```
base            = package_base_price × pax  (by occupancy)
+ date modifier = seasonal multiplier for the departure date
+ add-ons       = cook, kitchen villa upgrade, extra activities
+ provider delta= chosen provider's listing prices
─────────────────────────────────────────────
= subtotal
+ taxes/fees
= gross_amount                     ← server-computed, authoritative
  ├── commission_amount = gross × commission_rate (10–20%)
  └── net_amount        = gross − commission → provider payout
```

Client-supplied prices are ignored on every path. Quotes snapshot their line items so a later
price change cannot alter an accepted quote.

### 7.6 Auth and sessions

Passwordless for everyone. 6-digit OTP, **hashed at rest**, attempt-capped, single-use,
short-expiry, rate-limited per identifier and per IP. Sessions are opaque tokens in **httpOnly,
Secure, SameSite=Lax cookies** — explicitly not JWT in `localStorage`, which is the known defect
in the legacy React app.

Three roles: `traveller`, `vendor`, `admin`. Authorisation is enforced in middleware **and**
re-checked in every service that touches a resource, because the existing codebase has a live
IDOR (an unauthenticated delete-any-trip endpoint) that came precisely from trusting one layer.

### 7.7 Security floor

| Control | Implementation |
|---|---|
| CSP + security headers | Middleware, all responses |
| Rate limiting | Vercel KV — per IP on auth and AI, per user on API |
| Input validation | Zod on every route handler and server action |
| Authorisation | Ownership check in the service layer, not only middleware |
| SQL injection | Drizzle parameterised queries only |
| Secrets | Environment variables only. **Revoke the committed Zoho tokens and rotate the SpringEdge SMS key at the provider** — deleting the lines does not revoke them. Zoho is dropped as an integration, so revoke rather than rotate |
| File upload | Type and size validated, virus-scanned, stored out of the app origin, never executable |
| Audit log | Append-only on login, role change, verification decision, price override, payout |
| PII | Traveller contact details visible to a provider only after booking confirmation |
| Payments | Server-only, PCI scope minimised, webhook signatures verified, idempotency keys on every write |

---

## 8. Database design

Postgres. Every table: UUID `id`, `created_at`, `updated_at`. Money: integer minor units +
currency. Timestamps: UTC `timestamptz`.

### 8.1 Identity

**`account`** — `email` unique, `mobile` unique nullable, `role` (`traveller`|`vendor`|`admin`),
`status`, `email_verified_at`, `mobile_verified_at`, `last_login_at`.

**`otp_code`** — `account_id`, `code_hash`, `purpose`, `attempts`, `max_attempts`, `expires_at`,
`consumed_at`.

**`session`** — `account_id`, `token_hash`, `user_agent`, `ip`, `expires_at`.

**`audit_log`** — `account_id`, `action`, `resource_type`, `resource_id`, `details` jsonb, `ip`.

### 8.2 Circuit spine

**`circuit`** — `key` (`ramayana`|`adventure`|`culinary`|`artistic`|`wellness`), `name`, `blurb`,
`story`, `hero_image`, `sort_order`, `active`.

**`point_of_interest`** — `circuit_id`, `name`, `area`, `description`, `typical_duration_minutes`,
`lat`, `lng`, `image`.

**`place`** — `name`, `area`, `region` (`bali`|`java`|`lombok`|…), `lat`, `lng`.
Normalised so a package's `places` are real rows, not free text.

### 8.3 Package — carrying every field requested

**`package`**

| Column | Type | Note |
|---|---|---|
| `slug` | text unique | URL |
| `name` | text | **Package name** |
| `days` | int | **Number of days** |
| `nights` | int | **Number of nights** — explicit, not derived |
| `tier` | enum | `economical`\|`comfort`\|`premium` — **display label only, never a price boundary** (§2.3) |
| `protocols` | enum[] | `jain`\|`vegetarian`\|`vegan` — the hard filter |
| `group_size_min` / `group_size_max` | int | |
| `base_price_amount` | bigint | **Price**, minor units, per person |
| `base_price_currency` | text | `INR` default |
| `price_unit` | enum | `per_person`\|`per_group` |
| `hero_image` / `gallery` | text / text[] | Existing assets |
| `blurb` | text | Card copy |
| `description` | text | Long form |
| `kitchen` / `cook_ready` | bool | Carried from the current catalog |
| `languages` | text[] | Guide languages |
| `departure_type` | enum | `fixed`\|`on_request`\|`private` |
| `cancellation_policy_id` | fk | |
| `status` | enum | `draft`\|`published`\|`archived` |

**`package_circuit`** — M2M. A package can span circuits.

**`package_place`** — M2M package ↔ place, with `sort_order`. **This is "Places".**

**`package_inclusion`** — `package_id`, `kind` (`included`|`excluded`), `category`
(`stay`|`meals`|`transport`|`guide`|`activity`|`fees`|`other`), `label`, `detail`, `sort_order`.
**This is "what they are offering".**

**`package_highlight`** — `package_id`, `text`, `icon`, `sort_order`.
**This is the package USP — "Why choose this package".** Short benefit statements, ordered.

**`package_day`** — `package_id`, `day_number`, `title`, `summary`, `stay_area`,
`transport_note`. Day-by-day itinerary.

**`package_day_place`** — M2M day ↔ place.

**`package_day_meal`** — `package_day_id`, `meal` (`breakfast`|`lunch`|`dinner`),
`description`, `compliance_rating` (`green`|`amber`|`red`), `listing_id` nullable.
**This is the per-meal colour-coded compliance differentiator.**

**`package_price_tier`** — `package_id`, `occupancy` (`single`|`double`|`triple`|`child`),
`amount`, `currency`. Occupancy-based pricing.

### 8.4 Availability and departures — the calendar

**`departure`** — `package_id`, `start_date`, `end_date` (derived from `nights`),
`price_amount`, `price_currency`, `seats_total`, `seats_held`, `seats_booked`,
`status` (`open`|`filling`|`sold_out`|`cancelled`), `is_peak`, `notes`.

`seats_available = seats_total − seats_held − seats_booked`, computed, never stored.
This table is what the departure calendar reads.

**`availability`** — `service_listing_id`, `date`, `status` (`open`|`held`|`booked`|`blocked`),
`price_override_amount`, `hold_expires_at`.
Provider-level per-date availability, edited in the provider dashboard.

**`blackout_date`** — `scope` (`global`|`circuit`|`vendor`|`listing`), `scope_id`, `date`,
`reason`. Nyepi, provider closures, festivals.

**`seat_hold`** — `departure_id`, `trip_request_id`, `seats`, `expires_at`.
A short TTL hold created when a traveller enters checkout, preventing the classic double-book.

### 8.5 Provider (service provider / vendor)

**`vendor`** — `account_id` unique, `slug`, `business_name`, `legal_name`,
`vendor_type` (`restaurant`|`accommodation`|`transport`|`guide`|`cook`|`produce`|`artisan`|
`activity_operator`|`tour_agency`), `base_area`, `description`, `logo`, `cover_image`,
`whatsapp`, `phone`, `email`, `website`, `languages` text[],
`verification_status` (`draft`|`pending`|`in_review`|`verified`|`rejected`|`suspended`),
`verified_at`, `verified_by`, `rejection_reason`, `commission_rate`, `rating_avg`,
`rating_count`, `response_time_minutes`, `onboarding_step`.

**`vendor_highlight`** — `vendor_id`, `text`, `icon`, `sort_order`.
**This is the provider USP — "Why this provider is best".** Rendered on the provider profile,
every offer card and every bid. Admin-moderated during verification so it cannot become a claim
the platform has not checked (a provider cannot self-award "100% Jain certified").

**`vendor_document`** — `vendor_id`, `kind` (`business_licence`|`tax_id`|`insurance`|`photo_id`|
`kitchen_certificate`), `file_url`, `status`, `reviewed_by`, `reviewed_at`.
Incremental KYC: minimum to activate, more requested later.

**`service_listing`** — `vendor_id`, `title`, `service_type`, `description`, `area`,
`capacity_min`, `capacity_max`, `tier`, `price_amount`, `price_currency`,
`price_unit` (`per_person`|`per_day`|`per_group`|`per_night`|`per_trip`),
`images` text[], `status` (`draft`|`pending_review`|`active`|`paused`|`rejected`), `active`.

**`listing_circuit`** — M2M listing ↔ circuit.

**`listing_compliance`** — `service_listing_id`, `protocol`,
`guarantee_level` (`certified`|`capable`|`on_request`|`not_supported`),
`rating` (`green`|`amber`|`red`), `kitchen_type` (`dedicated_veg`|`separate_line`|`shared`),
`evidence_url`, `evidence_notes`, `verified_by`, `verified_at`, `expires_at`.

Compliance **expires** and must be re-verified. A lapsed compliance record silently drops the
listing out of matching rather than serving a stale guarantee.

### 8.6 Trip, offer, booking

**`trip_request`** — `traveller_id` nullable (anonymous allowed), `anon_token`, `circuit_id`,
`status` (`draft`|`submitted`|`quoted`|`booked`|`expired`|`cancelled`), `protocol`, `tier`,
`group_size`, `crew_type`, `rooms`, `children_ages` int[], `from_date`, `to_date`,
`flexible_month`, `nights`, `departure_city`, `interests` text[], `kitchen_required`,
`cook_required`, `preferred_language`, `notes`.

Posting fields (§6.7): `visibility` (`private`|`open_to_verified`|`invite_only`),
`published_at`, `bids_close_at`, `closed_at`, `close_reason`,
`budget_min_amount` **nullable**, `budget_max_amount` **nullable**, `budget_currency`,
`budget_basis` (`per_person`|`total`|`unsure`), `special_requirements` text,
`requirement_tags` text[], `mobile_verified` bool.

`budget_min` and `budget_max` are **both nullable and independently so** — this is what makes
the range open-ended per §2.3. Null min = "up to ₹X". Null max = "₹X and above". Both null =
"not sure, advise me". No enforced floor, no enforced ceiling.

`cook_required = true` requires `group_size >= 10` — a database check constraint, not only
application logic. `visibility != 'private'` requires `mobile_verified = true` — also a check
constraint, so unverified demand can never reach the board.

**`request_invite`** — `trip_request_id`, `vendor_id`, `invited_at`. For `invite_only`.

**`request_board_view`** — `trip_request_id`, `vendor_id`, `viewed_at`, `view_count`.
Powers the "4 providers viewing" signal and detects scraping.

**`lead`** — `trip_request_id`, `account_id` nullable, `source`
(`web`|`planner`|`whatsapp`|`package_page`|`partner_referral`), `name`, `email`, `mobile`,
`whatsapp_optin`, `message`, `status` (`new`|`contacted`|`quoted`|`converted`|`lost`).

Leads live in our own Postgres. **No CRM integration in this build** — the Zoho sync is dropped
(owner decision, 2026-07-22). `/admin/leads` is the working surface. A CRM can be added later
against this table without changing the capture path.

**`itinerary`** — `trip_request_id`, `source` (`ai`|`curated`|`hybrid`), `compliance_checked`,
`days` jsonb (schema-validated), `generated_at`, `model_version`.

**`offer`** (a quote or a bid — one object, two origins) — `trip_request_id`, `vendor_id`,
`package_id` nullable, `departure_id` nullable, `title`, `summary`,
**`origin`** (`system_match`|`vendor_bid`), `total_amount` (**traveller-facing, platform-computed**),
`vendor_net_amount` (**what the provider proposed**), `commission_rate`, `currency`,
`price_per_person`, `line_items` jsonb (snapshotted listing id + price + label),
`inclusions_delta` jsonb, `day_plan` jsonb nullable, `valid_until`,
`status` (`draft`|`sent`|`viewed`|`shortlisted`|`revision_requested`|`accepted`|`declined`|
`withdrawn`|`expired`), `decline_reason`, `rank`, `score`, `submitted_at`.

Multiple offers per trip request — this is the "multiple offers and packages to select from".
A system match and a provider bid are the same row type, so acceptance, booking, pricing and
payout have exactly one code path. The provider sets `vendor_net_amount`; the platform derives
`total_amount`. A provider can never set the traveller-facing price directly.

**`proposal_quota`** — `vendor_id`, `period`, `max_active`, `used`. Bid-spam control, tiered by
verification age and rating.

**`message_thread`** — `trip_request_id`, `vendor_id`, `booking_id` nullable, `status`.
**`message`** — `thread_id`, `sender_account_id`, `body_raw`, `body_masked`,
`contact_attempt_detected` bool, `sent_at`, `read_at`.

Pre-booking, travellers and providers see `body_masked` only — phone numbers, emails and URLs
stripped. `contact_attempt_detected` is logged for anti-disintermediation review. After a
booking is confirmed, the thread unmasks and real contact details are released.

**`booking`** — `trip_request_id`, `offer_id`, `traveller_id`, `package_id`, `departure_id`,
`vendor_id`, `reference` (human-readable, e.g. `O2B-2609-4821`), `pax`, `rooms`,
`gross_amount` (**server-recomputed**), `currency`, `commission_rate`, `commission_amount`,
`net_amount`, `status` (`pending_payment`|`confirmed`|`in_progress`|`completed`|`cancelled`|
`refunded`), `confirmed_at`, `cancelled_at`, `cancellation_reason`.

**`booking_traveller`** — `booking_id`, `full_name`, `age`, `gender`, `passport_number`
(encrypted), `passport_expiry`, `dietary_notes`, `is_lead`.

**`booking_document`** — `booking_id`, `kind` (`voucher`|`ticket`|`invoice`|`itinerary_pdf`|
`insurance`), `file_url`, `issued_at`. These are what the PWA caches for offline.

**`review`** — `booking_id`, `vendor_id`, `package_id`, `rating` 1–5,
`food_compliance_kept` bool, `comment`, `published`, `moderated_by`.
Verified-booking-gated only — no review without a completed booking.

### 8.7 Money

**`payment`** — `booking_id`, `provider`, `provider_ref`, `kind` (`deposit`|`instalment`|
`balance`|`full`), `amount`, `currency`, `status` (`created`|`authorized`|`captured`|`failed`|
`refunded`), `idempotency_key` unique, `paid_at`.

**`payment_schedule`** — `booking_id`, `sequence`, `due_date`, `amount`, `status`,
`reminder_sent_at`. Deposit-plus-instalment, the travel norm.

**`vendor_payout_account`** — `vendor_id`, `method` (`bank`|`wise`|`connect`), `currency`,
`token_ref` (**tokenised — never raw bank details**), `verified_at`.

**`payout`** — `booking_id`, `vendor_id`, `gross_amount`, `commission_rate`,
`commission_amount`, `net_amount`, `currency`,
`status` (`pending`|`held`|`approved`|`paid`|`failed`|`reversed`),
`rbi_purpose_code`, `provider_ref`, `released_at`.

`rbi_purpose_code` exists **from day one** even before automated payouts, because
retro-fitting it later is far more expensive than carrying an unused column.

**`ledger_entry`** — append-only: `booking_id`, `type` (`charge`|`commission`|`payout`|`refund`|
`adjustment`), `amount`, `currency`, `direction` (`debit`|`credit`), `reference`.
Charge must always equal commission + payout. This is the reconciliation invariant.

**`refund`** — `booking_id`, `payment_id`, `amount`, `reason`
(`cancellation`|`veg_guarantee_failure`|`provider_failure`|`goodwill`), `status`,
`clawback_payout_id` nullable.

`veg_guarantee_failure` is a first-class refund reason — the differentiator encoded in the
schema, not just in the marketing copy.

### 8.8 Supporting

**`cancellation_policy`** — `name`, `rules` jsonb (days-before → refund percentage).
**`content_block`** — CMS-lite for the verification methodology page and FAQ.
**`notification`** — `account_id`, `channel` (`email`|`whatsapp`|`push`|`in_app`), `template`,
`payload` jsonb, `sent_at`, `read_at`.

### 8.9 Indexes that matter

```
package(status, tier)                          catalogue browse
package_circuit(circuit_id, package_id)        circuit pages
departure(package_id, start_date, status)      the calendar — hottest read path
availability(service_listing_id, date)         provider calendar
service_listing(vendor_id, status, active)     provider dashboard
listing_compliance(service_listing_id, protocol, rating)   the hard filter
trip_request(traveller_id, status)             account page
trip_request(visibility, status, bids_close_at)  THE REQUEST BOARD — hot read for every provider
trip_request(protocol, group_size)             board eligibility filter
booking(traveller_id, status) / (vendor_id, status)
offer(trip_request_id, rank)
offer(vendor_id, status, submitted_at)         provider's proposals list
message(thread_id, sent_at)
ledger_entry(booking_id)                       reconciliation
session(token_hash)                            every authenticated request
```

---

## 9. Key flows

### 9.1 Traveller: browse to booked

```
Home → circuit strip → /circuits/ramayana → package card → /packages/sattvik-serenity
  → DeparturePicker: pick 12 Sep (₹1,18,000, 4 seats left)
  → "Check availability for my group" → wizard steps 3–5 prefilled from the package
  → submit → lead written server-side → matching engine runs
  → /plan/[id]/offers — 3 offers from 3 verified providers
  → open offer → OTP login (first point a login is required)
  → accept offer → seat_hold created (15 min TTL)
  → payment: deposit now, balance schedule shown
  → booking confirmed → vouchers issued → PWA caches the offline bundle
  → travel → review (gated on completed booking)
```

### 9.2 Traveller posts, providers bid

```
wizard step 6 → verify mobile by OTP → publish
  → trip_request(visibility=open_to_verified, bids_close_at=+7d)
  → board projection built — anonymised, contact stripped
  → eligible providers only: verified + verified for THIS protocol + capacity covers group
  → provider opens /partner/requests/[id] → request_board_view logged
  → provider builds proposal from own listings → offer(origin=vendor_bid, vendor_net_amount)
      → quota + rate limit checked
      → platform derives total_amount = net + commission
  → traveller sees system matches AND bids in one comparison, sorted by relevance not price
  → questions via MaskedThread (contacts stripped, attempts logged)
  → shortlist / request revision / decline with reason
  → accept ONE → request closes → unsuccessful bidders notified → booking flow (§9.1)
  → contact details released to the winning provider ONLY on booking confirmation
```

### 9.3 Provider: signup to first booking

```
/partner → /partner/signup (email or mobile) → OTP → account(role=vendor)
  → onboarding step 1: business basics, type, area, languages
  → step 2: upload listings — title, type, circuits, capacity, price + unit, photos
  → step 3: per-listing compliance — protocol, guarantee level, kitchen type, EVIDENCE UPLOAD
  → step 4: payout account (tokenised) — can be deferred; blocks payouts, not listing
  → submit → vendor.verification_status = pending
  → ADMIN verification queue: reviews evidence, sets green/amber/red per listing, approves
  → vendor verified → listings active → they enter matching
  → booking arrives → provider confirms → delivers → payout released after vouchers issued
```

The gate is the point. Providers do the data entry; Only2Bali owns the verification decision.
Nothing a provider types is publicly visible before an admin has approved it.

### 9.4 Money

```
Traveller ──pays full price──► Only2Bali (merchant of record)
                                  ├── keeps commission (10–20%)
                                  └── pays provider net ──► provider payout account

capture payment → ledger_entry(charge)
                → compute commission
                → payout(gross, commission, net) created, status = held
                → vouchers issued → payout approved → paid → ledger_entry(payout)
refund reverses the chain; traveller is refunded first, clawed back from provider after.
```

**⚠ Regulatory gate — blocking, not advisory.** Paying Bali providers from India must route
through an **RBI PA-CB (Payment Aggregator – Cross-Border) licensed provider** or an AD
Category-I bank, with an **RBI purpose code on every payout**. LRS does not apply to a company.
Only2Bali cannot self-build this rail. v1 runs **manual/hybrid** — automated collection, manual
payout, full ledger — while a licensed partner is onboarded. Engage a payments/legal advisor
before any payout goes live.

---

## 10. Non-functional targets

Inherited from `AGENTS.md`, unchanged:

| Metric | Budget |
|---|---|
| TTFB p75 (edge) | ≤ 200 ms |
| LCP p75 | ≤ 2.5 s |
| INP p75 | ≤ 200 ms |
| Third-party API call | ≤ 1.5 s hard timeout, then degraded path |
| Cache hit ratio, search reads | ≥ 85% |
| Client JS per route | ≤ 170 KB gz |
| Error budget | 99.9% monthly |

The bundle budget is the reason Tailwind + shadcn/ui is acceptable (copy-paste components, no
runtime) while a full component library is not. Every new dependency is measured against it —
including the date picker.

Testing: Vitest for services (95% on pricing, matching and booking state; 80% elsewhere),
Playwright for each critical flow, contract tests against recorded provider fixtures. Failure
paths are mandatory tests: every timeout, circuit breaker and fallback must have a test proving
the degraded state renders.

---

## 11. Open decisions

| # | Decision | Needed by | Recommendation |
|---|---|---|---|
| 1 | ORM: Drizzle vs Prisma | Phase 2 start | **Drizzle** — lighter, faster cold start on Vercel |
| 2 | Postgres host: Neon vs Supabase vs Vercel Postgres | Phase 2 start | **Neon** — branching per PR, generous free tier |
| 3 | ~~Payment provider~~ | — | **Decided: Razorpay, integrated later.** Not in the initial build. Bookings run payment-less (request → confirm → pay offline) until Phase 7 |
| 4 | Default commission rate | Phase 7 | 15% opening, per-vendor override |
| 5 | Legal entity for holding money cross-border | Before any payout | Professional advice, not an engineering call |
| 6 | Fifth circuit (Wellness) — ship or hold | Phase 2 seed | Hold at four; add when supply exists |
| 7 | Push notifications | Post-launch | Defer; ask permission only after a booking exists |
| 8 | Retire the legacy React app | Phase 9 | Only after accounts reach parity |
| 9 | ~~CRM~~ | — | **Decided: none.** Zoho sync dropped. Leads live in Postgres, worked from `/admin/leads` |
| 10 | Bid quota per provider | Phase 6 | Start 5 active; tier up with rating and verification age |
| 11 | Bid deadline default | Phase 6 | 7 days, traveller-adjustable 2–21 |
| 12 | Are bid amounts visible between providers | Phase 6 | **No.** Blind bidding — prevents a race to the bottom that would erode the veg guarantee |
