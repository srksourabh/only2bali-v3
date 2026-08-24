/**
 * Demo data for the marketplace half of the product.
 *
 * `seed.ts` fills the catalogue — circuits, packages, departures. That is enough
 * to browse, and not enough to see whether the thing works: no providers, no
 * enquiries, no bookings, no money. This fills the rest so the product can be
 * demonstrated end to end and so the payment work has real rows to attach to.
 *
 * Everything here is fake and says so. Accounts use @demo.only2bali.com,
 * vendor slugs are prefixed `demo-`, and booking references start `O2B-DEMO-`.
 * That prefix is not decoration — it is what `wipeDemo()` matches, so this file
 * can never delete a real provider or a real booking.
 */
import { and, eq, like, inArray, asc } from "drizzle-orm";
import { db } from "./index";
import {
  account, traveller, vendor, vendorHighlight, vendorDocument, serviceListing,
  listingCircuit, listingCompliance, availability, vendorApplication,
  tripRequest, lead, offer, booking, bookingTraveller, bookingListing, review,
  departure, pkg, circuit,
} from "./schema";

const inr = (rupees: number) => rupees * 100;
const DEMO_EMAIL = "%@demo.only2bali.com";
const DEMO_REF = "O2B-DEMO-%";

/** Days from now, as a YYYY-MM-DD date string. */
const day = (offset: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
const at = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000);

interface DemoVendor {
  slug: string;
  businessName: string;
  legalName: string;
  vendorType: "restaurant" | "accommodation" | "transport" | "guide" | "cook" | "tour_agency";
  baseArea: string;
  description: string;
  languages: string[];
  commissionRate: string;
  ratingAvg: string;
  ratingCount: number;
  responseTimeMinutes: number;
  highlights: string[];
  listings: Array<{
    title: string;
    serviceType: DemoVendor["vendorType"];
    description: string;
    area: string;
    capacityMin: number;
    capacityMax: number;
    tier: "economical" | "comfort" | "premium";
    priceRupees: number;
    priceUnit: "per_person" | "per_day" | "per_group" | "per_night" | "per_trip";
    images: string[];
    circuits: Array<"ramayana" | "adventure" | "culinary" | "artistic">;
    compliance: Array<{
      protocol: "jain" | "vegetarian" | "vegan";
      guaranteeLevel: "certified" | "capable" | "on_request" | "not_supported";
      rating: "green" | "amber" | "red";
      kitchenType?: "dedicated_veg" | "separate_line" | "shared";
      evidenceNotes: string;
    }>;
  }>;
}

