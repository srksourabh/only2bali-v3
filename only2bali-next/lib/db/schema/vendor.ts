import {
  pgTable, uuid, text, integer, bigint, boolean, timestamp, index, primaryKey, date, numeric, jsonb,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { account } from "./identity";
import { circuit } from "./catalog";
import {
  vendorType, verificationStatus, listingStatus, tier, priceUnit, protocol,
  guaranteeLevel, complianceRating, kitchenType, availabilityStatus, documentKind,
  mediaKind, providerContentStatus, payoutAccountStatus,
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
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    postalCode: text("postal_code"),
    country: text("country").notNull().default("Indonesia"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
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
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    postalCode: text("postal_code"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    capacityMin: integer("capacity_min").notNull().default(1),
    capacityMax: integer("capacity_max").notNull().default(30),
    tier: tier("tier").notNull().default("comfort"),
    priceAmount: bigint("price_amount", { mode: "number" }).notNull(),
    priceCurrency: text("price_currency").notNull().default("INR"),
    priceUnit: priceUnit("price_unit").notNull().default("per_person"),
    images: text("images").array(),
    serviceDetails: jsonb("service_details"),
    inclusions: text("inclusions").array(),
    exclusions: text("exclusions").array(),
    cancellationPolicy: text("cancellation_policy"),
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

export const vendorMedia = pgTable(
  "vendor_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id").notNull().references(() => vendor.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id").references(() => serviceListing.id, { onDelete: "cascade" }),
    kind: mediaKind("kind").notNull().default("photo"),
    fileUrl: text("file_url").notNull(),
    altText: text("alt_text"),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    approved: boolean("approved").notNull().default(false),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vendor_media_vendor_idx").on(t.vendorId, t.kind, t.approved),
    index("vendor_media_listing_idx").on(t.listingId, t.sortOrder),
  ]
);

export const vendorEvent = pgTable(
  "vendor_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id").notNull().references(() => vendor.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    area: text("area"),
    addressLine1: text("address_line1"),
    priceAmount: bigint("price_amount", { mode: "number" }),
    priceCurrency: text("price_currency").notNull().default("INR"),
    displayCurrency: text("display_currency").notNull().default("IDR"),
    capacity: integer("capacity"),
    images: text("images").array(),
    status: providerContentStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vendor_event_vendor_status_idx").on(t.vendorId, t.status, t.startsAt),
    index("vendor_event_board_idx").on(t.status, t.startsAt),
  ]
);

export const vendorPromotion = pgTable(
  "vendor_promotion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id").notNull().references(() => vendor.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id").references(() => serviceListing.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    offerCode: text("offer_code"),
    priceAmount: bigint("price_amount", { mode: "number" }),
    priceCurrency: text("price_currency").notNull().default("INR"),
    displayCurrency: text("display_currency").notNull().default("IDR"),
    terms: text("terms"),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    images: text("images").array(),
    status: providerContentStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vendor_promotion_vendor_status_idx").on(t.vendorId, t.status, t.validUntil),
    index("vendor_promotion_listing_idx").on(t.listingId),
  ]
);

export const vendorPayoutAccount = pgTable(
  "vendor_payout_account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id").notNull().unique().references(() => vendor.id, { onDelete: "cascade" }),
    accountHolderName: text("account_holder_name").notNull(),
    bankName: text("bank_name"),
    bankCountry: text("bank_country").notNull().default("Indonesia"),
    currency: text("currency").notNull().default("IDR"),
    gatewayContactId: text("gateway_contact_id"),
    gatewayFundAccountId: text("gateway_fund_account_id"),
    maskedAccount: text("masked_account"),
    upiId: text("upi_id"),
    status: payoutAccountStatus("status").notNull().default("pending"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("vendor_payout_status_idx").on(t.status, t.createdAt)]
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

/**
 * A vendor's first contact, before they have an account.
 *
 * `vendor.account_id` is NOT NULL by design — a real provider record belongs to
 * someone who has signed in and been verified. An application arrives from an
 * anonymous form, so it cannot be a `vendor` row yet, and it must not create an
 * unverified account as a side effect of submitting a form. It lands here and is
 * promoted by an admin once the business is real.
 */
export const vendorApplication = pgTable(
  "vendor_application",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessName: text("business_name").notNull(),
    /** The form's own label, not the `vendor_type` enum — the two do not map
     *  one to one, and losing what the applicant actually said helps nobody. */
    businessType: text("business_type").notNull(),
    baseArea: text("base_area").notNull(),
    cuisine: text("cuisine"),
    capabilities: text("capabilities").array().notNull(),
    languages: text("languages").array(),
    priceBand: text("price_band"),
    whatsapp: text("whatsapp").notNull(),
    email: text("email"),
    availability: text("availability"),
    notes: text("notes"),
    status: verificationStatus("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => account.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    /** Kept for abuse tracing only. */
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("vendor_application_status_idx").on(t.status, t.createdAt)]
);
