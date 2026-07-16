# Only2Bali - product idea brainstorm

> Multi-perspective ideation (PM / Designer / Engineer) for the new platform, per the
> product-trio discovery method. Generated 2026-07-16 from the approved plan
> (`docs/PLATFORM-PLAN.md`). A parallel competitor-feature research pass is being folded
> into the plan separately; this doc is the first-principles ideation.

## Objective
Add functionality to the new Only2Bali platform to drive qualified leads → bookings,
strengthen the verified-vegetarian moat, and fit how Indian group travel is actually decided
(families/committees, WhatsApp-first, own-language, festival-timed).

## Ideation - three lenses (15)

**PM (business value):** Community Trust Engine · Group Organizer Toolkit + community-leader
referral · Fixed-date festival departures · Repeat-traveller loyalty + referral · Special-
occasion/MICE segment (milestone events, veg destination weddings).

**Designer (experience):** Circuit-first immersive explorer · Collaborative itinerary (vote +
comment) · "Meal confidence" UI (badge + restaurant + Jain detail) · Multi-language interface +
own-language guide preview · Pre-trip concierge checklist.

**Engineer (technical):** Dish-level veg/Jain classifier guardrail over AI output · Real-time
vendor availability + hold/book API · WhatsApp Business API (two-way) · Demand data flywheel ·
Itinerary → PDF + mobile voucher + offline pack.

## Top 5 (prioritized)

1. **WhatsApp Business API - two-way concierge & lead capture.** Quotes, confirmations, and
   pre/post-trip concierge over WhatsApp, not a dead deep link. *Why:* matches how the audience
   transacts; fixes lead loss; lifts conversion + retention. *Validate:* WhatsApp-preferred;
   human-in-loop scales; Business API approval fits.
2. **Community Trust Engine.** Per-vendor verified-veg badges + a public "how we verify" page +
   temple/samaj endorsements. *Why:* it is the moat (halal/kosher niches prove it). *Validate:*
   badge lifts confidence; endorsements obtainable; travellers trust the story.
3. **Group Organizer Toolkit + community-leader referral.** Tools to book for a large group +
   commissions for leaders who bring groups. *Why:* the organizer is the real buyer; low-CAC
   channel. *Validate:* organizers want roster/split tools; leaders refer for commission.
4. **Collaborative shareable itinerary (vote + comment).** The whole family/committee reviews and
   votes; WhatsApp share card. *Why:* committee approval is the decision bottleneck. *Validate:*
   groups engage; voting shortens decisions; no added confusion.
5. **Fixed-date festival departures.** Pooled dated departures around Diwali/holidays/Navratri
   alongside custom planning. *Why:* concentrates demand, simplifies vendor ops. *Validate:*
   demand clusters on dates; travellers trade fixed dates for price; vendors commit capacity.

## Notes
- Ideas 1-4 pair tightly with the plan's Phase 3 (traveller side) and Phase 5 (payments/booking);
  #5 is a packaging/ops idea layered on the same schema (dated `availability` + `package`).
- The competitor research pass will add externally-validated features (marketplace mechanics,
  AI-planner UX, dietary-niche trust patterns, payment/payout patterns) into `docs/PLATFORM-PLAN.md`.