const VENDORS: DemoVendor[] = [
  {
    slug: "demo-sattvik-by-nature",
    businessName: "Sattvik By Nature",
    legalName: "PT Sattvik Nusantara",
    vendorType: "restaurant",
    baseArea: "Ubud",
    description:
      "Pure vegetarian kitchen in central Ubud. No onion or garlic on request, separate Jain preparation line, and a cook who has run Jain menus for Indian groups since 2019.",
    languages: ["English", "Hindi", "Gujarati", "Indonesian"],
    commissionRate: "0.1200",
    ratingAvg: "4.80",
    ratingCount: 64,
    responseTimeMinutes: 25,
    highlights: [
      "100% vegetarian kitchen — no meat has ever been prepared on the premises",
      "Jain menu without onion, garlic or root vegetables, cooked on a separate line",
      "Kitchen inspected by Only2Bali in person, not self-declared",
    ],
    listings: [
      {
        title: "Jain thali, group sitting",
        serviceType: "restaurant",
        description: "Fixed Jain thali for groups of eight and above. No root vegetables. Separate prep line, separate utensils.",
        area: "Ubud",
        capacityMin: 8,
        capacityMax: 40,
        tier: "comfort",
        priceRupees: 1400,
        priceUnit: "per_person",
        images: ["/Asset/culinary.png", "/Asset/D-card-img2.png"],
        circuits: ["culinary", "ramayana"],
        compliance: [
          { protocol: "jain", guaranteeLevel: "certified", rating: "green", kitchenType: "dedicated_veg",
            evidenceNotes: "Site visit 2026-05. Separate Jain line, no root vegetables stocked." },
          { protocol: "vegetarian", guaranteeLevel: "certified", rating: "green", kitchenType: "dedicated_veg",
            evidenceNotes: "Fully vegetarian premises." },
          { protocol: "vegan", guaranteeLevel: "capable", rating: "amber", kitchenType: "dedicated_veg",
            evidenceNotes: "Ghee used by default; vegan on 24 hours notice." },
        ],
      },
      {
        title: "Cooking class — Balinese vegetarian",
        serviceType: "restaurant",
        description: "Three-hour class, market walk included. Whole menu is vegetarian; Jain variant available.",
        area: "Ubud",
        capacityMin: 2,
        capacityMax: 16,
        tier: "comfort",
        priceRupees: 3200,
        priceUnit: "per_person",
        images: ["/Asset/food-class.png"],
        circuits: ["culinary"],
        compliance: [
          { protocol: "vegetarian", guaranteeLevel: "certified", rating: "green", kitchenType: "dedicated_veg",
            evidenceNotes: "Fully vegetarian premises." },
          { protocol: "jain", guaranteeLevel: "capable", rating: "amber", kitchenType: "dedicated_veg",
            evidenceNotes: "Jain variant on request, 24 hours notice." },
        ],
      },
    ],
  },
  {
    slug: "demo-taru-villas-ubud",
    businessName: "Taru Villas Ubud",
    legalName: "PT Taru Hospitality",
    vendorType: "accommodation",
    baseArea: "Ubud",
    description:
      "Six private villas above the Petanu valley. Each villa has its own kitchen, which is what makes a Jain protocol workable for a whole week rather than a single meal.",
    languages: ["English", "Indonesian", "Hindi"],
    commissionRate: "0.1500",
    ratingAvg: "4.60",
    ratingCount: 41,
    responseTimeMinutes: 90,
    highlights: [
      "Private kitchen in every villa — your own cook can work in it",
      "Kitchen deep-cleaned and photographed before each Jain group arrives",
      "Walking distance to two verified vegetarian restaurants",
    ],
    listings: [
      {
        title: "Three-bedroom private villa with kitchen",
        serviceType: "accommodation",
        description: "Sleeps six. Full kitchen, gas hob, dedicated utensils set kept sealed for veg-protocol groups.",
        area: "Ubud",
        capacityMin: 2,
        capacityMax: 6,
        tier: "premium",
        priceRupees: 18500,
        priceUnit: "per_night",
        images: ["/Asset/villa-stay.png", "/Asset/cultures.png"],
        circuits: ["ramayana", "artistic"],
        compliance: [
          { protocol: "jain", guaranteeLevel: "capable", rating: "green", kitchenType: "dedicated_veg",
            evidenceNotes: "Sealed utensil set, gas hob, no shared equipment. Photographed 2026-06." },
          { protocol: "vegetarian", guaranteeLevel: "capable", rating: "green", kitchenType: "dedicated_veg",
            evidenceNotes: "Same kitchen, same sealed set." },
          { protocol: "vegan", guaranteeLevel: "capable", rating: "green", kitchenType: "dedicated_veg",
            evidenceNotes: "Self-catered, so entirely under the group's control." },
        ],
      },
    ],
  },
  {
    slug: "demo-bali-veg-transport",
    businessName: "Wayan Group Transport",
    legalName: "CV Wayan Trans Bali",
    vendorType: "transport",
    baseArea: "Denpasar",
    description:
      "Fleet of eight vehicles with Hindi and Gujarati-speaking drivers. Routes planned around verified restaurants rather than around distance.",
    languages: ["English", "Hindi", "Gujarati", "Indonesian"],
    commissionRate: "0.1000",
    ratingAvg: "4.70",
    ratingCount: 112,
    responseTimeMinutes: 15,
    highlights: [
      "Drivers speak Hindi or Gujarati, not only English",
      "Meal stops routed through verified kitchens, never the nearest warung",
      "All vehicles under four years old, seat belts in every row",
    ],
    listings: [
      {
        title: "16-seater with driver, full day",
        serviceType: "transport",
        description: "Twelve hours, fuel and parking included. Driver briefed on the group's protocol before the first pickup.",
        area: "Island-wide",
        capacityMin: 6,
        capacityMax: 16,
        tier: "comfort",
        priceRupees: 6800,
        priceUnit: "per_day",
        images: ["/Asset/beaches.png"],
        circuits: ["ramayana", "adventure", "culinary", "artistic"],
        compliance: [
          { protocol: "vegetarian", guaranteeLevel: "capable", rating: "green",
            evidenceNotes: "No food served; meal stops are chosen from the verified list." },
          { protocol: "jain", guaranteeLevel: "capable", rating: "green",
            evidenceNotes: "No food served; meal stops are chosen from the verified list." },
          { protocol: "vegan", guaranteeLevel: "capable", rating: "green",
            evidenceNotes: "No food served; meal stops are chosen from the verified list." },
        ],
      },
    ],
  },
  {
    slug: "demo-jain-cook-collective",
    businessName: "Jain Cook Collective",
    legalName: "PT Rasoi Bali",
    vendorType: "cook",
    baseArea: "Ubud",
    description:
      "Cooks who travel with the group and work in the villa kitchen. This is the option groups take when no restaurant can be trusted for seven straight days.",
    languages: ["Hindi", "Gujarati", "Marwari", "English"],
    commissionRate: "0.1800",
    ratingAvg: "4.90",
    ratingCount: 28,
    responseTimeMinutes: 45,
    highlights: [
      "Cook travels with the group for the whole trip, not per meal",
      "Brings their own spice kit from India — no local substitution",
      "Every cook has run at least five Jain group trips",
    ],
    listings: [
      {
        title: "Accompanying Jain cook, per trip",
        serviceType: "cook",
        description: "One cook for the full itinerary. Cooks three meals a day in the group's own kitchen. Minimum ten travellers.",
        area: "Island-wide",
        capacityMin: 10,
        capacityMax: 30,
        tier: "premium",
        priceRupees: 62000,
        priceUnit: "per_trip",
        images: ["/Asset/food-kitchen.png"],
        circuits: ["ramayana", "culinary"],
        compliance: [
          { protocol: "jain", guaranteeLevel: "certified", rating: "green", kitchenType: "dedicated_veg",
            evidenceNotes: "Cook prepares everything; no external kitchen involved." },
          { protocol: "vegetarian", guaranteeLevel: "certified", rating: "green", kitchenType: "dedicated_veg",
            evidenceNotes: "Cook prepares everything." },
        ],
      },
    ],
  },
];

