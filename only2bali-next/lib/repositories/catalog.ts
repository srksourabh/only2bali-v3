import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
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
  protocol?: "jain" | "vegetarian" | "vegan";
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
  departures: Array<{ startDate: string; endDate: string; priceAmount: number; seatsAvailable: number }>;
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
