import type { Protocol } from "@/lib/protocols";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isCatalogueCircuitOpen, tripCatalogueCircuit } from "@/lib/db/catalogue-circuit";
import {
  circuit, pkg, packageCircuit, packagePlace, place, packageHighlight, departure,
  packageDay, packageDayMeal, packageInclusion,
} from "@/lib/db/schema";

export interface CircuitRow {
  id: string;
  key: string;
  name: string;
  blurb: string | null;
  heroImage: string | null;
  sortOrder: number;
}

export async function listCircuits(): Promise<CircuitRow[]> {
  return db
    .select({
      id: circuit.id,
      key: circuit.key,
      name: circuit.name,
      blurb: circuit.blurb,
      heroImage: circuit.heroImage,
      sortOrder: circuit.sortOrder,
    })
    .from(circuit)
    .where(eq(circuit.active, true))
    .orderBy(asc(circuit.sortOrder));
}

export interface PackageCard {
  id: string;
  slug: string;
  name: string;
  days: number;
  nights: number;
  tier: string;
  protocols: string[];
  basePriceAmount: number;
  basePriceCurrency: string;
  heroImage: string | null;
  blurb: string | null;
  languages: string[] | null;
  places: string[];
  highlights: string[];
  circuitKeys: string[];
  nextDeparture: { startDate: string; priceAmount: number; seatsAvailable: number } | null;
}

