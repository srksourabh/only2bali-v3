import type { Protocol } from "@/lib/protocols";
/**
 * Seeds circuits, places and the package catalogue.
 *
 * This is the migration of the old hardcoded `lib/catalog.ts` into Postgres,
 * expanded to the full field set: nights, places, inclusions, why-choose
 * highlights, structured integer prices, and day-by-day itineraries with a
 * per-meal compliance rating.
 *
 * Idempotent — safe to run repeatedly. Run with:
 *   DATABASE_URL=... npm run db:seed
 */
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  circuit, place, pkg, packageCircuit, packagePlace, packageInclusion,
  packageHighlight, packageDay, packageDayMeal, departure,
} from "./schema";

/** Rupees to paise. Money is integer minor units everywhere. */
const inr = (rupees: number) => rupees * 100;

const CIRCUITS = [
  { key: "ramayana" as const, name: "Ramayana", sortOrder: 1, heroImage: "/Asset/D-card-img2.png",
    blurb: "Besakih, Tirta Empul, Lempuyang and the Kecak fire dance at Uluwatu." },
  { key: "adventure" as const, name: "Adventure", sortOrder: 2, heroImage: "/Asset/adventure.png",
    blurb: "Ayung river, Mount Batur before dawn, Nusa Penida water." },
  { key: "culinary" as const, name: "Culinary", sortOrder: 3, heroImage: "/Asset/culinary.png",
    blurb: "Pure-veg kitchens, a cooking class, and warungs that cook to protocol." },
  { key: "artistic" as const, name: "Artistic", sortOrder: 4, heroImage: "/Asset/cultures.png",
    blurb: "Wood-carving, silver and batik, working alongside the artisans." },
];

const PLACES = [
  "Ubud", "Uluwatu", "Nusa Dua", "Kuta", "Seminyak", "Canggu", "Sanur", "Jimbaran",
  "Tegallalang", "Tirta Empul", "Besakih", "Lempuyang", "Tanah Lot", "Mount Batur",
  "Nusa Penida", "Ayung River", "Mas Village", "Celuk",
];

interface SeedPackage {
  slug: string;
  name: string;
  days: number;
  nights: number;
  tier: "economical" | "comfort" | "premium";
  protocols: Protocol[];
  priceRupees: number;
  heroImage: string;
  blurb: string;
  kitchen: boolean;
  cookReady: boolean;
  languages: string[];
  circuits: Array<(typeof CIRCUITS)[number]["key"]>;
  places: string[];
  highlights: string[];
  included: string[];
  excluded: string[];
  days_: Array<{
    title: string;
    stayArea?: string;
    meals: Array<{ meal: "breakfast" | "lunch" | "dinner"; description: string; rating: "green" | "amber" | "red" }>;
  }>;
}

