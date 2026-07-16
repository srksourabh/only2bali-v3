# Only2Bali - platform build-out plan

> A detailed plan to turn Only2Bali from "a website with a questionnaire" into a
> two-sided marketplace: verified Bali service providers on one side, Indian
> vegetarian / Jain / vegan group travellers on the other.
>
> Written 2026-07-16, off the back of the full codebase review. Plain English first,
> then schema and flows. Decisions that need Sourabh's call are marked **[DECIDE]**.
>
> **Locked decisions (2026-07-16):**
> 1. **Backend = Next.js full-stack** (Option A, delivered the bridge way - §2).
> 2. **Version one = curated matcher** - Only2Bali enlists and verifies vendors;
>    vendor self-onboarding (§5) is a later phase. Same schema either way.
>
> Still open: payments provider + commission model (§8); these do not block Phases 1-2.

---

## 1. What we are building, in one paragraph

Today the product captures a trip questionnaire and pushes a lead to Zoho. The plan is
to make it a **marketplace**: Bali suppliers (hotels/villas, transport, guides, cooks,
restaurants, activity operators) enlist and get **verified** for dietary compliance;
Indian travellers plan a group trip, get matched only to verified-compliant options,
and book. The moat is not the catalogue or the AI - it is the **verified 100% Jain /
veg / vegan guarantee**, which is hard for a generic operator to copy.

Two user types drive everything:
- **Service providers (vendors)** - supply-side. They list services and get leads.
- **Service takers (customers)** - demand-side. They plan and book trips.

---

## 2. Architecture - the one decision that shapes the rest

The review found the Django backend is live but carries real security debt, the FastAPI
app is dead and internally broken, and Next.js is the intended future but has no
accounts. A marketplace is mostly **new** functionality, so where we build it matters.

**[DECIDE] Pick the backend direction:**

| | Option A - Next.js full-stack **(recommended)** | Option B - Keep Django as the API | Option C - Bridge |
|---|---|---|---|
| Shape | Next.js API routes + Postgres (Prisma/Drizzle) + Vercel KV, on Vercel | Harden Django, add vendor/customer models, Next.js calls it | New marketplace in Next.js full-stack; Django kept only for existing legacy logins until migrated |
| Reuses live data | No (migrate) | Yes | Partly |
| Matches AGENTS.md target | Yes | No | Yes |
| Security posture | Clean by design | Inherits debt (must fix Tier 1 first) | Clean for the new part |
| Effort | Medium-high rebuild | Medium, but two stacks forever | Medium; retires legacy gradually |
| Recommendation | **Best long-term** | Fastest to reuse accounts | **Best if you want to move now without a big-bang migration** |

**My recommendation: Option A, delivered the Option C way** - build the marketplace
fresh in Next.js full-stack, keep the old Django logins alive only until the new
accounts are ready, then retire Django and delete FastAPI. This avoids doubling down on
the legacy stack while never taking the live site down.

The schema and flows below are written to be **stack-agnostic** - the same tables work
whether they land in Postgres-via-Prisma (Option A) or Django models (Option B).

---

## 3. Data model - the entities and how they relate

```
                         ┌────────────┐
                         │  Account   │  (email/mobile, one login per human/business)
                         └─────┬──────┘
              role=customer    │    role=vendor
            ┌──────────────────┴──────────────────┐
            ▼                                      ▼
     ┌────────────┐                         ┌────────────┐
     │  Customer  │                         │   Vendor   │  business, verification status
     └─────┬──────┘                         └─────┬──────┘
           │ 1:N                                  │ 1:N
           ▼                                      ▼
     ┌────────────┐    matched to          ┌───────────────┐
     │ TripRequest│◄──────────────────────►│ ServiceListing│  price, area, dietary caps
     └─────┬──────┘   (Match / Quote)      └───────┬───────┘
           │ 1:1                                    │ N:1
           ▼                                        ▼
     ┌────────────┐                          ┌────────────┐
     │  Itinerary │  day-by-day plan         │ Compliance │  Jain/veg/vegan, verified
     └─────┬──────┘                          └────────────┘
           │ 1:1
           ▼
     ┌────────────┐
     │  Booking   │  selected listings, price, deposit, payment status
     └────────────┘

  Lookup tables (shared): Protocol, Tier, Area, Language, Interest, ServiceType, VendorType
  Pre-account:            Lead  (WhatsApp/email capture before someone signs up)
```

