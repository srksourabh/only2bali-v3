/**
 * Sample marketplace data requested for provider/traveller demonstrations.
 *
 * This is deliberately separate from `seed-marketplace.ts`. It is narrow,
 * repeatable, and fenced by three markers:
 *   - accounts end with @sample.only2bali.com
 *   - vendor slugs start with sample-
 *   - booking references start with O2B-SAMPLE-
 */
import { and, asc, eq, inArray, like } from "drizzle-orm";
import { hashPassword } from "../auth/crypto";
import { db } from "./index";
import { seed as seedCatalogue } from "./seed";
import {
  account,
  availability,
  booking,
  bookingListing,
  bookingTraveller,
  circuit,
  departure,
  lead,
  listingCircuit,
  listingCompliance,
  message,
  messageThread,
  offer,
  payment,
  paymentDisbursement,
  pkg,
  review,
  serviceListing,
  traveller,
  tripRequest,
  vendor,
  vendorDocument,
  vendorEvent,
  vendorHighlight,
  vendorMedia,
  vendorPayoutAccount,
  vendorPromotion,
} from "./schema";

const SAMPLE_EMAIL = "%@sample.only2bali.com";
const SAMPLE_REF = "O2B-SAMPLE-%";
const SAMPLE_PASSWORD = "Sample@12345";

const inr = (rupees: number) => rupees * 100;
const at = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000);
const day = (offsetDays: number) => at(offsetDays).toISOString().slice(0, 10);

type Protocol = "jain" | "vegetarian" | "vegan";
type VendorType = "restaurant" | "transport" | "tour_agency";
type CircuitKey = "ramayana" | "adventure" | "culinary" | "artistic";

interface SampleListing {
  title: string;
  serviceType: VendorType;
  description: string;
  area: string;
  addressLine1: string;
  city: string;
  tier: "economical" | "comfort" | "premium";
  capacityMin: number;
  capacityMax: number;
  priceRupees: number;
  priceUnit: "per_person" | "per_day" | "per_group" | "per_trip";
  images: string[];
  circuits: CircuitKey[];
  inclusions: string[];
  exclusions: string[];
  serviceDetails: Record<string, unknown>;
  compliance: Array<{
    protocol: Protocol;
    guaranteeLevel: "certified" | "capable" | "on_request";
    rating: "green" | "amber";
    kitchenType?: "dedicated_veg" | "separate_line" | "shared";
    evidenceNotes: string;
  }>;
}

interface SampleProvider {
  slug: string;
  username: string;
  businessName: string;
  legalName: string;
  vendorType: VendorType;
  baseArea: string;
  city: string;
  addressLine1: string;
  description: string;
  languages: string[];
  commissionRate: string;
  ratingAvg: string;
  ratingCount: number;
  responseTimeMinutes: number;
  highlights: string[];
  listings: SampleListing[];
  media: Array<{ kind: "photo" | "menu" | "gallery" | "cover"; fileUrl: string; altText: string; caption: string }>;
  event: {
    title: string;
    description: string;
    area: string;
    priceRupees: number;
    displayCurrency: "IDR";
    capacity: number;
  };
  promotion: {
    title: string;
    description: string;
    offerCode: string;
    priceRupees: number;
    terms: string;
  };
  payout: {
    holder: string;
    bankName: string;
    bankCountry: "India" | "Indonesia";
    currency: "INR" | "IDR";
    maskedAccount: string;
    upiId?: string;
  };
}