const TRAVELLERS = [
  { email: "meera.shah@demo.only2bali.com", mobile: "+919820000101", fullName: "Meera Shah",
    homeCity: "Mumbai", defaultProtocol: "jain", preferredLanguage: "gu" },
  { email: "rohit.agarwal@demo.only2bali.com", mobile: "+919820000102", fullName: "Rohit Agarwal",
    homeCity: "Delhi", defaultProtocol: "vegetarian", preferredLanguage: "hi" },
  { email: "anita.rao@demo.only2bali.com", mobile: "+919820000103", fullName: "Anita Rao",
    homeCity: "Bengaluru", defaultProtocol: "vegan", preferredLanguage: "en" },
];

/**
 * Remove only what this file created, in foreign-key order.
 *
 * Matching is on the demo markers, never on "everything in the table". Running
 * the seed against a database with real providers in it must not touch them.
 */
async function wipeDemo() {
  const demoAccounts = await db
    .select({ id: account.id })
    .from(account)
    .where(like(account.email, DEMO_EMAIL));
  const accountIds = demoAccounts.map((a) => a.id);

  // booking first: it references trip_request with onDelete restrict.
  await db.delete(booking).where(like(booking.reference, DEMO_REF));
  await db.delete(vendorApplication).where(like(vendorApplication.businessName, "Demo %"));
  if (accountIds.length > 0) {
    await db.delete(lead).where(inArray(lead.accountId, accountIds));
    // vendor and traveller cascade from account; trip_request cascades from
    // traveller; offer, listing and compliance cascade from vendor.
    await db.delete(account).where(inArray(account.id, accountIds));
  }
}