The design principle: **one `Account` table for login**, with a `role` that points to
either a `Customer` or a `Vendor` profile. This keeps auth in one place (fixing the
"auth logic copy-pasted in 16 files" problem the review found) and lets one human be
both if ever needed.

---

## 4. Schema - table by table

Types shown generically. `id` is a UUID (or bigint) primary key on every table.
`created_at` / `updated_at` timestamps assumed on every table.

### 4.1 Identity and accounts

**`account`** - one row per login (customer or vendor).
| Column | Type | Notes |
|---|---|---|
| email | string, unique | login identifier |
| mobile | string, unique, nullable | for OTP |
| role | enum: `customer` \| `vendor` \| `admin` | drives which profile is attached |
| status | enum: `active` \| `suspended` | |
| email_verified_at | timestamp, nullable | magic-link / OTP confirmation |
| last_login_at | timestamp, nullable | |

> Login is **passwordless**: email magic link (customers) or mobile OTP (vendors, who
> may prefer WhatsApp/SMS). No password column - removes the brute-force and
> credential-stuffing risk the review flagged. OTP, if used, must be 6-digit, hashed,
> attempt-limited (the hardened model already exists in the Django code, unused).

**`session`** - server-side sessions (httpOnly cookie), not JWT-in-localStorage.
| Column | Type | Notes |
|---|---|---|
| account_id | FK → account | |
| token_hash | string | never store the raw token |
| expires_at | timestamp | |

### 4.2 Customer side (service takers)

**`customer`** - demand-side profile.
| Column | Type | Notes |
|---|---|---|
| account_id | FK → account, unique | |
| full_name | string | |
| home_city | string | departure city |
| default_protocol | enum: `jain` \| `vegetarian` \| `vegan` | |
| preferred_language | FK → language | |

