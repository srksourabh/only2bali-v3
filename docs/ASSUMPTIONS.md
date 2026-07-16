# Only2Bali - assumptions & risk map

> Risk identification across 8 categories (Teresa Torres' 4 core product risks extended with
> Ethics, Go-to-Market, Strategy, Team) for the marketplace direction in `docs/PLATFORM-PLAN.md`
> and `docs/IDEAS.md`. Each assumption has a confidence rating and a cheap test. Generated
> 2026-07-16. Principle: assume ~3/4 of ideas won't perform as hoped; test the riskiest first.

Confidence = how sure we are the assumption holds today (High / Med / Low). The dangerous cells
are **Low confidence + high impact** - the "leap of faith" assumptions, listed at the end.

## 1. Value - will travellers value it and keep using it?
- **V1** Indian veg/Jain/vegan travellers will pay a **premium** for a managed, own-language,
  guide-led Bali trip over self-booking on MakeMyTrip/Thrillophilia. — *Conf: Med.* Test: price
  10-15 real quote requests at target margin and measure deposit conversion (concierge/Wizard-of-Oz).
- **V2** "Verified 100% veg" is a strong enough reason to choose an unknown brand over incumbents
  who already offer Jain/veg add-ons (Thomas Cook, Veena World). — *Conf: Low.* Test: 8-10 customer
  interviews - would this switch you, and why/why not?
- **V3** The four circuits (Ramayana/Adventure/Culinary/Artistic) match real demand vs a generic
  "Bali package." — *Conf: Med.* Test: fake-door landing page, measure click/enquiry share per circuit.
- **V4** AI-generated itineraries are trusted and add value vs a human-curated package. — *Conf:
  Med-Low.* Test: A/B the planner output vs a curated PDF; measure share/save/enquiry.

## 2. Usability - can people use it?
- **U1** Group organizers will use in-product collaboration/voting instead of defaulting to
  WhatsApp. — *Conf: Low.* Test: prototype a shareable itinerary + vote link with 5 real groups.
- **U2** Travellers (incl. older family members) can complete the multi-step planner + accounts-lite
  flow. — *Conf: Med.* Test: 5 moderated usability sessions; watch drop-off per step.
- **U3** Bali vendors (drivers, small restaurants) can/will use a self-serve dashboard. — *Conf:
  Low.* Test: try onboarding 3 real vendors manually; see where they stall. (Curated-v1 de-risks this.)

## 3. Viability - can we monetize, support, scale, comply?
- **B1** A 10-20% margin covers CAC + ops (verification, concierge) + payment/forex costs and is
  profitable. — *Conf: Med-Low.* Test: build a unit-economics model on 5 sample trips with real costs.
- **B2** The cross-border payout rail (RBI PA-CB licensed) is **affordable and operable at low
  volume**. — *Conf: Low.* Test: get a written quote + onboarding requirements from Razorpay/an AD bank.
- **B3** Manual kitchen/vendor verification scales affordably as the vendor pool grows. — *Conf:
  Med.* Test: time-and-cost one real verification visit; extrapolate.
- **B4** There is enough bookable demand in the niche to sustain a marketplace (not just a lifestyle
  business). — *Conf: Med-Low.* Test: search-volume + community-size sizing; enquiry rate from a campaign.

## 4. Feasibility - can we build it?
- **F1** A small team can ship a full-stack marketplace + payments + dashboards in a realistic
  timeframe. — *Conf: Med-Low.* Test: timebox Phase 2 foundations; re-estimate from actuals.
- **F2** AI itinerary output can be reliably validated for veg/Jain compliance **dish-by-dish**. —
  *Conf: Med.* Test: run 50 generated itineraries through a compliance classifier; measure false-pass rate.
- **F3** Real-time vendor availability is achievable without vendors living in the system. — *Conf:
  Low (full) / Med (lightweight hold).* Test: pilot a manual availability sheet with 3 vendors.

## 5. Ethics - should we do it, and can we honour it?
- **E1 (the big one)** We can **actually honour** the "100% veg/Jain verified" promise on every
  meal. Giving false assurance to a religiously-observant customer who then eats non-compliant food
  is a serious harm, not just a refund. — *Conf: Med.* Test: audit whether every meal on 3 real
  itineraries can be verified; if not, scope the guarantee honestly (e.g. traveling-cook tier).