const PROVIDERS: SampleProvider[] = [
  {
    slug: "sample-shuddh-bhojan-ubud",
    username: "sample-restaurant-provider",
    businessName: "Shuddh Bhojan Ubud",
    legalName: "PT Shuddh Bhojan Bali",
    vendorType: "restaurant",
    baseArea: "Ubud",
    city: "Gianyar",
    addressLine1: "Jl. Hanoman 42, Ubud",
    description:
      "Pure vegetarian restaurant for Jain, vegetarian and vegan travelers. Focused on clean kitchens, clear meal labels and group seating.",
    languages: ["English", "Hindi", "Gujarati", "Indonesian"],
    commissionRate: "0.1200",
    ratingAvg: "4.80",
    ratingCount: 74,
    responseTimeMinutes: 20,
    highlights: [
      "Strict Jain menu available without onion, garlic or root vegetables",
      "Separate Jain utensils and prep station",
      "Comfort, premium and group thali options in Indian rupees",
    ],
    listings: [
      {
        title: "Jain and vegetarian group thali",
        serviceType: "restaurant",
        description: "Reserved group seating with Jain, vegetarian and vegan options labeled before service.",
        area: "Ubud",
        addressLine1: "Jl. Hanoman 42",
        city: "Gianyar",
        tier: "comfort",
        capacityMin: 4,
        capacityMax: 55,
        priceRupees: 1450,
        priceUnit: "per_person",
        images: ["/Asset/culinary.png", "/Asset/D-card-img2.png"],
        circuits: ["culinary", "ramayana"],
        inclusions: ["Welcome drink", "Fixed thali", "Dessert", "Filtered water"],
        exclusions: ["Private transport", "Birthday cake", "Late-night service after 10 PM"],
        serviceDetails: {
          menuTypes: ["Jain", "vegetarian", "vegan"],
          seating: "Indoor group seating",
          advanceNoticeHours: 12,
        },
        compliance: [
          {
            protocol: "jain",
            guaranteeLevel: "certified",
            rating: "green",
            kitchenType: "separate_line",
            evidenceNotes: "Separate Jain prep line and utensils verified for sample data.",
          },
          {
            protocol: "vegetarian",
            guaranteeLevel: "certified",
            rating: "green",
            kitchenType: "dedicated_veg",
            evidenceNotes: "Vegetarian-only restaurant premises.",
          },
          {
            protocol: "vegan",
            guaranteeLevel: "capable",
            rating: "amber",
            kitchenType: "dedicated_veg",
            evidenceNotes: "Vegan available with advance notice because ghee is used by default.",
          },
        ],
      },
    ],
    media: [
      { kind: "cover", fileUrl: "/Asset/culinary.png", altText: "Vegetarian Bali meal", caption: "Jain and vegetarian thali setup" },
      { kind: "menu", fileUrl: "/demo/sample-shuddh-menu.pdf", altText: "Jain menu", caption: "Sample Jain group menu" },
      { kind: "gallery", fileUrl: "/Asset/D-card-img2.png", altText: "Group restaurant seating", caption: "Reserved group section" },
    ],
    event: {
      title: "Jain cooking demonstration evening",
      description: "A small event showing Jain-friendly Balinese flavors with no onion, garlic or root vegetables.",
      area: "Ubud",
      priceRupees: 1800,
      displayCurrency: "IDR",
      capacity: 24,
    },
    promotion: {
      title: "Group thali discount",
      description: "Reduced price for groups of 12 or more travelers booking through Only2Bali.",
      offerCode: "SHUDDH12",
      priceRupees: 1250,
      terms: "Valid for lunch bookings confirmed at least 48 hours in advance.",
    },
    payout: {
      holder: "PT Shuddh Bhojan Bali",
      bankName: "Bank Mandiri",
      bankCountry: "Indonesia",
      currency: "IDR",
      maskedAccount: "****8842",
    },
  },
  {
    slug: "sample-nusa-dharma-travel",
    username: "sample-travel-agent",
    businessName: "Nusa Dharma Travel",
    legalName: "PT Nusa Dharma Wisata",
    vendorType: "tour_agency",
    baseArea: "Denpasar",
    city: "Denpasar",
    addressLine1: "Jl. Teuku Umar 118",
    description:
      "Full-service Bali travel agent for families, honeymooners and groups. Handles hotels, cars, guides, restaurants and activities.",
    languages: ["English", "Hindi", "Tamil", "Indonesian"],
    commissionRate: "0.1500",
    ratingAvg: "4.70",
    ratingCount: 93,
    responseTimeMinutes: 35,
    highlights: [
      "End-to-end itinerary ownership across hotels, cars, guides and meals",
      "Comfort, premium and budget package options",
      "Indian rupee quote for travelers with Indonesian rupiah vendor payout tracking",
    ],
    listings: [
      {
        title: "Complete Bali travel agent package",
        serviceType: "tour_agency",
        description: "Five-night package with hotels, private rides, vegetarian meal routing and activity booking.",
        area: "Island-wide",
        addressLine1: "Jl. Teuku Umar 118",
        city: "Denpasar",
        tier: "comfort",
        capacityMin: 2,
        capacityMax: 24,
        priceRupees: 72000,
        priceUnit: "per_person",
        images: ["/Asset/beaches.png", "/Asset/cultures.png"],
        circuits: ["adventure", "culinary", "artistic"],
        inclusions: ["Hotel coordination", "Private AC vehicle", "Airport pickup", "Daily itinerary manager"],
        exclusions: ["International flights", "Visa costs", "Personal expenses"],
        serviceDetails: {
          packageStyle: "Private custom trip",
          vehicleOptions: ["standard SUV", "premium van"],
          supportWindow: "8 AM to 10 PM",
        },
        compliance: [
          {
            protocol: "vegetarian",
            guaranteeLevel: "capable",
            rating: "green",
            evidenceNotes: "Routes meals through Only2Bali verified vegetarian providers.",
          },
          {
            protocol: "jain",
            guaranteeLevel: "capable",
            rating: "amber",
            evidenceNotes: "Jain meals possible using partner kitchens and advance booking.",
          },
          {
            protocol: "vegan",
            guaranteeLevel: "capable",
            rating: "amber",
            evidenceNotes: "Vegan meal stops planned in Ubud, Canggu and Sanur.",
          },
        ],
      },
      {
        title: "Jakarta airport meet-and-greet with city transfer",
        serviceType: "transport",
        description:
          "CGK airport welcome, Hindi/English coordinator and private transfer to Jakarta hotel or domestic terminal for Bali connections.",
        area: "Soekarno-Hatta / Central Jakarta",
        addressLine1: "Terminal 3 Arrivals",
        city: "Jakarta",
        tier: "comfort",
        capacityMin: 2,
        capacityMax: 12,
        priceRupees: 8500,
        priceUnit: "per_group",
        images: ["/Asset/adventure.png"],
        circuits: ["adventure"],
        inclusions: ["Name board meet", "Private AC vehicle", "90 minutes waiting"],
        exclusions: ["Domestic flight tickets", "Hotel nights"],
        serviceDetails: {
          packageStyle: "Airport transfer",
          vehicleOptions: ["standard SUV", "premium van"],
          supportWindow: "Flight landing + 90 minutes",
        },
        compliance: [],
      },
    ],
    media: [
      { kind: "cover", fileUrl: "/Asset/beaches.png", altText: "Private Bali itinerary", caption: "Family itinerary planning" },
      { kind: "photo", fileUrl: "/Asset/cultures.png", altText: "Bali guide coordination", caption: "Temple and cultural planning" },
      { kind: "gallery", fileUrl: "/Asset/adventure.png", altText: "Adventure activities", caption: "Adventure activity coordination" },
    ],
    event: {
      title: "Family Bali planning clinic",
      description: "One-hour itinerary session for families comparing budget, comfort and premium options.",
      area: "Denpasar",
      priceRupees: 0,
      displayCurrency: "IDR",
      capacity: 18,
    },
    promotion: {
      title: "Free airport pickup",
      description: "Airport pickup included for comfort and premium packages booked this month.",
      offerCode: "NUSAARRIVE",
      priceRupees: 0,
      terms: "Applies to trips of 5 nights or more.",
    },
    payout: {
      holder: "PT Nusa Dharma Wisata",
      bankName: "BCA",
      bankCountry: "Indonesia",
      currency: "IDR",
      maskedAccount: "****1930",
    },
  },
  {
    slug: "sample-ramayana-circuit-experts",
    username: "sample-circuit-agent",
    businessName: "Ramayana Circuit Experts",
    legalName: "CV Ramayana Bali Experience",
    vendorType: "tour_agency",
    baseArea: "Uluwatu",
    city: "Badung",
    addressLine1: "Jl. Raya Uluwatu 71",
    description:
      "Circuit-based agent specializing in temple routes, Kecak fire dance evenings, senior-friendly pacing and vegetarian meal stops.",
    languages: ["English", "Hindi", "Gujarati", "Indonesian"],
    commissionRate: "0.1400",
    ratingAvg: "4.90",
    ratingCount: 58,
    responseTimeMinutes: 28,
    highlights: [
      "Ramayana temple circuit planned around senior comfort",
      "Guides trained for Hindu context and Indian family expectations",
      "Luxury car and budget van options available on the same route",
    ],
    listings: [
      {
        title: "Ramayana temple circuit agent",
        serviceType: "tour_agency",
        description: "Besakih, Tirta Empul, Lempuyang and Uluwatu Kecak route with guide, meal stops and pacing.",
        area: "Ubud, East Bali, Uluwatu",
        addressLine1: "Jl. Raya Uluwatu 71",
        city: "Badung",
        tier: "premium",
        capacityMin: 2,
        capacityMax: 30,
        priceRupees: 54000,
        priceUnit: "per_group",
        images: ["/Asset/D-card-img2.png", "/Asset/cultures.png"],
        circuits: ["ramayana", "artistic"],
        inclusions: ["Hindi-speaking guide", "Temple route planner", "Kecak tickets coordination", "Meal-stop routing"],
        exclusions: ["Temple donations", "Lunch and dinner bills", "Personal shopping"],
        serviceDetails: {
          circuitType: "Ramayana and temple circuit",
          seniorFriendly: true,
          maxWalkingMinutesAtOnce: 25,
        },
        compliance: [
          {
            protocol: "jain",
            guaranteeLevel: "capable",
            rating: "green",
            evidenceNotes: "Meal stops limited to verified Jain-capable partners on the circuit.",
          },
          {
            protocol: "vegetarian",
            guaranteeLevel: "capable",
            rating: "green",
            evidenceNotes: "Vegetarian meal routing included in every itinerary.",
          },
        ],
      },
    ],
    media: [
      { kind: "cover", fileUrl: "/Asset/D-card-img2.png", altText: "Ramayana temple circuit", caption: "Temple circuit planning" },
      { kind: "photo", fileUrl: "/Asset/cultures.png", altText: "Cultural route guide", caption: "Guided cultural route" },
      { kind: "gallery", fileUrl: "/Asset/beaches.png", altText: "Uluwatu evening route", caption: "Uluwatu Kecak evening route" },
    ],
    event: {
      title: "Kecak and temple heritage evening",
      description: "Guided cultural evening with Kecak coordination and vegetarian dinner stop.",
      area: "Uluwatu",
      priceRupees: 3200,
      displayCurrency: "IDR",
      capacity: 30,
    },
    promotion: {
      title: "Senior-friendly route upgrade",
      description: "Complimentary shorter walking plan and extra rest stop for groups with senior travelers.",
      offerCode: "SENIORRAM",
      priceRupees: 0,
      terms: "Applies when at least two travelers are above 65.",
    },
    payout: {
      holder: "CV Ramayana Bali Experience",
      bankName: "BNI",
      bankCountry: "Indonesia",
      currency: "IDR",
      maskedAccount: "****7720",
    },
  },
  {
    slug: "sample-bali-comfort-rides",
    username: "sample-ride-provider",
    businessName: "Bali Comfort Rides",
    legalName: "CV Bali Comfort Rides",
    vendorType: "transport",
    baseArea: "Nusa Dua",
    city: "Badung",
    addressLine1: "Jl. Pratama 9",
    description:
      "Quality rides, comfortable vans and luxury cars for travelers who want predictable service rather than random taxis.",
    languages: ["English", "Hindi", "Indonesian"],
    commissionRate: "0.1000",
    ratingAvg: "4.70",
    ratingCount: 121,
    responseTimeMinutes: 15,
    highlights: [
      "Economical van, comfort Innova and luxury Alphard options",
      "Drivers briefed on vegetarian and Jain meal-stop requirements",
      "Airport pickup, full-day hire and circuit rides available",
    ],
    listings: [
      {
        title: "Comfort and luxury car with driver",
        serviceType: "transport",
        description: "Private AC vehicle with driver, fuel and parking for full-day Bali sightseeing.",
        area: "Island-wide",
        addressLine1: "Jl. Pratama 9",
        city: "Badung",
        tier: "comfort",
        capacityMin: 2,
        capacityMax: 16,
        priceRupees: 7400,
        priceUnit: "per_day",
        images: ["/Asset/beaches.png", "/Asset/adventure.png"],
        circuits: ["ramayana", "adventure", "culinary", "artistic"],
        inclusions: ["Driver", "Fuel", "Parking", "12 hours of service"],
        exclusions: ["Toll if any", "Overtime after 12 hours", "Entry tickets"],
        serviceDetails: {
          fleet: ["Avanza", "Innova", "HiAce", "Alphard"],
          luxuryUpgradeRupees: 8500,
          budgetVanRupees: 5200,
        },
        compliance: [
          {
            protocol: "vegetarian",
            guaranteeLevel: "capable",
            rating: "green",
            evidenceNotes: "No food served; drivers use verified meal-stop list.",
          },
          {
            protocol: "jain",
            guaranteeLevel: "capable",
            rating: "green",
            evidenceNotes: "No food served; drivers use verified Jain-capable restaurants.",
          },
          {
            protocol: "vegan",
            guaranteeLevel: "capable",
            rating: "green",
            evidenceNotes: "No food served; vegan stops marked in driver notes.",
          },
        ],
      },
    ],
    media: [
      { kind: "cover", fileUrl: "/Asset/beaches.png", altText: "Comfort vehicle for Bali rides", caption: "Comfort private ride" },
      { kind: "photo", fileUrl: "/Asset/adventure.png", altText: "Bali day-trip vehicle", caption: "Day-trip vehicle option" },
      { kind: "gallery", fileUrl: "/Asset/cultures.png", altText: "Temple transfer vehicle", caption: "Temple circuit transfer" },
    ],
    event: {
      title: "Luxury car showcase weekend",
      description: "Provider showcase for Alphard and premium van options for families and honeymooners.",
      area: "Nusa Dua",
      priceRupees: 0,
      displayCurrency: "IDR",
      capacity: 40,
    },
    promotion: {
      title: "Budget weekday ride",
      description: "Lower weekday rate for economical vehicles booked through Only2Bali.",
      offerCode: "RIDEWEEKDAY",
      priceRupees: 5200,
      terms: "Monday to Thursday only; excludes airport midnight pickup.",
    },
    payout: {
      holder: "CV Bali Comfort Rides",
      bankName: "HDFC Bank",
      bankCountry: "India",
      currency: "INR",
      maskedAccount: "****4108",
      upiId: "balicomfortrides@upi",
    },
  },
];