const PACKAGES: SeedPackage[] = [
  {
    slug: "sattvik-serenity",
    name: "Sattvik Serenity",
    days: 6, nights: 5, tier: "premium",
    protocols: ["jain", "vegetarian"],
    priceRupees: 118000,
    heroImage: "/Asset/D-card-img2.png",
    blurb: "Ubud and Uluwatu in private villas with a Jain-protocol kitchen and an optional accompanying cook.",
    kitchen: true, cookReady: true,
    languages: ["Hindi", "Gujarati", "English"],
    circuits: ["ramayana"],
    places: ["Ubud", "Tirta Empul", "Uluwatu", "Nusa Dua"],
    highlights: [
      "Jain-protocol kitchen in the villa, cook optional",
      "Gujarati and Hindi-speaking guide throughout",
      "Temple mornings timed before the crowds",
    ],
    included: ["Private villa stay", "All meals to protocol", "Private transport", "Indian-language guide", "Temple entry fees"],
    excluded: ["International flights", "Visa on arrival", "Personal expenses", "Tips"],
    days_: [
      { title: "Arrival, villa check-in, welcome Jain thali", stayArea: "Ubud",
        meals: [
          { meal: "breakfast", description: "In-flight catering", rating: "amber" },
          { meal: "lunch", description: "Welcome refreshments at the villa", rating: "green" },
          { meal: "dinner", description: "Jain thali prepared in the villa kitchen", rating: "green" },
        ] },
      { title: "Tirta Empul holy springs and Ubud palace", stayArea: "Ubud",
        meals: [
          { meal: "breakfast", description: "Villa kitchen — Gujarati breakfast", rating: "green" },
          { meal: "lunch", description: "Sattvik By Nature, Ubud", rating: "green" },
          { meal: "dinner", description: "Villa kitchen — satvik dinner", rating: "green" },
        ] },
      { title: "Tegallalang rice terraces and a wellness afternoon", stayArea: "Ubud",
        meals: [
          { meal: "breakfast", description: "Villa kitchen — Gujarati thali", rating: "green" },
          { meal: "lunch", description: "Sattvik By Nature, Ubud", rating: "green" },
          { meal: "dinner", description: "Warung near Tegallalang — substituted for a Jain-capable kitchen", rating: "red" },
        ] },
      { title: "Uluwatu temple and the Kecak fire dance at sunset", stayArea: "Uluwatu",
        meals: [
          { meal: "breakfast", description: "Villa kitchen", rating: "green" },
          { meal: "lunch", description: "Packed protocol lunch for the cliff walk", rating: "green" },
          { meal: "dinner", description: "Private dinner after the Kecak performance", rating: "green" },
        ] },
      { title: "Nusa Dua beach day, satvik dinner", stayArea: "Nusa Dua",
        meals: [
          { meal: "breakfast", description: "Resort breakfast, dedicated veg counter", rating: "amber" },
          { meal: "lunch", description: "Beachfront Indian restaurant, verified", rating: "green" },
          { meal: "dinner", description: "Satvik farewell dinner", rating: "green" },
        ] },
      { title: "Departure", meals: [
          { meal: "breakfast", description: "Villa kitchen", rating: "green" },
          { meal: "lunch", description: "Airport — packed protocol meal", rating: "green" },
          { meal: "dinner", description: "In-flight catering", rating: "amber" },
        ] },
    ],
  },
  {
    slug: "bali-veg-explorer",
    name: "Bali Veg Explorer",
    days: 5, nights: 4, tier: "economical",
    protocols: ["vegetarian", "jain"],
    priceRupees: 58000,
    heroImage: "/Asset/beaches.png",
    blurb: "Value-packed group trip: Kuta, Ubud and water sports with verified Indian veg restaurants throughout.",
    kitchen: false, cookReady: true,
    languages: ["Hindi", "English"],
    circuits: ["adventure", "culinary"],
    places: ["Kuta", "Ubud", "Uluwatu"],
    highlights: [
      "Verified Indian veg restaurants on every travel day",
      "Water sports and Uluwatu Kecak included",
      "Built for first-time groups on a tighter budget",
    ],
    included: ["3-star hotel stay", "Daily breakfast and dinner", "Shared transport", "Hindi-speaking guide"],
    excluded: ["International flights", "Visa on arrival", "Lunches on free days", "Personal expenses"],
    days_: [
      { title: "Arrival and Kuta sunset", stayArea: "Kuta",
        meals: [
          { meal: "breakfast", description: "In-flight catering", rating: "amber" },
          { meal: "lunch", description: "Queen's of India, Kuta", rating: "green" },
          { meal: "dinner", description: "Hotel buffet, veg counter", rating: "amber" },
        ] },
      { title: "Water sports and Uluwatu", stayArea: "Kuta",
        meals: [
          { meal: "breakfast", description: "Hotel breakfast, veg counter", rating: "amber" },
          { meal: "lunch", description: "Packed veg lunch at the water sports centre", rating: "green" },
          { meal: "dinner", description: "Vinayak, Kuta", rating: "green" },
        ] },
      { title: "Ubud day trip and a veg warung lunch", stayArea: "Ubud",
        meals: [
          { meal: "breakfast", description: "Hotel breakfast", rating: "amber" },
          { meal: "lunch", description: "Sattvik By Nature, Ubud", rating: "green" },
          { meal: "dinner", description: "Punjabi Grill", rating: "green" },
        ] },
      { title: "Shopping and beach clubs with veg menus", stayArea: "Seminyak",
        meals: [
          { meal: "breakfast", description: "Hotel breakfast", rating: "amber" },
          { meal: "lunch", description: "Beach club, veg menu, shared kitchen", rating: "amber" },
          { meal: "dinner", description: "Darbar — separate 100% veg kitchen", rating: "green" },
        ] },
      { title: "Departure", meals: [
          { meal: "breakfast", description: "Hotel breakfast", rating: "amber" },
          { meal: "lunch", description: "Airport — packed veg meal", rating: "green" },
          { meal: "dinner", description: "In-flight catering", rating: "amber" },
        ] },
    ],
  },
  {
    slug: "active-bali",
    name: "Active Bali",
    days: 5, nights: 4, tier: "economical",
    protocols: ["vegetarian", "vegan"],
    priceRupees: 62000,
    heroImage: "/Asset/adventure.png",
    blurb: "Rafting, ATV, snorkelling and a volcano sunrise, with high-energy veg and vegan meal plans.",
    kitchen: false, cookReady: false,
    languages: ["Hindi", "English"],
    circuits: ["adventure"],
    places: ["Ayung River", "Mount Batur", "Nusa Penida", "Ubud"],
    highlights: [
      "High-protein veg and vegan meal plans for trek days",
      "Batur sunrise with a packed protocol breakfast",
      "Rafting, ATV and snorkelling in one week",
    ],
    included: ["Hotel stay", "All activity fees", "Private transport", "Trek guide"],
    excluded: ["International flights", "Visa on arrival", "Equipment hire", "Tips"],
    days_: [
      { title: "Arrival", stayArea: "Ubud",
        meals: [
          { meal: "breakfast", description: "In-flight catering", rating: "amber" },
          { meal: "lunch", description: "The Shady Shack, Canggu", rating: "green" },
          { meal: "dinner", description: "Hotel dinner, veg menu", rating: "amber" },
        ] },
      { title: "Ayung river rafting and ATV", stayArea: "Ubud",
        meals: [
          { meal: "breakfast", description: "High-protein veg breakfast", rating: "green" },
          { meal: "lunch", description: "Riverside packed lunch", rating: "green" },
          { meal: "dinner", description: "Sattvik By Nature, Ubud", rating: "green" },
        ] },
      { title: "Mount Batur sunrise trek and veg brunch", stayArea: "Ubud",
        meals: [
          { meal: "breakfast", description: "Packed pre-dawn protocol breakfast", rating: "green" },
          { meal: "lunch", description: "Post-trek veg brunch", rating: "green" },
          { meal: "dinner", description: "Hotel dinner", rating: "amber" },
        ] },
      { title: "Nusa Penida snorkelling", stayArea: "Nusa Penida",
        meals: [
          { meal: "breakfast", description: "Early hotel breakfast", rating: "amber" },
          { meal: "lunch", description: "Boat packed veg lunch", rating: "green" },
          { meal: "dinner", description: "Vegan kitchen, Canggu", rating: "green" },
        ] },
      { title: "Departure", meals: [
          { meal: "breakfast", description: "Hotel breakfast", rating: "amber" },
          { meal: "lunch", description: "Airport — packed veg meal", rating: "green" },
          { meal: "dinner", description: "In-flight catering", rating: "amber" },
        ] },
    ],
  },
];