- **E2** As merchant-of-record we can safeguard travellers' deposits (their money is at risk if a
  vendor fails or we have a cash-flow gap). — *Conf: Med.* Test: define fund-segregation + the
  hold-until-voucher rule before taking real money.
- **E3** We handle account PII and payment data lawfully (the review already found a live
  delete-any-trip IDOR and weak OTP). — *Conf: Low today.* Test: Phase 0 security fixes + a privacy pass.

## 6. Go-to-Market - can we reach and convince them?
- **G1 (biggest GTM risk)** A brand-new, unknown operator can win trust for a **high-ticket,
  trust-sensitive** group purchase. — *Conf: Low.* Test: run one real community campaign (a temple/
  samaj WhatsApp group) and measure enquiry→deposit.
- **G2** Community-leader referral produces actual groups. — *Conf: Med-Low.* Test: sign 2 community
  leaders on a referral deal; measure referred enquiries in 30 days.
- **G3** We can reach the diaspora niche affordably (community, temples, SEO, WhatsApp). — *Conf:
  Med.* Test: cost-per-qualified-enquiry from one paid + one organic channel.
- **G4** WhatsApp-first is a scalable acquisition + support channel, not just a demo. — *Conf: Med.*
  Test: run 20 real enquiries through a WhatsApp concierge; measure response load + conversion.

## 7. Strategy & Objectives - is this the right game?
- **S1** The verified-veg moat is **defensible** - a better-funded incumbent can't just copy it. —
  *Conf: Med-Low.* Reality: they can copy the claim; the barrier is ops rigor + community trust +
  the 3 whitespace plays (how-we-verify page, refund guarantee, per-meal rating). Test: watch whether
  a pilot's trust assets are replicable in <1 quarter.
- **S2** A two-sided marketplace is the right model vs a simpler managed tour operator. — *Conf:
  Med.* The curated-matcher v1 deliberately hedges this - validate demand before building supply self-serve.
- **S3** Bali-only is the right start vs multi-destination. — *Conf: Med-High.* Focus is a strength here.
- **S4** Post-pandemic India-outbound demand and the timing are favourable. — *Conf: Med-High.*

## 8. Team - do we have the people, tools, continuity?
- **T1** A small team can run the ops load (verification, vendor relations, WhatsApp concierge,
  payment reconciliation) **while** building. — *Conf: Low.* Test: run one real trip end-to-end
  manually and log the hours; that's your ops cost.
- **T2** Founder (Loganathan, domain) + technical partner (Sourabh) is the right complementary pair,
  both committed. — *Conf: Med.* Test: agree roles, equity/comp, and time commitment in writing.
- **T3** Continuity risk: production still runs on caloganathan's Vercel/Azure until migrated (per
  `docs/progress.md`) - a single-point dependency. — *Conf: Low (unresolved).* Test: complete Phase 1
  (own Vercel + repo takeover) to close it.

---

## Riskiest leap-of-faith assumptions (test these FIRST)

Ranked by Low-confidence × high-impact. If any of these is false, large parts of the plan don't work.

1. **G1 - Can an unknown brand earn trust for a high-ticket trust-sensitive purchase?** Everything
   downstream depends on it. Cheapest test: one real community-channel campaign to deposit.
2. **V1 + V2 - Will the niche pay a premium, and is "verified veg" the reason they switch?** Test with
   ~10 concierge-run real quotes and 8-10 interviews before building supply.
3. **B2 - Is the licensed cross-border payout rail affordable/operable at low volume?** A hard gate;
   get a written quote from a PA-CB provider before committing to the payment build.
4. **E1 - Can we honestly honour the veg guarantee every meal?** The moat and the ethics both rest
   here; audit real itineraries and scope the promise (traveling-cook tier where kitchens can't be verified).
5. **T1 - Can a small team carry the ops load while building?** Run one trip fully manually and count
   the hours before assuming software removes the work.

Recommended sequence: these are **discovery** tests (interviews, a landing page, a concierge/
Wizard-of-Oz trip, a payment-provider quote) - all runnable **before or alongside Phase 0-2**, and
far cheaper than discovering the answer after building. Only scale build once 1, 2, and 4 look green.