const TRAVELLERS = [
  {
    username: "sample-traveller-meera",
    email: "meera.family@sample.only2bali.com",
    mobile: "+919810001101",
    fullName: "Meera Shah",
    homeCity: "Mumbai",
    protocol: "jain" as const,
    preferredLanguage: "gu",
  },
  {
    username: "sample-traveller-arjun",
    email: "arjun.honeymoon@sample.only2bali.com",
    mobile: "+919810001102",
    fullName: "Arjun Malhotra",
    homeCity: "Delhi",
    protocol: "vegetarian" as const,
    preferredLanguage: "hi",
  },
  {
    username: "sample-traveller-kavya",
    email: "kavya.group@sample.only2bali.com",
    mobile: "+919810001103",
    fullName: "Kavya Rao",
    homeCity: "Bengaluru",
    protocol: "vegan" as const,
    preferredLanguage: "en",
  },
  {
    username: "sample-traveller-prakash",
    email: "prakash.seniorgroup@sample.only2bali.com",
    mobile: "+919810001104",
    fullName: "Prakash Mehta",
    homeCity: "Ahmedabad",
    protocol: "jain" as const,
    preferredLanguage: "gu",
  },
];

async function ids<T extends { id: string }>(rows: Promise<T[]>): Promise<string[]> {
  return (await rows).map((row) => row.id);
}