**`trip_request`** - a trip being planned (replaces today's `JourneyPreferences`).
| Column | Type | Notes |
|---|---|---|
| customer_id | FK → customer, nullable | nullable = anonymous/lead-stage plan |
| status | enum: `draft` \| `submitted` \| `quoted` \| `confirmed` \| `completed` \| `cancelled` | |
| protocol | enum protocol | **hard filter for matching** |
| tier | enum: `economical` \| `comfort` \| `premium` | |
| group_size | int | |
| crew_type | enum: `family` \| `friends` \| `corporate` \| `celebration` | |
| from_date / to_date | date | |
| departure_airport | string | |
| interests | string[] (or M2M → interest) | |
| kitchen_required | bool | private kitchen access |
| cook_required | bool | valid only when group_size ≥ 10 (enforce server-side) |

**`itinerary`** - the day-by-day plan for a trip request.
| Column | Type | Notes |
|---|---|---|
| trip_request_id | FK, unique | one live itinerary per request |
| source | enum: `ai` \| `curated` \| `hybrid` | |
| compliance_checked | bool | **must be true before it is shown as "compliant"** |
| days | jsonb | array of day objects (validated against a schema, see §7) |

### 4.3 Vendor side (service providers)

**`vendor`** - supply-side business profile.
| Column | Type | Notes |
|---|---|---|
| account_id | FK → account, unique | |
| business_name | string | |
| vendor_type | FK → vendor_type | hotel/villa, transport, guide, cook, restaurant, activity |
| areas | M2M → area | Ubud, Seminyak, Nusa Dua, Canggu, … |
| languages | M2M → language | guide/staff languages |
| whatsapp | string | primary contact |
| verification_status | enum: `pending` \| `in_review` \| `verified` \| `rejected` | gate to going live |
| verified_at | timestamp, nullable | |

**`service_listing`** - a specific sellable offering (a vendor has many).
| Column | Type | Notes |
|---|---|---|
| vendor_id | FK → vendor | |
| service_type | FK → service_type | stay / transport / guide / cook / meal / activity |
| title | string | |
| area | FK → area | |
| capacity_min / capacity_max | int | group-size fit |
| tier | enum tier | economical/comfort/premium |
| price_amount | int (minor units) | store in paise/cents, never float - review found a float-price bug |
| price_unit | enum: `per_person` \| `per_day` \| `per_group` \| `per_night` | removes the per-day-vs-total ambiguity the review flagged |
| currency | enum: `INR` \| `USD` | |
| active | bool | |

**`listing_compliance`** - the moat. What a listing can *guarantee*.
| Column | Type | Notes |
|---|---|---|
| service_listing_id | FK | |
| protocol | enum: `jain` \| `vegetarian` \| `vegan` | one row per protocol supported |
| guarantee_level | enum: `certified` \| `capable` \| `on_request` | |
| evidence_url | string, nullable | photo of kitchen / menu, checked at verification |
| verified_by | FK → account (admin), nullable | **compliance is verified, never self-attested** |

**`availability`** - simple calendar per listing.
| Column | Type | Notes |
|---|---|---|
| service_listing_id | FK | |
| date | date | |
| status | enum: `open` \| `held` \| `booked` | |

### 4.4 Marketplace glue

**`lead`** - pre-account capture (fixes "every lead goes nowhere").
| account_id nullable, source (`whatsapp`\|`web`\|`planner`), trip_request_id nullable, contact, message, status (`new`\|`contacted`\|`converted`) |

**`quote`** - a priced proposal from a trip request to a customer.
| trip_request_id FK, total_amount (minor units), currency, valid_until, status (`sent`\|`accepted`\|`expired`), line_items jsonb (listing_id + price snapshot) |

**`booking`** - a confirmed trip.
| Column | Type | Notes |
|---|---|---|
| trip_request_id | FK, unique | |
| customer_id | FK | |
| total_amount | int (minor units) | **server-recomputed from listings, never trusted from client** (review found a client-controlled-price bug) |
| deposit_amount | int | |
| payment_status | enum: `unpaid` \| `deposit_paid` \| `paid` \| `refunded` | |
| selected_listings | M2M → service_listing | who is actually supplying |

**`review`** - customer rating of a vendor after a completed booking.
| booking_id FK, vendor_id FK, rating 1-5, comment, published bool |

**Lookup tables** (small, seeded): `protocol`, `tier`, `area`, `language`, `interest`,
`service_type`, `vendor_type`. These replace today's scattered choice tables and the
hardcoded `lib/catalog.ts` constants.

---

## 5. How service providers (vendors) get enlisted

The supply side. Goal: get verified-compliant listings live with as little friction as
possible, but never skip compliance verification.

**Flow (states in `vendor.verification_status`):**

1. **Land** - vendor visits `/vendors` → "List your services on Only2Bali".
2. **Sign up** - enters business email or mobile → passwordless verify (magic link / OTP)
   → `account(role=vendor)` + `vendor(status=pending)` created.
3. **Onboarding wizard** (multi-step, saveable draft):
   - Business basics - name, type, areas served, languages, WhatsApp.
   - Add listing(s) - service type, title, area, capacity, tier, price + price unit.
   - **Dietary capability** - for each listing, which protocols it can guarantee and at
     what level (`certified` / `capable` / `on_request`), with **evidence upload**
     (kitchen photo, menu, certificate). This is the step that matters.
   - Photos and availability.
4. **Submit for review** → `status = in_review`. Nothing is public yet.
5. **Admin verification** - an Only2Bali admin checks the evidence, especially dietary
   claims, and marks each `listing_compliance` row `verified_by = admin`. Vendor moves to
   `verified` (or `rejected` with a reason).
6. **Live** - verified listings enter the matching pool and can receive leads/quotes.
7. **Ongoing** - vendor manages availability, responds to quote requests, accrues reviews.

**Why verification is a human step, not self-service:** the entire brand promise is
"guaranteed compliant." A self-attested checkbox destroys that. The verification queue is
a small admin screen; at low volume you (or a trusted reviewer) do it manually.

---

## 6. How service takers (customers) get enlisted

The demand side. Goal: let people plan instantly (no signup wall), then convert them into
saved accounts and leads that actually reach you.

**Flow (states in `trip_request.status`):**

1. **Land** - customer visits `/` → browse packages or "Plan my trip".
2. **Plan anonymously** - the planner wizard runs with no login. A `trip_request` is
   created with `customer_id = null`. The AI + deterministic engine (§7) produce a
   compliance-checked itinerary. This removes the signup wall entirely.
3. **Capture** - to save, share, or get a quote, the customer enters email/mobile:
   - A `lead` row is written immediately (so **you never lose the lead**, even if they
     drop off), synced to CRM.
   - Passwordless verify → `account(role=customer)` + `customer` created, and the
     anonymous `trip_request` is claimed (its `customer_id` is set).
4. **Save & share** - itinerary saved to account, shareable link + PDF export.
5. **Request quote** - `trip_request.status = submitted`; system matches to verified
   listings and produces a `quote`.
6. **Confirm & pay deposit** - customer accepts the quote → `booking` created,
   server-recomputed price, deposit via payment provider → `status = confirmed`.
7. **Travel & review** - after the trip, `status = completed`, customer can leave a review.

**Key difference from today:** planning needs no account, but every serious intent
(save / quote / book) writes a durable `lead` and, when they verify, a real account -
instead of firing a WhatsApp/mailto link into a placeholder.

---

## 7. The matching and compliance engine (the moat)

This is where the dead `lib/recommend.ts` logic gets wired in for real.

1. **Hard filter** - a `trip_request.protocol` only ever matches `service_listing`s that
   have a **verified** `listing_compliance` row for that protocol. Non-compliant options
   are never shown. (Today this filter exists in code but is disconnected.)
2. **Score** - among compliant listings: +tier match, +interest overlap, +kitchen,
   +language, +cook-for-groups. This is the existing, tested scoring - just applied to DB
   rows instead of a hardcoded array.
3. **AI itinerary, then validate** - Gemini drafts the day-by-day plan, but the response
   is **validated against a schema** (day/date/meals/activities shape) and each meal is
   checked against the protocol before `itinerary.compliance_checked` is set true. If it
   fails, fall back to a curated plan. (Review found the AI output is currently rendered
   unchecked, which can both break the page and violate the diet promise.)
4. **Guardrails on the AI route** - rate limiting, input validation (schema + length
   caps), and a request timeout, so the public planner cannot be abused into a large
   Google bill or prompt-injected.

---

## 8. Booking, pricing, and payments

- **Pricing is server-authoritative.** `booking.total_amount` is recomputed from the
  selected listings' prices at booking time. The client never sends a price. All money is
  stored in minor units (paise/cents) as integers, never floats.
- **Deposit model** - take a deposit to confirm, balance later. Amounts and rules are a
  business decision.
- **[DECIDE] Payment provider** - Razorpay (India-native, INR, UPI) is the natural fit for
  an Indian customer base; Stripe if you want global. Note: I will wire up the integration
  and the server-side flow, but per safety rules I will not enter or handle live payment
  credentials - you set those in the provider dashboard and in Vercel env vars.
- **[DECIDE] Commission model** - marketplace take-rate on bookings, a listing/lead fee for
  vendors, or a flat markup baked into the quote. This determines revenue and some schema
  (e.g. a `commission_rate` on vendor or listing).

---

## 9. Who benefits, and how

**Customers (service takers)**
- Only ever see options that are verified-compliant with their diet - the anxiety is gone.
- Plan in minutes with no signup wall; save and share with the family/group who decide.
- Transparent, itemised pricing; one place to plan and book instead of DM chaos.

**Vendors (service providers)**
- Qualified, high-intent leads from a niche they cannot easily reach themselves.
- A "verified" badge that builds trust and lets them charge for a premium guarantee.
- No upfront cost to list; they pay only when they win business (depending on §8 model).

**The business (Only2Bali)**
- A defensible moat: **verified dietary compliance** is operationally hard to copy, unlike
  a catalogue or an AI wrapper.
- Marketplace revenue (commission / fees) instead of one-off lead handoffs.
- A data flywheel: every trip request sharpens matching and reveals demand by protocol,
  city, season - which guides which vendors to recruit next.
- Far less manual coordination than the current questionnaire-to-Zoho-to-WhatsApp flow.

---

## 10. How this plan fixes the review findings

| Review finding | How the plan resolves it |
|---|---|
| Delete-any-trip (no auth) | One auth layer + every query scoped to the owner; server sessions, not JWT-in-localStorage |
| Brute-forceable 4-digit OTP, no rate limit | Passwordless magic link / 6-digit hashed attempt-limited OTP; rate limits on all auth + AI routes |
| Hardcoded Zoho / SMS secrets | All secrets in env vars from day one; **still must be rotated at the provider now** |
| "100% Jain/veg" not enforced | Hard compliance filter + AI-output validation before anything is labelled compliant |
| Every lead goes nowhere | `lead` row written server-side on every intent; CRM sync; real contact config |
| Client-controlled booking price | Server recomputes price from listings; money as integers |
| Data-model 500s (PlacesToVisit etc.) | Clean, normalised schema with correct cardinalities |
| FastAPI dead/broken | Deleted; its ideas folded into this one backend |
| Two frontends | Consolidate on Next.js; retire React once accounts land here |

Tier-1 security items are **not** deferred to this plan - see §12; they should be fixed
immediately, independent of the marketplace build.

---

## 11. Phased delivery

Each phase ships something usable; nothing is a big-bang.

- **Phase 0 - Stop the bleeding (days, do now).** Rotate Zoho + SMS credentials; add auth
  to the delete endpoint; fix placeholder WhatsApp/email; add rate limiting + validation to
  the AI planner route. Independent of everything below.
- **Phase 1 - Foundations.** Backend decision (§2); set up Postgres + one auth layer
  (passwordless); seed lookup tables; migrate `lib/catalog.ts` into the DB.
- **Phase 2 - Demand side.** Anonymous planner → compliance-checked itinerary → lead
  capture → accounts-lite → save/share/PDF. This alone fixes lead loss and the diet promise.
- **Phase 3 - Supply side.** Vendor signup, onboarding wizard, admin verification queue,
  listings go live and enter matching.
- **Phase 4 - Transact.** Quotes → booking → deposit/payment → reviews.
- **Phase 5 - Retire legacy.** Move remaining customers off Django; delete FastAPI; sunset
  the React app.

---

## 12. Decisions

**Answered (2026-07-16):**
1. ✅ **Backend direction** - Next.js full-stack, delivered the bridge way (§2).
2. ✅ **Scope of v1** - curated matcher first; Only2Bali enlists/verifies vendors, the
   platform matches customers to them. Vendor self-onboarding (§5) is a later phase.
4. ✅ **Accounts on Next.js** - yes; customer accounts-lite are built here (unblocks
   retiring React).

**Still open (do not block Phases 0-2):**
3. **[DECIDE] Payments** - Razorpay vs Stripe, deposit rules, and the **commission model**
   (§8). Needed before Phase 4 (transact), not before.

Phase 0 (security) starts now, independent of everything. Phase 1 (foundations) can start
immediately given the decisions above.