/** Fixed departures for the next twelve months, roughly fortnightly. */
function departuresFor(nights: number, basePaise: number) {
  const out: Array<{ start: string; end: string; price: number; seats: number; peak: boolean }> = [];
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 21);

  for (let i = 0; i < 24; i++) {
    const s = new Date(start);
    s.setUTCDate(s.getUTCDate() + i * 15);
    const e = new Date(s);
    e.setUTCDate(e.getUTCDate() + nights);

    const month = s.getUTCMonth();
    // Indian outbound peaks: Dec-Jan, and the May-June school break.
    const peak = month === 11 || month === 0 || month === 4 || month === 5;
    out.push({
      start: s.toISOString().slice(0, 10),
      end: e.toISOString().slice(0, 10),
      price: peak ? Math.round(basePaise * 1.18) : basePaise,
      seats: 16,
      peak,
    });
  }
  return out;
}

export async function seed() {
  console.log("seeding…");

  const circuitIds = new Map<string, string>();
  for (const c of CIRCUITS) {
    const [row] = await db
      .insert(circuit)
      .values(c)
      .onConflictDoUpdate({ target: circuit.key, set: { name: c.name, blurb: c.blurb, heroImage: c.heroImage, sortOrder: c.sortOrder } })
      .returning({ id: circuit.id, key: circuit.key });
    circuitIds.set(row.key, row.id);
  }
  console.log(`  circuits: ${circuitIds.size}`);

  const placeIds = new Map<string, string>();
  for (const name of PLACES) {
    const [existing] = await db.select({ id: place.id }).from(place).where(eq(place.name, name)).limit(1);
    if (existing) {
      placeIds.set(name, existing.id);
      continue;
    }
    const [row] = await db.insert(place).values({ name, area: name, region: "bali" }).returning({ id: place.id });
    placeIds.set(name, row.id);
  }
  console.log(`  places: ${placeIds.size}`);

  for (const p of PACKAGES) {
    const [row] = await db
      .insert(pkg)
      .values({
        slug: p.slug, name: p.name, days: p.days, nights: p.nights, tier: p.tier,
        protocols: p.protocols, basePriceAmount: inr(p.priceRupees), basePriceCurrency: "INR",
        heroImage: p.heroImage, blurb: p.blurb, kitchen: p.kitchen, cookReady: p.cookReady,
        languages: p.languages, status: "published",
        groupSizeMin: 2, groupSizeMax: 30,
      })
      .onConflictDoUpdate({
        target: pkg.slug,
        set: { name: p.name, days: p.days, nights: p.nights, basePriceAmount: inr(p.priceRupees), status: "published" },
      })
      .returning({ id: pkg.id });

    const id = row.id;

    // Children are replaced wholesale so re-running does not duplicate them.
    await db.delete(packageCircuit).where(eq(packageCircuit.packageId, id));
    await db.delete(packagePlace).where(eq(packagePlace.packageId, id));
    await db.delete(packageInclusion).where(eq(packageInclusion.packageId, id));
    await db.delete(packageHighlight).where(eq(packageHighlight.packageId, id));
    await db.delete(packageDay).where(eq(packageDay.packageId, id));
    await db.delete(departure).where(eq(departure.packageId, id));

    await db.insert(packageCircuit).values(
      p.circuits.map((k) => ({ packageId: id, circuitId: circuitIds.get(k)! }))
    );
    await db.insert(packagePlace).values(
      p.places.map((name, i) => ({ packageId: id, placeId: placeIds.get(name)!, sortOrder: i }))
    );
    await db.insert(packageHighlight).values(
      p.highlights.map((text, i) => ({ packageId: id, text, sortOrder: i }))
    );
    await db.insert(packageInclusion).values([
      ...p.included.map((label, i) => ({ packageId: id, kind: "included", label, sortOrder: i })),
      ...p.excluded.map((label, i) => ({ packageId: id, kind: "excluded", label, sortOrder: i })),
    ]);

    for (const [i, d] of p.days_.entries()) {
      const [dayRow] = await db
        .insert(packageDay)
        .values({ packageId: id, dayNumber: i + 1, title: d.title, stayArea: d.stayArea })
        .returning({ id: packageDay.id });
      await db.insert(packageDayMeal).values(
        d.meals.map((m) => ({
          packageDayId: dayRow.id,
          meal: m.meal,
          description: m.description,
          complianceRating: m.rating,
        }))
      );
    }

    await db.insert(departure).values(
      departuresFor(p.nights, inr(p.priceRupees)).map((d) => ({
        packageId: id,
        startDate: d.start,
        endDate: d.end,
        priceAmount: d.price,
        seatsTotal: d.seats,
        isPeak: d.peak,
        status: "open" as const,
      }))
    );

    console.log(`  package: ${p.slug} (${p.days}d/${p.nights}n, ${p.days_.length} days, 24 departures)`);
  }

  console.log("seed complete");
}

// Executed directly by `npm run db:seed`.
const entrypoint = process.argv[1]?.replace(/\\/g, "/");
if (entrypoint?.endsWith("/lib/db/seed.ts") || entrypoint?.endsWith("lib/db/seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