async function wipeSample() {
  const accountIds = await ids(db.select({ id: account.id }).from(account).where(like(account.email, SAMPLE_EMAIL)));
  const bookingIds = await ids(db.select({ id: booking.id }).from(booking).where(like(booking.reference, SAMPLE_REF)));

  if (bookingIds.length > 0) {
    await db.delete(paymentDisbursement).where(inArray(paymentDisbursement.bookingId, bookingIds));
    await db.delete(payment).where(inArray(payment.bookingId, bookingIds));
    await db.delete(booking).where(inArray(booking.id, bookingIds));
  }

  if (accountIds.length > 0) {
    const travellerIds = await ids(
      db.select({ id: traveller.id }).from(traveller).where(inArray(traveller.accountId, accountIds))
    );
    const requestIds =
      travellerIds.length > 0
        ? await ids(db.select({ id: tripRequest.id }).from(tripRequest).where(inArray(tripRequest.travellerId, travellerIds)))
        : [];

    if (requestIds.length > 0) {
      await db.delete(messageThread).where(inArray(messageThread.tripRequestId, requestIds));
      await db.delete(offer).where(inArray(offer.tripRequestId, requestIds));
      await db.delete(lead).where(inArray(lead.tripRequestId, requestIds));
      await db.delete(tripRequest).where(inArray(tripRequest.id, requestIds));
    }

    await db.delete(account).where(inArray(account.id, accountIds));
  }
}

