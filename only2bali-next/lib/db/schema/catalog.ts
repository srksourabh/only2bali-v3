import {
  pgTable, uuid, text, integer, bigint, boolean, timestamp, index, primaryKey, doublePrecision,
} from "drizzle-orm/pg-core";
import {
  circuitKey, protocol, tier, packageStatus, priceUnit, occupancy, departureType,
  mealSlot, complianceRating,
} from "./enums";

/** The product spine. A traveller picks one of these first. */
export const circuit = pgTable("circuit", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: circuitKey("key").notNull().unique(),
  name: text("name").notNull(),
  blurb: text("blurb"),
  story: text("story"),
  heroImage: text("hero_image"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Normalised so a package's "places" are real rows, not free text. */
export const place = pgTable(
  "place",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    area: text("area"),
    region: text("region").notNull().default("bali"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("place_region_area_idx").on(t.region, t.area)]
);

export const pointOfInterest = pgTable("point_of_interest", {
  id: uuid("id").primaryKey().defaultRandom(),
  circuitId: uuid("circuit_id").notNull().references(() => circuit.id, { onDelete: "cascade" }),
  placeId: uuid("place_id").references(() => place.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  typicalDurationMinutes: integer("typical_duration_minutes"),
  image: text("image"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * Money is integer minor units (paise), never float. `tier` is a display label
 * only — price filtering is open-ended min/max, with no floor and no ceiling.
 */
export const pkg = pgTable(
  "package",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    days: integer("days").notNull(),
    nights: integer("nights").notNull(),
    tier: tier("tier").notNull().default("comfort"),
    protocols: protocol("protocols").array().notNull(),
    groupSizeMin: integer("group_size_min").notNull().default(1),
    groupSizeMax: integer("group_size_max").notNull().default(30),
    basePriceAmount: bigint("base_price_amount", { mode: "number" }).notNull(),
    basePriceCurrency: text("base_price_currency").notNull().default("INR"),
    priceUnit: priceUnit("price_unit").notNull().default("per_person"),
    heroImage: text("hero_image"),
    gallery: text("gallery").array(),
    blurb: text("blurb"),
    description: text("description"),
    kitchen: boolean("kitchen").notNull().default(false),
    cookReady: boolean("cook_ready").notNull().default(false),
    languages: text("languages").array(),
    departureType: departureType("departure_type").notNull().default("fixed"),
    status: packageStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("package_status_tier_idx").on(t.status, t.tier),
    index("package_price_idx").on(t.basePriceAmount),
  ]
);

export const packageCircuit = pgTable(
  "package_circuit",
  {
    packageId: uuid("package_id").notNull().references(() => pkg.id, { onDelete: "cascade" }),
    circuitId: uuid("circuit_id").notNull().references(() => circuit.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.packageId, t.circuitId] }),
    index("package_circuit_circuit_idx").on(t.circuitId, t.packageId),
  ]
);

/** "Places" on the package detail page. */
export const packagePlace = pgTable(
  "package_place",
  {
    packageId: uuid("package_id").notNull().references(() => pkg.id, { onDelete: "cascade" }),
    placeId: uuid("place_id").notNull().references(() => place.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.placeId] })]
);

/** "What they are offering" — and what they are not. */
export const packageInclusion = pgTable("package_inclusion", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageId: uuid("package_id").notNull().references(() => pkg.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("included"), // included | excluded
  category: text("category").notNull().default("other"),
  label: text("label").notNull(),
  detail: text("detail"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** The package USP — "why choose this package". Ordered benefit statements. */
export const packageHighlight = pgTable("package_highlight", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageId: uuid("package_id").notNull().references(() => pkg.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const packageDay = pgTable(
  "package_day",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    packageId: uuid("package_id").notNull().references(() => pkg.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    stayArea: text("stay_area"),
    transportNote: text("transport_note"),
  },
  (t) => [index("package_day_pkg_idx").on(t.packageId, t.dayNumber)]
);

export const packageDayPlace = pgTable(
  "package_day_place",
  {
    packageDayId: uuid("package_day_id").notNull().references(() => packageDay.id, { onDelete: "cascade" }),
    placeId: uuid("place_id").notNull().references(() => place.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.packageDayId, t.placeId] })]
);

/**
 * Per-meal compliance rating — the differentiator, in the schema rather than in
 * marketing copy. Rendered as colour plus icon plus text, never colour alone.
 */
export const packageDayMeal = pgTable("package_day_meal", {
  id: uuid("id").primaryKey().defaultRandom(),
  packageDayId: uuid("package_day_id").notNull().references(() => packageDay.id, { onDelete: "cascade" }),
  meal: mealSlot("meal").notNull(),
  description: text("description").notNull(),
  complianceRating: complianceRating("compliance_rating").notNull().default("amber"),
  note: text("note"),
});

export const packagePriceTier = pgTable(
  "package_price_tier",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    packageId: uuid("package_id").notNull().references(() => pkg.id, { onDelete: "cascade" }),
    occupancy: occupancy("occupancy").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("INR"),
  },
  (t) => [index("package_price_tier_pkg_idx").on(t.packageId)]
);