export async function seedMarketplace() {
  console.log("seeding marketplace demo data…");
  await wipeDemo();

  const circuitIds = new Map(
    (await db.select({ id: circuit.id, key: circuit.key }).from(circuit)).map((c) => [c.key, c.id])
  );

  // ---------------------------------------------------------------- vendors --
  const vendorIds = new Map<string, string>();
  const listingIds: string[] = [];

  for (const v of VENDORS) {
    const [acct] = await db
      .insert(account)
      .values({
        email: `${v.slug}@demo.only2bali.com`,
        mobile: `+6281${String(300000000 + vendorIds.size).slice(0, 9)}`,
        role: "vendor",
        status: "active",
        emailVerifiedAt: at(-120),
        mobileVerifiedAt: at(-120),
        lastLoginAt: at(-2),
      })
      .returning({ id: account.id });

    const [row] = await db
      .insert(vendor)
      .values({
        accountId: acct.id,
        slug: v.slug,
        businessName: v.businessName,
        legalName: v.legalName,
        vendorType: v.vendorType,
        baseArea: v.baseArea,
        description: v.description,
        logo: "/Asset/logo.png",
        coverImage: v.listings[0]?.images[0] ?? "/Asset/D-card-img2.png",
        whatsapp: "+6281900000000",
        email: `${v.slug}@demo.only2bali.com`,
        languages: v.languages,
        verificationStatus: "verified",
        verifiedAt: at(-100),
        commissionRate: v.commissionRate,
        ratingAvg: v.ratingAvg,
        ratingCount: v.ratingCount,
        responseTimeMinutes: v.responseTimeMinutes,
        onboardingStep: 5,
      })
      .returning({ id: vendor.id });
    vendorIds.set(v.slug, row.id);

    await db.insert(vendorHighlight).values(
      v.highlights.map((text, i) => ({ vendorId: row.id, text, sortOrder: i, approved: true }))
    );
    await db.insert(vendorDocument).values([
      { vendorId: row.id, kind: "business_licence" as const, fileUrl: "/demo/licence.pdf", status: "approved", reviewedAt: at(-100) },
      { vendorId: row.id, kind: "kitchen_certificate" as const, fileUrl: "/demo/kitchen.pdf", status: "approved", reviewedAt: at(-100) },
    ]);

    for (const l of v.listings) {
      const [listing] = await db
        .insert(serviceListing)
        .values({
          vendorId: row.id,
          title: l.title,
          serviceType: l.serviceType,
          description: l.description,
          area: l.area,
          capacityMin: l.capacityMin,
          capacityMax: l.capacityMax,
          tier: l.tier,
          priceAmount: inr(l.priceRupees),
          priceUnit: l.priceUnit,
          images: l.images,
          status: "active",
          active: true,
        })
        .returning({ id: serviceListing.id });
      listingIds.push(listing.id);

      await db.insert(listingCircuit).values(
        l.circuits
          .filter((k) => circuitIds.has(k))
          .map((k) => ({ listingId: listing.id, circuitId: circuitIds.get(k)! }))
      );
      await db.insert(listingCompliance).values(
        l.compliance.map((c) => ({
          listingId: listing.id,
          protocol: c.protocol,
          guaranteeLevel: c.guaranteeLevel,
          rating: c.rating,
          kitchenType: c.kitchenType,
          evidenceNotes: c.evidenceNotes,
          verifiedAt: at(-60),
          // Ratings expire. A lapsed row drops the listing out of matching,
          // which is the point — a year-old kitchen inspection is not evidence.
          expiresAt: at(305),
        }))
      );
      // Sixty days of open availability, with one blocked week to prove the
      // calendar renders more than a wall of green.
      await db.insert(availability).values(
        Array.from({ length: 60 }, (_, i) => ({
          listingId: listing.id,
          date: day(i + 1),
          status: i >= 20 && i < 27 ? ("blocked" as const) : ("open" as const),
        }))
      );
    }
  }
  console.log(`  vendors: ${vendorIds.size}, listings: ${listingIds.length}`);

  // ------------------------------------------------------------- travellers --
  const travellerIds = new Map<string, string>();
  const accountIds = new Map<string, string>();
  for (const t of TRAVELLERS) {
    const [acct] = await db
      .insert(account)
      .values({
        email: t.email,
        mobile: t.mobile,
        role: "traveller",
        status: "active",
        emailVerifiedAt: at(-40),
        mobileVerifiedAt: at(-40),
        lastLoginAt: at(-1),
      })
      .returning({ id: account.id });
    accountIds.set(t.email, acct.id);

    const [row] = await db
      .insert(traveller)
      .values({
        accountId: acct.id,
        fullName: t.fullName,
        homeCity: t.homeCity,
        defaultProtocol: t.defaultProtocol,
        preferredLanguage: t.preferredLanguage,
        whatsappOptin: true,
      })
      .returning({ id: traveller.id });
    travellerIds.set(t.email, row.id);
  }
  console.log(`  travellers: ${travellerIds.size}`);

  // ----------------------------------------------------------- trip requests --
  //
  // Three states on purpose: a private draft, one published to the provider
  // board, and one already booked. `cook_required` is only set on the group of
  // twelve — the database refuses it below ten, and demo data that violates a
  // check constraint is demo data that hides a bug.
  const [tripPrivate] = await db
    .insert(tripRequest)
    .values({
      travellerId: travellerIds.get("anita.rao@demo.only2bali.com")!,
      circuitId: circuitIds.get("adventure"),
      status: "draft",
      protocol: "vegan",
      tier: "economical",
      groupSize: 4,
      rooms: 2,
      fromDate: day(75),
      toDate: day(81),
      nights: 6,
      departureCity: "Bengaluru",
      interests: ["trekking", "snorkelling"],
      preferredLanguage: "en",
      visibility: "private",
      budgetMinAmount: inr(45000),
      budgetMaxAmount: inr(70000),
      budgetBasis: "per_person",
      mobileVerified: true,
    })
    .returning({ id: tripRequest.id });

  const [tripPublished] = await db
    .insert(tripRequest)
    .values({
      travellerId: travellerIds.get("meera.shah@demo.only2bali.com")!,
      circuitId: circuitIds.get("ramayana"),
      status: "submitted",
      protocol: "jain",
      tier: "premium",
      groupSize: 12,
      crewType: "family",
      rooms: 6,
      fromDate: day(60),
      toDate: day(66),
      nights: 6,
      departureCity: "Mumbai",
      interests: ["temples", "wellness"],
      kitchenRequired: true,
      cookRequired: true,
      preferredLanguage: "gu",
      specialRequirements: "No onion or garlic. Two travellers aged over 70 — no long walks before breakfast.",
      requirementTags: ["jain-strict", "senior-friendly", "own-cook"],
      visibility: "open_to_verified",
      publishedAt: at(-6),
      bidsCloseAt: at(4),
      budgetMinAmount: inr(90000),
      budgetMaxAmount: inr(140000),
      budgetBasis: "per_person",
      mobileVerified: true,
    })
    .returning({ id: tripRequest.id });

  const [tripBooked] = await db
    .insert(tripRequest)
    .values({
      travellerId: travellerIds.get("rohit.agarwal@demo.only2bali.com")!,
      circuitId: circuitIds.get("culinary"),
      status: "booked",
      protocol: "vegetarian",
      tier: "comfort",
      groupSize: 6,
      rooms: 3,
      fromDate: day(30),
      toDate: day(35),
      nights: 5,
      departureCity: "Delhi",
      preferredLanguage: "hi",
      visibility: "private",
      budgetBasis: "per_person",
      mobileVerified: true,
    })
    .returning({ id: tripRequest.id });
  console.log("  trip requests: 3 (draft, on the board, booked)");

  // ------------------------------------------------------------------ offers --
  const packages = await db
    .select({ id: pkg.id, slug: pkg.slug, price: pkg.basePriceAmount })
    .from(pkg)
    .orderBy(asc(pkg.slug));
  const bySlug = new Map(packages.map((p) => [p.slug, p]));

  const sattvik = bySlug.get("sattvik-serenity");
  if (sattvik) {
    await db.insert(offer).values([
      {
        tripRequestId: tripPublished.id,
        vendorId: vendorIds.get("demo-taru-villas-ubud")!,
        packageId: sattvik.id,
        origin: "vendor_bid",
        title: "Six nights, two private villas with kitchens, Jain cook included",
        summary: "Two three-bedroom villas side by side. Cook from the Jain Cook Collective for all six days.",
        totalAmount: inr(1_284_000),
        vendorNetAmount: inr(1_091_400),
        commissionRate: "0.1500",
        pricePerPerson: inr(107_000),
        validUntil: at(10),
        status: "sent",
        rank: 1,
        score: 92,
        submittedAt: at(-4),
      },
      {
        tripRequestId: tripPublished.id,
        vendorId: vendorIds.get("demo-sattvik-by-nature")!,
        packageId: sattvik.id,
        origin: "vendor_bid",
        title: "Six nights with all meals at our Ubud kitchen",
        summary: "Hotel stay plus every meal cooked on our Jain line. No villa kitchen required.",
        totalAmount: inr(1_128_000),
        vendorNetAmount: inr(992_640),
        commissionRate: "0.1200",
        pricePerPerson: inr(94_000),
        validUntil: at(9),
        status: "viewed",
        rank: 2,
        score: 84,
        submittedAt: at(-3),
      },
      {
        tripRequestId: tripPublished.id,
        packageId: sattvik.id,
        origin: "system_match",
        title: "Sattvik Serenity — fixed departure",
        summary: "Matched from the catalogue. Departs within the requested window.",
        totalAmount: inr(1_416_000),
        commissionRate: "0.1500",
        pricePerPerson: inr(118_000),
        validUntil: at(14),
        status: "sent",
        rank: 3,
        score: 71,
        submittedAt: at(-6),
      },
    ]);
  }
  console.log("  offers: 3 on the published request");

  // ------------------------------------------------------------------- leads --
  await db.insert(lead).values([
    { accountId: accountIds.get("meera.shah@demo.only2bali.com") ?? null, tripRequestId: tripPublished.id,
      source: "planner", name: "Meera Shah", email: "meera.shah@demo.only2bali.com", mobile: "+919820000101",
      whatsappOptin: true, departureCity: "Mumbai", groupSize: 12, protocol: "jain", travelMonth: "October",
      message: "Family group, two seniors. Need a Jain kitchen for the whole week.", status: "quoted" },
    { accountId: accountIds.get("rohit.agarwal@demo.only2bali.com") ?? null, tripRequestId: tripBooked.id,
      source: "package_page", name: "Rohit Agarwal", email: "rohit.agarwal@demo.only2bali.com", mobile: "+919820000102",
      whatsappOptin: true, departureCity: "Delhi", groupSize: 6, protocol: "vegetarian", travelMonth: "September",
      message: "Interested in Bali Veg Explorer for six people.", status: "converted" },
    { source: "web", name: "Priyanka Desai", email: "priyanka.desai@demo.only2bali.com", mobile: "+919820000104",
      whatsappOptin: false, departureCity: "Ahmedabad", groupSize: 18, protocol: "jain", travelMonth: "December",
      message: "Temple trust group of eighteen. Strictly no root vegetables.", status: "new" },
    { source: "whatsapp", name: "Karthik Iyer", email: null, mobile: "+919820000105",
      whatsappOptin: true, departureCity: "Chennai", groupSize: 2, protocol: "vegetarian", travelMonth: "March",
      message: "Honeymoon, pure veg.", status: "contacted" },
    { source: "partner_referral", name: "Nisha Mehta", email: "nisha.mehta@demo.only2bali.com", mobile: "+919820000106",
      whatsappOptin: true, departureCity: "Pune", groupSize: 9, protocol: "vegan", travelMonth: "August",
      message: "Vegan yoga retreat group.", status: "lost" },
  ]);
  console.log("  leads: 5 across every status");

  // ---------------------------------------------------- provider applications --
  await db.insert(vendorApplication).values([
    { businessName: "Demo Green Leaf Warung", businessType: "Restaurant", baseArea: "Canggu",
      cuisine: "Indonesian vegetarian", capabilities: ["vegetarian", "vegan"], languages: ["English", "Indonesian"],
      priceBand: "₹600–1,200 per person", whatsapp: "+6281900000201", email: "greenleaf@demo.only2bali.com",
      availability: "Daily, 8am to 10pm", notes: "Separate fryer for vegan items.", status: "pending" },
    { businessName: "Demo Amrita Homestay", businessType: "Homestay", baseArea: "Sanur",
      cuisine: null, capabilities: ["accommodation", "kitchen access"], languages: ["English", "Hindi"],
      priceBand: "₹4,000–6,500 per night", whatsapp: "+6281900000202", email: "amrita@demo.only2bali.com",
      availability: "Year round except Nyepi", notes: "Four rooms, shared kitchen.", status: "in_review" },
    { businessName: "Demo Surya Tours", businessType: "Tour agency", baseArea: "Denpasar",
      cuisine: null, capabilities: ["transport", "guide", "activities"], languages: ["English", "Hindi", "Tamil"],
      priceBand: "Quote on request", whatsapp: "+6281900000203", email: "surya@demo.only2bali.com",
      availability: "Daily", notes: "Applied twice; first application withdrawn.", status: "rejected" },
  ]);
  console.log("  provider applications: 3");

  // ---------------------------------------------------------------- bookings --
  //
  // Amounts are stored as they were computed at the time, never recomputed on
  // read: a booking is a record of what was agreed, and a later price change
  // must not silently rewrite it.
  const explorer = bySlug.get("bali-veg-explorer");
  const soonest = explorer
    ? (
        await db
          .select({ id: departure.id, price: departure.priceAmount })
          .from(departure)
          .where(and(eq(departure.packageId, explorer.id), eq(departure.status, "open")))
          .orderBy(asc(departure.startDate))
          .limit(1)
      )[0]
    : undefined;

  if (explorer && soonest) {
    const pax = 6;
    const gross = soonest.price * pax;
    const rate = 0.15;
    const commission = Math.round(gross * rate);

    const [confirmed] = await db
      .insert(booking)
      .values({
        reference: "O2B-DEMO-0001",
        tripRequestId: tripBooked.id,
        travellerId: travellerIds.get("rohit.agarwal@demo.only2bali.com")!,
        packageId: explorer.id,
        departureId: soonest.id,
        vendorId: vendorIds.get("demo-bali-veg-transport")!,
        pax,
        rooms: 3,
        grossAmount: gross,
        commissionRate: rate.toFixed(4),
        commissionAmount: commission,
        netAmount: gross - commission,
        status: "confirmed",
        confirmedAt: at(-9),
      })
      .returning({ id: booking.id });

    await db.insert(bookingTraveller).values([
      { bookingId: confirmed.id, fullName: "Rohit Agarwal", age: 38, gender: "male", isLead: true,
        dietaryNotes: "Vegetarian, no egg." },
      { bookingId: confirmed.id, fullName: "Sneha Agarwal", age: 35, gender: "female",
        dietaryNotes: "Vegetarian, no egg." },
      { bookingId: confirmed.id, fullName: "Aarav Agarwal", age: 9, gender: "male",
        dietaryNotes: "Vegetarian. Nut allergy." },
      { bookingId: confirmed.id, fullName: "Sunita Agarwal", age: 64, gender: "female",
        dietaryNotes: "Jain on Tuesdays." },
      { bookingId: confirmed.id, fullName: "Vikram Agarwal", age: 67, gender: "male" },
      { bookingId: confirmed.id, fullName: "Priya Agarwal", age: 41, gender: "female" },
    ]);

    if (listingIds.length > 0) {
      await db.insert(bookingListing).values({
        bookingId: confirmed.id,
        listingId: listingIds[listingIds.length - 1],
        priceSnapshot: inr(6800),
      });
    }

    // The seats must actually leave inventory, or the demo shows a departure
    // that is full and still selling. `departure_seats_sane` enforces the rest.
    await db
      .update(departure)
      .set({ seatsBooked: pax, status: "filling" })
      .where(eq(departure.id, soonest.id));

    // A second booking, still awaiting payment. This is the row a payment
    // gateway will attach to first.
    await db.insert(booking).values({
      reference: "O2B-DEMO-0002",
      tripRequestId: tripPrivate.id,
      travellerId: travellerIds.get("anita.rao@demo.only2bali.com")!,
      packageId: explorer.id,
      pax: 4,
      rooms: 2,
      grossAmount: soonest.price * 4,
      commissionRate: "0.1500",
      commissionAmount: Math.round(soonest.price * 4 * 0.15),
      netAmount: soonest.price * 4 - Math.round(soonest.price * 4 * 0.15),
      status: "pending_payment",
    });

    // A completed trip, so there is something a review can hang off. Reviews are
    // booking-gated by design: no completed booking, no review.
    const [completed] = await db
      .insert(booking)
      .values({
        reference: "O2B-DEMO-0003",
        tripRequestId: tripBooked.id,
        travellerId: travellerIds.get("meera.shah@demo.only2bali.com")!,
        packageId: sattvik?.id ?? null,
        vendorId: vendorIds.get("demo-sattvik-by-nature")!,
        pax: 8,
        rooms: 4,
        grossAmount: inr(944_000),
        commissionRate: "0.1200",
        commissionAmount: inr(113_280),
        netAmount: inr(830_720),
        status: "completed",
        confirmedAt: at(-95),
      })
      .returning({ id: booking.id });

    await db.insert(review).values({
      bookingId: completed.id,
      direction: "traveller_to_vendor",
      vendorId: vendorIds.get("demo-sattvik-by-nature")!,
      packageId: sattvik?.id ?? null,
      rating: 5,
      foodComplianceKept: true,
      comment:
        "Every single meal was as promised. The kitchen showed us the separate Jain line on the first day without being asked. Two amber meals were flagged in advance and both were substituted.",
      published: true,
    });

    console.log("  bookings: 3 (confirmed, awaiting payment, completed) and 1 review");
  } else {
    console.log("  bookings: skipped — the catalogue seed has not run yet");
  }

  console.log("marketplace demo data complete");
}

// Executed directly by `npm run db:seed:demo`.
if (process.argv[1]?.includes("seed-marketplace")) {
  seedMarketplace()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
