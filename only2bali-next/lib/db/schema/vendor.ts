import {
  pgTable, uuid, text, integer, bigint, boolean, timestamp, index, primaryKey, date, numeric,
} from "drizzle-orm/pg-core";
import { account } from "./identity";
import { circuit } from "./catalog";
import {
  vendorType, verificationStatus, listingStatus, tier, priceUnit, protocol,
  guaranteeLevel, complianceRating, kitchenType, availabilityStatus, documentKind,
} from "./enums";

export const vendor = pgTable(
  "vendor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id").notNull().unique().references(() => account.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    businessName: text("business_name").notNull(),
    legalName: text("legal_name"),
    vendorType: vendorType("vendor_type").notNull(),
    baseArea: text("base_area"),
    description: text("description"),
    logo: text("logo"),
    coverImage: text("cover_image"),
    whatsapp: text("whatsapp"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    languages: text("languages").array(),
    verificationStatus: verificationStatus("verification_status").notNull().default("draft"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => account.id, { onDelete: "set null" }),
    rejectionReason: text("rejection_reason"),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }).notNull().default("0.15"),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }),
    ratingCount: integer("rating_count").notNull().default(0),
    responseTimeMinutes: integer("response_time_minutes"),
    onboardingStep: integer("onboarding_step").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vendor_status_type_idx").on(t.verificationStatus, t.vendorType),
    index("vendor_area_idx").on(t.baseArea),
  ]
);

/**
 * The provider USP — "why this provider is best". Admin-moderated at
 * verification so a provider cannot self-award a claim the platform has not
 * checked.
 */
export const vendorHighlight = pgTable("vendor_highlight", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendor.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  approved: boolean("approved").notNull().default(false),
});

/** Incremental KYC: collect the minimum to activate, request the rest later. */
export const vendorDocument = pgTable("vendor_document", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendor.id, { onDelete: "cascade" }),
  kind: documentKind("kind").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => account.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceListing = pgTable(
  "service_listing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id").notNull().references(() => vendor.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    serviceType: vendorType("service_type").notNull(),
    description: text("description"),
    area: text("area"),
    capacityMin: integer("capacity_min").notNull().default(1),
    capacityMax: integer("capacity_max").notNull().default(30),
    tier: tier("tier").notNull().default("comfort"),
    priceAmount: bigint("price_amount", { mode: "number" }).notNull(),
    priceCurrency: text("price_currency").notNull().default("INR"),
    priceUnit: priceUnit("price_unit").notNull().default("per_person"),
    images: text("images").array(),
    status: listingStatus("status").notNull().default("draft"),
    active: boolean("active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("listing_vendor_status_idx").on(t.vendorId, t.status, t.active),
    index("listing_capacity_idx").on(t.capacityMin, t.capacityMax),
  ]
);

export const listingCircuit = pgTable(
  "listing_circuit",
  {
    listingId: uuid("listing_id").notNull().references(() => serviceListing.id, { onDelete: "cascade" }),
    circuitId: uuid("circuit_id").notNull().references(() => circuit.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.listingId, t.circuitId] })]
);

/**
 * The hard filter. A listing with no compliance row for a protocol is invisible
 * to matching on that protocol — it does not default to "unknown, show anyway",
 * which is exactly the bug the deleted FastAPI seed data had.
 *
 * Ratings expire. A lapsed row drops the listing out of matching rather than
 * quietly ageing into a stale guarantee.
 */
export const listingCompliance = pgTable(
  "listing_compliance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").notNull().references(() => serviceListing.id, { onDelete: "cascade" }),
    protocol: protocol("protocol").notNull(),
    guaranteeLevel: guaranteeLevel("guarantee_level").notNull().default("on_request"),
    rating: complianceRating("rating").notNull().default("amber"),
    kitchenType: kitchenType("kitchen_type"),
    evidenceUrl: text("evidence_url"),
    evidenceNotes: text("evidence_notes"),
    verifiedBy: uuid("verified_by").references(() => account.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("compliance_listing_protocol_idx").on(t.listingId, t.protocol, t.rating),
    index("compliance_expiry_idx").on(t.expiresAt),
  ]
);

export const availability = pgTable(
  "availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").notNull().references(() => serviceListing.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    status: availabilityStatus("status").notNull().default("open"),
    priceOverrideAmount: bigint("price_override_amount", { mode: "number" }),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
  },
  (t) => [index("availability_listing_date_idx").on(t.listingId, t.date)]
);

export const blackoutDate = pgTable(
  "blackout_date",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: text("scope").notNull(), // global | circuit | vendor | listing
    scopeId: uuid("scope_id"),
    date: date("date").notNull(),
    reason: text("reason"),
  },
  (t) => [index("blackout_scope_date_idx").on(t.scope, t.scopeId, t.date)]
);