export async function seedSampleMarketplace() {
  console.log("refreshing base catalogue...");
  await seedCatalogue();

  console.log("seeding sample provider/traveller data...");
  await wipeSample();

  const passwordHash = await hashPassword(SAMPLE_PASSWORD);
  const circuitIds = new Map(
    (await db.select({ id: circuit.id, key: circuit.key }).from(circuit)).map((row) => [row.key, row.id])
  );
  const packageRows = await db.select({ id: pkg.id, slug: pkg.slug }).from(pkg).orderBy(asc(pkg.slug));
  const packages = new Map(packageRows.map((row) => [row.slug, row.id]));

  const providerIds = new Map<string, string>();
  const providerAccountIds = new Map<string, string>();
  const listingIds = new Map<string, string>();
  const payoutIds = new Map<string, string>();

  for (const provider of PROVIDERS) {
    const [acct] = await db
      .insert(account)
      .values({
        email: `${provider.slug}@sample.only2bali.com`,
        mobile: `+6281${String(555000000 + providerIds.size).slice(0, 9)}`,
        username: provider.username,
        passwordHash,
        role: "vendor",
        status: "active",
        emailVerifiedAt: at(-30),
        mobileVerifiedAt: at(-30),
        lastLoginAt: at(-1),
      })
      .returning({ id: account.id });

    const [vendorRow] = await db
      .insert(vendor)
      .values({
        accountId: acct.id,
        slug: provider.slug,
        businessName: provider.businessName,
        legalName: provider.legalName,
        vendorType: provider.vendorType,
        baseArea: provider.baseArea,
        description: provider.description,
        addressLine1: provider.addressLine1,
        city: provider.city,
        country: "Indonesia",
        logo: "/Asset/logo.png",
        coverImage: provider.media[0]?.fileUrl ?? "/Asset/beaches.png",
        whatsapp: "+6281900012345",
        phone: "+6281900012345",
        email: `${provider.slug}@sample.only2bali.com`,
        website: `https://only2bali.example/${provider.slug}`,
        languages: provider.languages,
        verificationStatus: "verified",
        verifiedAt: at(-25),
        commissionRate: provider.commissionRate,
        ratingAvg: provider.ratingAvg,
        ratingCount: provider.ratingCount,
        responseTimeMinutes: provider.responseTimeMinutes,
        onboardingStep: 5,
      })
      .returning({ id: vendor.id });

    providerIds.set(provider.slug, vendorRow.id);
    providerAccountIds.set(provider.slug, acct.id);

    await db.insert(vendorHighlight).values(
      provider.highlights.map((text, sortOrder) => ({
        vendorId: vendorRow.id,
        text,
        sortOrder,
        approved: true,
      }))
    );

    await db.insert(vendorDocument).values([
      {
        vendorId: vendorRow.id,
        kind: "business_licence",
        fileUrl: `/demo/${provider.slug}-licence.pdf`,
        status: "approved",
        reviewedAt: at(-24),
      },
      {
        vendorId: vendorRow.id,
        kind: provider.vendorType === "restaurant" ? "kitchen_certificate" : "tax_id",
        fileUrl: `/demo/${provider.slug}-compliance.pdf`,
        status: "approved",
        reviewedAt: at(-24),
      },
    ]);

    const [payout] = await db
      .insert(vendorPayoutAccount)
      .values({
        vendorId: vendorRow.id,
        accountHolderName: provider.payout.holder,
        bankName: provider.payout.bankName,
        bankCountry: provider.payout.bankCountry,
        currency: provider.payout.currency,
        gatewayContactId: `sample_contact_${provider.slug}`,
        gatewayFundAccountId: `sample_fund_${provider.slug}`,
        maskedAccount: provider.payout.maskedAccount,
        upiId: provider.payout.upiId,
        status: "verified",
        verifiedAt: at(-20),
      })
      .returning({ id: vendorPayoutAccount.id });
    payoutIds.set(provider.slug, payout.id);

    for (const listing of provider.listings) {
      const [listingRow] = await db
        .insert(serviceListing)
        .values({
          vendorId: vendorRow.id,
          title: listing.title,
          serviceType: listing.serviceType,
          description: listing.description,
          area: listing.area,
          addressLine1: listing.addressLine1,
          city: listing.city,
          capacityMin: listing.capacityMin,
          capacityMax: listing.capacityMax,
          tier: listing.tier,
          priceAmount: inr(listing.priceRupees),
          priceCurrency: "INR",
          priceUnit: listing.priceUnit,
          images: listing.images,
          serviceDetails: listing.serviceDetails,
          inclusions: listing.inclusions,
          exclusions: listing.exclusions,
          cancellationPolicy: "Free date change until 7 days before service; cancellation charges apply after payment capture.",
          status: "active",
          active: true,
        })
        .returning({ id: serviceListing.id });

      listingIds.set(provider.slug, listingRow.id);

      const linkedCircuits = listing.circuits
        .filter((key) => circuitIds.has(key))
        .map((key) => ({ listingId: listingRow.id, circuitId: circuitIds.get(key)! }));
      if (linkedCircuits.length > 0) await db.insert(listingCircuit).values(linkedCircuits);

      await db.insert(listingCompliance).values(
        listing.compliance.map((row) => ({
          listingId: listingRow.id,
          protocol: row.protocol,
          guaranteeLevel: row.guaranteeLevel,
          rating: row.rating,
          kitchenType: row.kitchenType,
          evidenceNotes: row.evidenceNotes,
          verifiedAt: at(-18),
          expiresAt: at(347),
        }))
      );

      await db.insert(availability).values(
        Array.from({ length: 45 }, (_, index) => ({
          listingId: listingRow.id,
          date: day(index + 5),
          status: index >= 14 && index <= 17 ? ("blocked" as const) : ("open" as const),
          priceOverrideAmount: index % 9 === 0 ? inr(listing.priceRupees + 500) : undefined,
        }))
      );
    }

    await db.insert(vendorMedia).values(
      provider.media.map((mediaRow, sortOrder) => ({
        vendorId: vendorRow.id,
        listingId: listingIds.get(provider.slug),
        kind: mediaRow.kind,
        fileUrl: mediaRow.fileUrl,
        altText: mediaRow.altText,
        caption: mediaRow.caption,
        sortOrder,
        approved: true,
      }))
    );

    await db.insert(vendorEvent).values({
      vendorId: vendorRow.id,
      title: provider.event.title,
      description: provider.event.description,
      startsAt: at(21 + providerIds.size),
      endsAt: at(21 + providerIds.size),
      area: provider.event.area,
      addressLine1: provider.addressLine1,
      priceAmount: inr(provider.event.priceRupees),
      priceCurrency: "INR",
      displayCurrency: provider.event.displayCurrency,
      capacity: provider.event.capacity,
      images: provider.media.map((row) => row.fileUrl).slice(0, 2),
      status: "published",
    });

    await db.insert(vendorPromotion).values({
      vendorId: vendorRow.id,
      listingId: listingIds.get(provider.slug),
      title: provider.promotion.title,
      description: provider.promotion.description,
      offerCode: provider.promotion.offerCode,
      priceAmount: inr(provider.promotion.priceRupees),
      priceCurrency: "INR",
      displayCurrency: "IDR",
      terms: provider.promotion.terms,
      validFrom: at(-2),
      validUntil: at(45),
      images: provider.media.map((row) => row.fileUrl).slice(0, 1),
      status: "published",
    });
  }

  const travellerIds = new Map<string, string>();
  const travellerAccountIds = new Map<string, string>();
  for (const sampleTraveller of TRAVELLERS) {
    const [acct] = await db
      .insert(account)
      .values({
        email: sampleTraveller.email,
        mobile: sampleTraveller.mobile,
        username: sampleTraveller.username,
        passwordHash,
        role: "traveller",
        status: "active",
        emailVerifiedAt: at(-14),
        mobileVerifiedAt: at(-14),
        lastLoginAt: at(-1),
      })
      .returning({ id: account.id });

    const [travellerRow] = await db
      .insert(traveller)
      .values({
        accountId: acct.id,
        fullName: sampleTraveller.fullName,
        homeCity: sampleTraveller.homeCity,
        defaultProtocol: sampleTraveller.protocol,
        preferredLanguage: sampleTraveller.preferredLanguage,
        whatsappOptin: true,
      })
      .returning({ id: traveller.id });

    travellerAccountIds.set(sampleTraveller.email, acct.id);
    travellerIds.set(sampleTraveller.email, travellerRow.id);
  }

  const [familyRequest] = await db
    .insert(tripRequest)
    .values({
      travellerId: travellerIds.get("meera.family@sample.only2bali.com")!,
      circuitId: circuitIds.get("ramayana"),
      status: "submitted",
      protocol: "jain",
      tier: "premium",
      groupSize: 12,
      crewType: "family",
      rooms: 6,
      fromDate: day(55),
      toDate: day(61),
      nights: 6,
      departureCity: "Mumbai",
      interests: ["temples", "senior comfort", "Jain meals"],
      kitchenRequired: true,
      cookRequired: true,
      preferredLanguage: "gu",
      visibility: "open_to_verified",
      publishedAt: at(-3),
      bidsCloseAt: at(5),
      budgetMinAmount: inr(90_000),
      budgetMaxAmount: inr(145_000),
      budgetBasis: "per_person",
      specialRequirements: "Strict Jain food, two senior travelers, luxury car preference for longer road days.",
      requirementTags: ["strict-jain", "senior-friendly", "luxury-car"],
      mobileVerified: true,
    })
    .returning({ id: tripRequest.id });

  const [honeymoonRequest] = await db
    .insert(tripRequest)
    .values({
      travellerId: travellerIds.get("arjun.honeymoon@sample.only2bali.com")!,
      circuitId: circuitIds.get("adventure"),
      status: "submitted",
      protocol: "vegetarian",
      tier: "comfort",
      groupSize: 2,
      crewType: "couple",
      rooms: 1,
      fromDate: day(42),
      toDate: day(47),
      nights: 5,
      departureCity: "Delhi",
      interests: ["beaches", "private driver", "romantic dinner"],
      kitchenRequired: false,
      preferredLanguage: "hi",
      visibility: "open_to_verified",
      publishedAt: at(-2),
      bidsCloseAt: at(6),
      budgetMinAmount: inr(70_000),
      budgetMaxAmount: inr(110_000),
      budgetBasis: "per_person",
      specialRequirements: "Comfortable stay, quality ride, vegetarian restaurants and one premium car day.",
      requirementTags: ["vegetarian", "honeymoon", "premium-ride"],
      mobileVerified: true,
    })
    .returning({ id: tripRequest.id });

  const [veganGroupRequest] = await db
    .insert(tripRequest)
    .values({
      travellerId: travellerIds.get("kavya.group@sample.only2bali.com")!,
      circuitId: circuitIds.get("culinary"),
      status: "quoted",
      protocol: "vegan",
      tier: "economical",
      groupSize: 8,
      crewType: "friends",
      rooms: 4,
      fromDate: day(70),
      toDate: day(76),
      nights: 6,
      departureCity: "Bengaluru",
      interests: ["vegan food", "cooking class", "budget cars"],
      preferredLanguage: "en",
      visibility: "open_to_verified",
      publishedAt: at(-4),
      bidsCloseAt: at(3),
      budgetMinAmount: inr(48_000),
      budgetMaxAmount: inr(68_000),
      budgetBasis: "per_person",
      specialRequirements: "Vegan meals only, budgetary options required, no luxury hotel needed.",
      requirementTags: ["vegan", "budget", "culinary"],
      mobileVerified: true,
    })
    .returning({ id: tripRequest.id });

  const [seniorRequest] = await db
    .insert(tripRequest)
    .values({
      travellerId: travellerIds.get("prakash.seniorgroup@sample.only2bali.com")!,
      circuitId: circuitIds.get("ramayana"),
      status: "booked",
      protocol: "jain",
      tier: "comfort",
      groupSize: 16,
      crewType: "senior group",
      rooms: 8,
      fromDate: day(30),
      toDate: day(35),
      nights: 5,
      departureCity: "Ahmedabad",
      interests: ["temple circuit", "comfortable transport", "Jain food"],
      kitchenRequired: true,
      cookRequired: true,
      preferredLanguage: "gu",
      visibility: "private",
      budgetMinAmount: inr(75_000),
      budgetMaxAmount: inr(105_000),
      budgetBasis: "per_person",
      specialRequirements: "Senior-friendly pacing, short walks, Jain meals and comfort vehicles.",
      requirementTags: ["senior-friendly", "jain", "temple-circuit"],
      mobileVerified: true,
    })
    .returning({ id: tripRequest.id });

  await db.insert(lead).values([
    {
      accountId: travellerAccountIds.get("meera.family@sample.only2bali.com")!,
      tripRequestId: familyRequest.id,
      source: "planner",
      name: "Meera Shah",
      email: "meera.family@sample.only2bali.com",
      mobile: "+919810001101",
      whatsappOptin: true,
      departureCity: "Mumbai",
      groupSize: 12,
      protocol: "jain",
      travelMonth: "September",
      message: "Family wants Ramayana circuit, strict Jain meals and luxury car option.",
      status: "quoted",
    },
    {
      accountId: travellerAccountIds.get("arjun.honeymoon@sample.only2bali.com")!,
      tripRequestId: honeymoonRequest.id,
      source: "web",
      name: "Arjun Malhotra",
      email: "arjun.honeymoon@sample.only2bali.com",
      mobile: "+919810001102",
      whatsappOptin: true,
      departureCity: "Delhi",
      groupSize: 2,
      protocol: "vegetarian",
      travelMonth: "September",
      message: "Honeymoon with comfort hotel, vegetarian restaurants and one luxury car day.",
      status: "contacted",
    },
    {
      accountId: travellerAccountIds.get("kavya.group@sample.only2bali.com")!,
      tripRequestId: veganGroupRequest.id,
      source: "package_page",
      name: "Kavya Rao",
      email: "kavya.group@sample.only2bali.com",
      mobile: "+919810001103",
      whatsappOptin: true,
      departureCity: "Bengaluru",
      groupSize: 8,
      protocol: "vegan",
      travelMonth: "October",
      message: "Budget vegan group comparing restaurant, travel agent and car options.",
      status: "quoted",
    },
    {
      accountId: travellerAccountIds.get("prakash.seniorgroup@sample.only2bali.com")!,
      tripRequestId: seniorRequest.id,
      source: "whatsapp",
      name: "Prakash Mehta",
      email: "prakash.seniorgroup@sample.only2bali.com",
      mobile: "+919810001104",
      whatsappOptin: true,
      departureCity: "Ahmedabad",
      groupSize: 16,
      protocol: "jain",
      travelMonth: "August",
      message: "Senior group already moving to booking for Ramayana circuit.",
      status: "converted",
    },
  ]);

  const sattvikPackageId = packages.get("sattvik-serenity") ?? null;
  const explorerPackageId = packages.get("bali-veg-explorer") ?? null;

  const [familyCircuitOffer] = await db
    .insert(offer)
    .values({
      tripRequestId: familyRequest.id,
      vendorId: providerIds.get("sample-ramayana-circuit-experts")!,
      packageId: sattvikPackageId,
      origin: "vendor_bid",
      title: "Premium Ramayana circuit with luxury car support",
      summary: "Temple route, Kecak evening, Jain meal stops and senior pacing for the family.",
      totalAmount: inr(1_392_000),
      vendorNetAmount: inr(1_197_120),
      commissionRate: "0.1400",
      currency: "INR",
      pricePerPerson: inr(116_000),
      lineItems: [
        { label: "Circuit planning and guide", amount: inr(648_000) },
        { label: "Luxury car and van mix", amount: inr(264_000) },
        { label: "Jain meal routing", amount: inr(480_000) },
      ],
      inclusionsDelta: ["Senior-friendly routing", "Luxury car for long road days", "Gujarati support"],
      dayPlan: [
        { day: 1, title: "Arrival and Ubud check-in" },
        { day: 2, title: "Tirta Empul and vegetarian lunch" },
        { day: 5, title: "Uluwatu Kecak evening" },
      ],
      validUntil: at(8),
      status: "sent",
      rank: 1,
      score: 94,
      submittedAt: at(-2),
    })
    .returning({ id: offer.id });

  await db.insert(offer).values([
    {
      tripRequestId: familyRequest.id,
      vendorId: providerIds.get("sample-nusa-dharma-travel")!,
      packageId: sattvikPackageId,
      origin: "vendor_bid",
      title: "Comfort Ramayana family package",
      summary: "Hotels, private vehicles, guide and verified Jain restaurant coordination.",
      totalAmount: inr(1_164_000),
      vendorNetAmount: inr(989_400),
      commissionRate: "0.1500",
      currency: "INR",
      pricePerPerson: inr(97_000),
      validUntil: at(7),
      status: "viewed",
      rank: 2,
      score: 88,
      submittedAt: at(-1),
    },
    {
      tripRequestId: honeymoonRequest.id,
      vendorId: providerIds.get("sample-nusa-dharma-travel")!,
      packageId: explorerPackageId,
      origin: "vendor_bid",
      title: "Vegetarian honeymoon with comfort stay",
      summary: "Five nights with beach hotel, private driver, vegetarian restaurants and one luxury-car sunset day.",
      totalAmount: inr(196_000),
      vendorNetAmount: inr(166_600),
      commissionRate: "0.1500",
      currency: "INR",
      pricePerPerson: inr(98_000),
      validUntil: at(6),
      status: "shortlisted",
      rank: 1,
      score: 91,
      submittedAt: at(-1),
    },
    {
      tripRequestId: honeymoonRequest.id,
      vendorId: providerIds.get("sample-bali-comfort-rides")!,
      origin: "vendor_bid",
      title: "Luxury ride add-on for honeymoon",
      summary: "Alphard for airport arrival and Uluwatu sunset, with driver and waiting time included.",
      totalAmount: inr(22_000),
      vendorNetAmount: inr(19_800),
      commissionRate: "0.1000",
      currency: "INR",
      pricePerPerson: inr(11_000),
      validUntil: at(5),
      status: "sent",
      rank: 2,
      score: 82,
      submittedAt: at(-1),
    },
    {
      tripRequestId: veganGroupRequest.id,
      vendorId: providerIds.get("sample-shuddh-bhojan-ubud")!,
      packageId: explorerPackageId,
      origin: "vendor_bid",
      title: "Budget vegan meal plan and cooking class",
      summary: "Six-day vegan meal support with one cooking class and group thali pricing.",
      totalAmount: inr(348_000),
      vendorNetAmount: inr(306_240),
      commissionRate: "0.1200",
      currency: "INR",
      pricePerPerson: inr(43_500),
      validUntil: at(5),
      status: "sent",
      rank: 1,
      score: 89,
      submittedAt: at(-2),
    },
  ]);

  const threads = [
    {
      requestId: familyRequest.id,
      vendorSlug: "sample-ramayana-circuit-experts",
      travellerEmail: "meera.family@sample.only2bali.com",
      messages: [
        "We need strict Jain food and short walking stretches for senior travelers.",
        "We can keep walks under 25 minutes and route all meals through verified Jain partners.",
        "Please include one luxury car for long-distance temple days.",
      ],
    },
    {
      requestId: honeymoonRequest.id,
      vendorSlug: "sample-nusa-dharma-travel",
      travellerEmail: "arjun.honeymoon@sample.only2bali.com",
      messages: [
        "Can you keep the stay comfortable but not too expensive?",
        "Yes. We quoted comfort hotels, private ride, vegetarian restaurants and one premium car day.",
      ],
    },
    {
      requestId: veganGroupRequest.id,
      vendorSlug: "sample-shuddh-bhojan-ubud",
      travellerEmail: "kavya.group@sample.only2bali.com",
      messages: [
        "Our group is vegan and needs budget options.",
        "We can do vegan thali pricing and one cooking class, with ghee removed from all dishes.",
      ],
    },
  ];

  for (const thread of threads) {
    const [threadRow] = await db
      .insert(messageThread)
      .values({
        tripRequestId: thread.requestId,
        vendorId: providerIds.get(thread.vendorSlug)!,
        status: "open",
      })
      .returning({ id: messageThread.id });

    await db.insert(message).values(
      thread.messages.map((body, index) => ({
        threadId: threadRow.id,
        senderAccountId:
          index % 2 === 0 ? travellerAccountIds.get(thread.travellerEmail)! : providerAccountIds.get(thread.vendorSlug)!,
        bodyRaw: body,
        bodyMasked: body,
        contactAttemptDetected: false,
        sentAt: at(-2 + index / 24),
        readAt: at(-2 + (index + 1) / 24),
      }))
    );
  }

  let departureRow: { id: string; priceAmount: number } | undefined;
  if (explorerPackageId) {
    departureRow = (
      await db
        .select({ id: departure.id, priceAmount: departure.priceAmount })
        .from(departure)
        .where(and(eq(departure.packageId, explorerPackageId), eq(departure.status, "open")))
        .orderBy(asc(departure.startDate))
        .limit(1)
    )[0];
  }

  const gross = inr(1_520_000);
  const commission = inr(228_000);
  const net = gross - commission;

  const [confirmedBooking] = await db
    .insert(booking)
    .values({
      reference: "O2B-SAMPLE-0001",
      tripRequestId: seniorRequest.id,
      offerId: familyCircuitOffer.id,
      travellerId: travellerIds.get("prakash.seniorgroup@sample.only2bali.com")!,
      packageId: sattvikPackageId,
      departureId: departureRow?.id,
      vendorId: providerIds.get("sample-ramayana-circuit-experts")!,
      pax: 16,
      rooms: 8,
      grossAmount: gross,
      currency: "INR",
      commissionRate: "0.1500",
      commissionAmount: commission,
      netAmount: net,
      status: "confirmed",
      confirmedAt: at(-1),
    })
    .returning({ id: booking.id });

  await db.insert(bookingTraveller).values(
    [
      "Prakash Mehta",
      "Jyoti Mehta",
      "Harish Shah",
      "Bhavna Shah",
      "Mukesh Doshi",
      "Kokila Doshi",
      "Dinesh Parekh",
      "Asha Parekh",
      "Ramesh Gandhi",
      "Nirmala Gandhi",
      "Suresh Trivedi",
      "Leela Trivedi",
      "Mahesh Mehta",
      "Poonam Mehta",
      "Anil Shah",
      "Rekha Shah",
    ].map((fullName, index) => ({
      bookingId: confirmedBooking.id,
      fullName,
      age: index < 12 ? 66 + (index % 8) : 42 + (index % 7),
      gender: index % 2 === 0 ? "male" : "female",
      dietaryNotes: "Strict Jain. No onion, garlic or root vegetables.",
      isLead: index === 0,
    }))
  );

  await db.insert(bookingListing).values([
    {
      bookingId: confirmedBooking.id,
      listingId: listingIds.get("sample-ramayana-circuit-experts")!,
      priceSnapshot: inr(54_000),
    },
    {
      bookingId: confirmedBooking.id,
      listingId: listingIds.get("sample-bali-comfort-rides")!,
      priceSnapshot: inr(7_400),
    },
    {
      bookingId: confirmedBooking.id,
      listingId: listingIds.get("sample-shuddh-bhojan-ubud")!,
      priceSnapshot: inr(1_450),
    },
  ]);

  const [capturedPayment] = await db
    .insert(payment)
    .values({
      bookingId: confirmedBooking.id,
      provider: "cashfree",
      providerOrderId: "sample_cashfree_order_0001",
      providerPaymentId: "sample_cashfree_payment_0001",
      amount: gross,
      currency: "INR",
      purpose: "full",
      status: "captured",
      idempotencyKey: "sample-booking-o2b-0001-full",
      initiatedBy: travellerAccountIds.get("prakash.seniorgroup@sample.only2bali.com")!,
      authorizedAt: at(-1),
      capturedAt: at(-1),
      notes: "Sample payment: travelers pay Only2Bali in INR; provider payout ledger shows vendor currency.",
    })
    .returning({ id: payment.id });

  await db.insert(paymentDisbursement).values({
    bookingId: confirmedBooking.id,
    paymentId: capturedPayment.id,
    vendorId: providerIds.get("sample-ramayana-circuit-experts")!,
    payoutAccountId: payoutIds.get("sample-ramayana-circuit-experts")!,
    provider: "cashfree",
    providerPayoutId: "sample_cashfree_payout_0001",
    grossAmount: gross,
    commissionAmount: commission,
    netAmount: net,
    travellerCurrency: "INR",
    vendorCurrency: "IDR",
    fxRate: "190.50",
    status: "approved",
    approvedAt: at(0),
  });

  const [completedBooking] = await db
    .insert(booking)
    .values({
      reference: "O2B-SAMPLE-0002",
      tripRequestId: veganGroupRequest.id,
      travellerId: travellerIds.get("kavya.group@sample.only2bali.com")!,
      packageId: explorerPackageId,
      vendorId: providerIds.get("sample-shuddh-bhojan-ubud")!,
      pax: 8,
      rooms: 4,
      grossAmount: inr(348_000),
      currency: "INR",
      commissionRate: "0.1200",
      commissionAmount: inr(41_760),
      netAmount: inr(306_240),
      status: "completed",
      confirmedAt: at(-40),
    })
    .returning({ id: booking.id });

  await db.insert(review).values({
    bookingId: completedBooking.id,
    direction: "traveller_to_vendor",
    vendorId: providerIds.get("sample-shuddh-bhojan-ubud")!,
    packageId: explorerPackageId,
    rating: 5,
    foodComplianceKept: true,
    comment:
      "The provider kept the vegan requirement clearly labeled and the budget stayed within the quote.",
    published: true,
  });

  console.log(`  providers: ${providerIds.size}`);
  console.log(`  travellers: ${travellerIds.size}`);
  console.log("  inquiries: 4");
  console.log("  provider bids/offers: 5");
  console.log("  chats: 3 threads");
  console.log("  bookings: 2 with 1 captured INR payment and 1 approved IDR disbursement");
  console.log(`sample login password for all sample users: ${SAMPLE_PASSWORD}`);
  console.log("sample provider/traveller data complete");
}

if (process.argv[1]?.includes("seed-sample-marketplace")) {
  seedSampleMarketplace()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