export interface PackageFilters {
  circuitKey?: string;
  protocol?: Protocol;
  /** Open-ended. Either bound may be omitted; `tier` is never a price boundary. */
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

/**
 * Cards for the homepage and the browse page. One query per relation rather than
 * a single joined query, because the array relations would multiply rows and
 * the packages table is small enough that three round trips beat de-duplicating
 * a cartesian product.
 */
export async function listPackageCards(filters: PackageFilters = {}): Promise<PackageCard[]> {
  const conditions = [eq(pkg.status, "published")];

  if (filters.protocol) {
    conditions.push(sql`${pkg.protocols} @> ARRAY[${filters.protocol}]::protocol[]`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(sql`${pkg.basePriceAmount} >= ${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(sql`${pkg.basePriceAmount} <= ${filters.maxPrice}`);
  }
  if (filters.circuitKey) {
    conditions.push(sql`exists (
      select 1 from ${packageCircuit}
      join ${circuit} on ${circuit.id} = ${packageCircuit.circuitId}
      where ${packageCircuit.packageId} = ${pkg.id}
        and ${circuit.key} = ${filters.circuitKey}
    )`);
  }

  const rows = await db
    .select()
    .from(pkg)
    .where(and(...conditions))
    .orderBy(asc(pkg.basePriceAmount))
    .limit(filters.limit ?? 24);

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [places, highlights, circuits, departures] = await Promise.all([
    db
      .select({ packageId: packagePlace.packageId, name: place.name, sortOrder: packagePlace.sortOrder })
      .from(packagePlace)
      .innerJoin(place, eq(place.id, packagePlace.placeId))
      .where(inArray(packagePlace.packageId, ids))
      .orderBy(asc(packagePlace.sortOrder)),
    db
      .select({ packageId: packageHighlight.packageId, text: packageHighlight.text })
      .from(packageHighlight)
      .where(inArray(packageHighlight.packageId, ids))
      .orderBy(asc(packageHighlight.sortOrder)),
    db
      .select({ packageId: packageCircuit.packageId, key: circuit.key })
      .from(packageCircuit)
      .innerJoin(circuit, eq(circuit.id, packageCircuit.circuitId))
      .where(inArray(packageCircuit.packageId, ids)),
    // The soonest open departure per package, with seats actually left.
    db
      .select({
        packageId: departure.packageId,
        startDate: departure.startDate,
        priceAmount: departure.priceAmount,
        seatsAvailable: sql<number>`${departure.seatsTotal} - ${departure.seatsHeld} - ${departure.seatsBooked}`,
      })
      .from(departure)
      .where(
        and(
          inArray(departure.packageId, ids),
          eq(departure.status, "open"),
          sql`${departure.startDate} >= current_date`,
          sql`${departure.seatsTotal} - ${departure.seatsHeld} - ${departure.seatsBooked} > 0`
        )
      )
      .orderBy(asc(departure.startDate)),
  ]);

  const group = <T, K extends keyof T>(list: T[], key: K) => {
    const m = new Map<string, T[]>();
    for (const item of list) {
      const k = String(item[key]);
      (m.get(k) ?? m.set(k, []).get(k)!).push(item);
    }
    return m;
  };

  const placesBy = group(places, "packageId");
  const highlightsBy = group(highlights, "packageId");
  const circuitsBy = group(circuits, "packageId");
  const departuresBy = group(departures, "packageId");

  return rows.map((r) => {
    const next = departuresBy.get(r.id)?.[0];
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      days: r.days,
      nights: r.nights,
      tier: r.tier,
      protocols: r.protocols as string[],
      basePriceAmount: r.basePriceAmount,
      basePriceCurrency: r.basePriceCurrency,
      heroImage: r.heroImage,
      blurb: r.blurb,
      languages: r.languages,
      places: (placesBy.get(r.id) ?? []).map((p) => p.name),
      highlights: (highlightsBy.get(r.id) ?? []).map((h) => h.text),
      circuitKeys: (circuitsBy.get(r.id) ?? []).map((c) => c.key),
      nextDeparture: next
        ? {
            startDate: next.startDate,
            priceAmount: next.priceAmount,
            seatsAvailable: Number(next.seatsAvailable),
          }
        : null,
    };
  });
}

export interface PackageDayMeal {
  meal: "breakfast" | "lunch" | "dinner";
  description: string;
  complianceRating: "green" | "amber" | "red";
  note: string | null;
}

export interface PackageDay {
  dayNumber: number;
  title: string;
  summary: string | null;
  stayArea: string | null;
  transportNote: string | null;
  meals: PackageDayMeal[];
}

export interface PackageDetail extends PackageCard {
  description: string | null;
  kitchen: boolean;
  cookReady: boolean;
  groupSizeMin: number;
  groupSizeMax: number;
  itinerary: PackageDay[];
  included: string[];
  excluded: string[];
  departures: Array<{
    id: string | null;
    startDate: string;
    endDate: string;
    priceAmount: number;
    seatsAvailable: number;
  }>;
  /** green / amber / red counts across every meal in the itinerary. */
  compliance: { green: number; amber: number; red: number };
}

/**
 * Everything one package page needs.
 *
 * The per-meal compliance rating is the product's whole claim, so it is loaded
 * here rather than summarised — a traveller who cannot see which meal is amber
 * has no reason to believe the badge.
 */
export async function getPackageBySlug(slug: string): Promise<PackageDetail | null> {
  if (!isCatalogueCircuitOpen()) {
    try {
      const fromDb = await getPackageBySlugFromDb(slug);
      if (fromDb) return fromDb;
    } catch (err) {
      console.warn("[package] catalogue unavailable, using itinerary fallback", err);
      tripCatalogueCircuit();
    }
  }
  // Homepage cards fall back to dictionary slugs when Neon has no package rows.
  // The detail page must do the same, otherwise "View itinerary" 404s.
  return getFallbackPackageBySlug(slug);
}

async function getPackageBySlugFromDb(slug: string): Promise<PackageDetail | null> {
  const [row] = await db.select().from(pkg).where(and(eq(pkg.slug, slug), eq(pkg.status, "published"))).limit(1);
  if (!row) return null;

  const [cards, days, inclusions, departures] = await Promise.all([
    listPackageCards({ limit: 100 }),
    db
      .select()
      .from(packageDay)
      .where(eq(packageDay.packageId, row.id))
      .orderBy(asc(packageDay.dayNumber)),
    db
      .select()
      .from(packageInclusion)
      .where(eq(packageInclusion.packageId, row.id))
      .orderBy(asc(packageInclusion.sortOrder)),
    db
      .select({
        id: departure.id,
        startDate: departure.startDate,
        endDate: departure.endDate,
        priceAmount: departure.priceAmount,
        seatsAvailable: sql<number>`${departure.seatsTotal} - ${departure.seatsHeld} - ${departure.seatsBooked}`,
      })
      .from(departure)
      .where(
        and(
          eq(departure.packageId, row.id),
          eq(departure.status, "open"),
          sql`${departure.startDate} >= current_date`,
          sql`${departure.seatsTotal} - ${departure.seatsHeld} - ${departure.seatsBooked} > 0`
        )
      )
      .orderBy(asc(departure.startDate))
      .limit(8),
  ]);

  const card = cards.find((c) => c.id === row.id);
  if (!card) return null;

  const dayIds = days.map((d) => d.id);
  const meals = dayIds.length
    ? await db.select().from(packageDayMeal).where(inArray(packageDayMeal.packageDayId, dayIds))
    : [];

  const mealsByDay = new Map<string, typeof meals>();
  for (const m of meals) {
    const list = mealsByDay.get(m.packageDayId) ?? [];
    list.push(m);
    mealsByDay.set(m.packageDayId, list);
  }

  const ORDER = { breakfast: 0, lunch: 1, dinner: 2 } as const;
  const compliance = { green: 0, amber: 0, red: 0 };
  for (const m of meals) compliance[m.complianceRating] += 1;

  return {
    ...card,
    description: row.description,
    kitchen: row.kitchen,
    cookReady: row.cookReady,
    groupSizeMin: row.groupSizeMin,
    groupSizeMax: row.groupSizeMax,
    itinerary: days.map((d) => ({
      dayNumber: d.dayNumber,
      title: d.title,
      summary: d.summary,
      stayArea: d.stayArea,
      transportNote: d.transportNote,
      meals: (mealsByDay.get(d.id) ?? [])
        .sort((a, b) => ORDER[a.meal] - ORDER[b.meal])
        .map((m) => ({
          meal: m.meal,
          description: m.description,
          complianceRating: m.complianceRating,
          note: m.note,
        })),
    })),
    included: inclusions.filter((i) => i.kind === "included").map((i) => i.label),
    excluded: inclusions.filter((i) => i.kind === "excluded").map((i) => i.label),
    departures: departures.map((d) => ({ ...d, seatsAvailable: Number(d.seatsAvailable) })),
    compliance,
  };
}

const futureDate = (offsetDays: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

function meal(
  meal: PackageDayMeal["meal"],
  description: string,
  complianceRating: PackageDayMeal["complianceRating"],
  note: string | null = null
): PackageDayMeal {
  return { meal, description, complianceRating, note };
}

const fallbackPackages: PackageDetail[] = [
  {
    id: "fallback-sattvik-serenity",
    slug: "sattvik-serenity",
    name: "Sattvik Serenity",
    days: 6,
    nights: 5,
    tier: "premium",
    protocols: ["jain", "vegetarian"],
    basePriceAmount: 88_000 * 100,
    basePriceCurrency: "INR",
    heroImage: "/Asset/D-card-img2.png",
    blurb: "Premium partner itinerary for the Ramayana temple circuit with Jain food support, quality rides and comfortable stays.",
    languages: ["Hindi", "Gujarati", "English"],
    places: ["Ubud", "Tirta Empul", "Besakih", "Uluwatu", "Nusa Dua"],
    highlights: [
      "Premium partner option selected for stricter Jain handling",
      "Comfort stay, private guide and admin-reviewed vehicle plan",
      "Luxury car upgrade available only when selected",
    ],
    circuitKeys: ["ramayana", "culinary"],
    nextDeparture: { startDate: futureDate(28), priceAmount: 88_000 * 100, seatsAvailable: 14 },
    description:
      "A dummy-data premium partner plan for families who want temples, strict Jain food, comfortable stay standards and predictable rides.",
    kitchen: true,
    cookReady: true,
    groupSizeMin: 6,
    groupSizeMax: 24,
    itinerary: [
      {
        dayNumber: 1,
        title: "Arrival in Bali and Ubud check-in",
        summary: "Airport pickup, welcome briefing and a light Ubud evening.",
        stayArea: "Ubud",
        transportNote: "Private AC Innova or HiAce based on group size.",
        meals: [
          meal("breakfast", "In-flight or packed Indian breakfast", "amber", "Airline meal reconfirmed before ticketing."),
          meal("lunch", "Welcome Jain thali at verified Ubud restaurant", "green", "No onion, garlic or root vegetables."),
          meal("dinner", "Villa dinner prepared on separate Jain utensils", "green", "Cook support available for groups of 10+."),
        ],
      },
      {
        dayNumber: 2,
        title: "Tirta Empul, Ubud Palace and local market",
        summary: "Temple morning, relaxed shopping and early dinner.",
        stayArea: "Ubud",
        transportNote: "Senior-friendly temple routing with shorter walking stretches.",
        meals: [
          meal("breakfast", "Poha, fruit and tea at the villa", "green"),
          meal("lunch", "Gujarati lunch near Ubud Palace", "green", "Kitchen confirmed before departure."),
          meal("dinner", "Indian vegetarian buffet at resort", "amber", "Separate service line required."),
        ],
      },
      {
        dayNumber: 3,
        title: "Besakih temple and East Bali drive",
        summary: "A full circuit day with rest stops, photo pauses and verified meal routing.",
        stayArea: "Ubud",
        transportNote: "Premium van or luxury car upgrade available.",
        meals: [
          meal("breakfast", "Early Jain breakfast box", "green", "Packed before temple departure."),
          meal("lunch", "Packed Jain lunch on the route", "green", "Avoids uncertain kitchens near the temple."),
          meal("dinner", "Satvik dinner in Ubud", "green", "Dedicated vegetarian partner."),
        ],
      },
      {
        dayNumber: 4,
        title: "Rice terraces, spa time and craft village",
        summary: "A lighter day after the long temple route, with enough time for rest.",
        stayArea: "Ubud",
        transportNote: "Half-day car hire with driver on standby.",
        meals: [
          meal("breakfast", "Villa breakfast with Jain upma and fruit", "green"),
          meal("lunch", "Tegallalang shared-kitchen warung", "red", "Substituted with a Jain-capable Ubud restaurant."),
          meal("dinner", "Private villa dinner", "green", "Separate prep surface."),
        ],
      },
      {
        dayNumber: 5,
        title: "Uluwatu temple, Kecak and Nusa Dua stay",
        summary: "Move south, check into a beach-side stay and finish with the Kecak sunset show.",
        stayArea: "Nusa Dua",
        transportNote: "Comfort van included; luxury car upgrade on request.",
        meals: [
          meal("breakfast", "Ubud breakfast before checkout", "green"),
          meal("lunch", "South Bali Indian vegetarian restaurant", "amber", "Jain items pre-ordered."),
          meal("dinner", "Late Jain dinner after Kecak", "green", "Reserved timing."),
        ],
      },
      {
        dayNumber: 6,
        title: "Beach morning and airport departure",
        summary: "Quiet breakfast, optional beach walk, airport transfer and departure support.",
        stayArea: "Nusa Dua",
        transportNote: "Airport transfer with luggage vehicle if needed.",
        meals: [
          meal("breakfast", "Resort breakfast with Jain counter confirmation", "amber", "Admin must reconfirm before booking."),
          meal("lunch", "Packed vegetarian lunch if flight is late", "green"),
          meal("dinner", "In-flight meal", "amber", "Airline meal request required."),
        ],
      },
    ],
    included: ["Private airport transfers", "Premium partner stays", "Private vehicle and guide", "Jain meal planning", "Temple route support"],
    excluded: ["International flights", "Visa costs", "Personal shopping", "Luxury car upgrade unless selected"],
    departures: [
      { id: null, startDate: futureDate(28), endDate: futureDate(33), priceAmount: 88_000 * 100, seatsAvailable: 14 },
      { id: null, startDate: futureDate(56), endDate: futureDate(61), priceAmount: 94_000 * 100, seatsAvailable: 10 },
    ],
    compliance: { green: 13, amber: 4, red: 1 },
  },
  {
    id: "fallback-bali-veg-explorer",
    slug: "bali-veg-explorer",
    name: "Bali Veg Explorer",
    days: 5,
    nights: 4,
    tier: "economical",
    protocols: ["vegetarian", "jain"],
    basePriceAmount: 39_500 * 100,
    basePriceCurrency: "INR",
    heroImage: "/Asset/beaches.png",
    blurb: "Latest budget partner offer for first-time Bali groups needing vegetarian restaurants, a quality ride and a practical stay.",
    languages: ["Hindi", "English"],
    places: ["Kuta", "Ubud", "Uluwatu", "Tanah Lot"],
    highlights: [
      "Lower-cost partner offer for flexible groups",
      "Private car or van options instead of random taxi planning",
      "Vegetarian and Jain-capable food stops marked day by day",
    ],
    circuitKeys: ["culinary", "adventure"],
    nextDeparture: { startDate: futureDate(21), priceAmount: 39_500 * 100, seatsAvailable: 18 },
    description:
      "A dummy-data economical plan for travelers who want Bali highlights without premium pricing. Admin can replace this with selected partner rates.",
    kitchen: false,
    cookReady: true,
    groupSizeMin: 2,
    groupSizeMax: 30,
    itinerary: [
      {
        dayNumber: 1,
        title: "Arrival, Kuta check-in and sunset dinner",
        summary: "Meet your driver, check in and keep the first evening light.",
        stayArea: "Kuta",
        transportNote: "Airport pickup in private AC car or van.",
        meals: [
          meal("breakfast", "In-flight meal", "amber", "Airline meal request."),
          meal("lunch", "Arrival snacks and Indian tea", "green"),
          meal("dinner", "Vegetarian dinner near Kuta", "green", "Jain variant on request."),
        ],
      },
      {
        dayNumber: 2,
        title: "Water sports and Uluwatu Kecak",
        summary: "Tanjung Benoa activities, beach time and sunset Kecak show.",
        stayArea: "Kuta",
        transportNote: "Full-day private car with driver.",
        meals: [
          meal("breakfast", "Hotel breakfast with vegetarian counter", "amber", "Shared hotel kitchen."),
          meal("lunch", "Indian vegetarian lunch in Nusa Dua", "green"),
          meal("dinner", "Post-show thali dinner", "green", "Pre-booked table."),
        ],
      },
      {
        dayNumber: 3,
        title: "Ubud rice terraces and market day",
        summary: "Cultural Ubud route with rice terraces, local market and craft stops.",
        stayArea: "Ubud",
        transportNote: "Car or van transfer from Kuta to Ubud.",
        meals: [
          meal("breakfast", "Hotel breakfast", "amber", "Vegetarian selection checked."),
          meal("lunch", "Pure vegetarian Ubud restaurant", "green"),
          meal("dinner", "Simple Indian dinner at Ubud stay", "green", "No non-veg prep for group order."),
        ],
      },
      {
        dayNumber: 4,
        title: "Tanah Lot and shopping",
        summary: "Late start, temple sunset and local shopping with flexible meal timing.",
        stayArea: "Kuta",
        transportNote: "Private vehicle retained until dinner.",
        meals: [
          meal("breakfast", "Resort breakfast", "amber"),
          meal("lunch", "Vegetarian lunch box during shopping", "green"),
          meal("dinner", "Indian restaurant dinner after Tanah Lot", "green", "Jain order cutoff is 24 hours."),
        ],
      },
      {
        dayNumber: 5,
        title: "Souvenir stop and departure",
        summary: "Checkout, souvenir stop and airport transfer.",
        stayArea: "Flight home",
        transportNote: "Airport drop included.",
        meals: [
          meal("breakfast", "Hotel breakfast", "amber"),
          meal("lunch", "Packed vegetarian meal", "green"),
          meal("dinner", "In-flight meal", "amber", "Airline meal request."),
        ],
      },
    ],
    included: ["4 nights stay", "Private airport transfers", "Daily private ride", "Selected vegetarian meals", "Basic guide coordination"],
    excluded: ["Flights", "Visa", "Water-sport ticket upgrades", "Luxury car upgrade"],
    departures: [
      { id: null, startDate: futureDate(21), endDate: futureDate(25), priceAmount: 39_500 * 100, seatsAvailable: 18 },
      { id: null, startDate: futureDate(49), endDate: futureDate(53), priceAmount: 42_500 * 100, seatsAvailable: 16 },
    ],
    compliance: { green: 10, amber: 5, red: 0 },
  },
  {
    id: "fallback-active-bali",
    slug: "active-bali",
    name: "Active Bali",
    days: 5,
    nights: 4,
    tier: "comfort",
    protocols: ["vegetarian", "vegan"],
    basePriceAmount: 47_500 * 100,
    basePriceCurrency: "INR",
    heroImage: "/Asset/adventure.png",
    blurb: "Adventure-focused partner offer with rafting, sunrise, Nusa Penida and vegan or vegetarian meal planning.",
    languages: ["Hindi", "English"],
    places: ["Ayung River", "Mount Batur", "Nusa Penida"],
    highlights: [
      "Comfort partner offer for active groups",
      "Protein-heavy vegetarian and vegan meals planned around activity days",
      "Private ride schedule designed to avoid wasted transfer time",
    ],
    circuitKeys: ["adventure"],
    nextDeparture: { startDate: futureDate(35), priceAmount: 47_500 * 100, seatsAvailable: 12 },
    description: "A dummy-data adventure plan for active travelers who want clean food, comfortable transfers and budget clarity.",
    kitchen: false,
    cookReady: false,
    groupSizeMin: 2,
    groupSizeMax: 18,
    itinerary: [
      {
        dayNumber: 1,
        title: "Arrival and Seminyak recovery evening",
        summary: "Airport pickup, check-in and early dinner before activity days.",
        stayArea: "Seminyak",
        transportNote: "Private car or van based on group size.",
        meals: [
          meal("breakfast", "In-flight meal", "amber", "Pre-select veg or vegan."),
          meal("lunch", "Arrival snack box", "green"),
          meal("dinner", "Vegetarian or vegan dinner in Seminyak", "green"),
        ],
      },
      {
        dayNumber: 2,
        title: "Ayung rafting and ATV trail",
        summary: "Action day with rafting, ATV and recovery meal timing.",
        stayArea: "Ubud",
        transportNote: "Full-day private vehicle with wet-bag space.",
        meals: [
          meal("breakfast", "High-energy breakfast at hotel", "amber", "Vegan on request."),
          meal("lunch", "Packed vegetarian lunch after rafting", "green"),
          meal("dinner", "Ubud plant-forward dinner", "green"),
        ],
      },
      {
        dayNumber: 3,
        title: "Mount Batur sunrise and hot springs",
        summary: "Early trek, hot springs and slow afternoon.",
        stayArea: "Ubud",
        transportNote: "Pre-dawn pickup with driver rest rules.",
        meals: [
          meal("breakfast", "Packed trek breakfast", "green", "No egg for vegetarian groups."),
          meal("lunch", "Post-trek vegetarian meal", "amber", "Shared mountain kitchen."),
          meal("dinner", "Indian dinner in Ubud", "green"),
        ],
      },
      {
        dayNumber: 4,
        title: "Nusa Penida day trip",
        summary: "Island viewpoints and beach time with a packed food plan.",
        stayArea: "Seminyak",
        transportNote: "Car, fast boat and island vehicle coordinated together.",
        meals: [
          meal("breakfast", "Early hotel breakfast", "amber"),
          meal("lunch", "Packed vegan or vegetarian lunch", "green", "Avoids uncertain island kitchens."),
          meal("dinner", "Return dinner at Indian restaurant", "green"),
        ],
      },
      {
        dayNumber: 5,
        title: "Beach morning and departure",
        summary: "Easy checkout day with airport transfer.",
        stayArea: "Flight home",
        transportNote: "Airport transfer included.",
        meals: [
          meal("breakfast", "Hotel breakfast", "amber"),
          meal("lunch", "Vegetarian lunch before airport", "green"),
          meal("dinner", "In-flight meal", "amber"),
        ],
      },
    ],
    included: ["4 nights stay", "Private transport", "Rafting coordination", "Batur sunrise coordination", "Meal planning"],
    excluded: ["Flights", "Visa", "Premium activity upgrades", "Personal equipment"],
    departures: [
      { id: null, startDate: futureDate(35), endDate: futureDate(39), priceAmount: 47_500 * 100, seatsAvailable: 12 },
      { id: null, startDate: futureDate(63), endDate: futureDate(67), priceAmount: 51_000 * 100, seatsAvailable: 11 },
    ],
    compliance: { green: 9, amber: 6, red: 0 },
  },
];

export function getFallbackPackageBySlug(slug: string): PackageDetail | null {
  const found = fallbackPackages.find((item) => item.slug === slug);
  if (!found) return null;
  return {
    ...found,
    protocols: [...found.protocols],
    languages: found.languages ? [...found.languages] : null,
    places: [...found.places],
    highlights: [...found.highlights],
    circuitKeys: [...found.circuitKeys],
    nextDeparture: found.nextDeparture ? { ...found.nextDeparture } : null,
    itinerary: found.itinerary.map((day) => ({
      ...day,
      meals: day.meals.map((item) => ({ ...item })),
    })),
    included: [...found.included],
    excluded: [...found.excluded],
    departures: found.departures.map((item) => ({ ...item })),
    compliance: { ...found.compliance },
  };
}
