import {
  pgTable, uuid, text, integer, bigint, boolean, timestamp, index, date, jsonb, numeric, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { account, traveller } from "./identity";
import { circuit, pkg } from "./catalog";
import { vendor, serviceListing } from "./vendor";
import {
  tripStatus, tripVisibility, budgetBasis, protocol, tier, offerOrigin, offerStatus,
  bookingStatus, departureStatus, leadSource, leadStatus, itinerarySource,
} from "./enums";

/** Fixed departures. This is what the calendar reads. */
export const departure = pgTable(
  "departure",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    packageId: uuid("package_id").notNull().references(() => pkg.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    priceAmount: bigint("price_amount", { mode: "number" }).notNull(),
    priceCurrency: text("price_currency").notNull().default("INR"),
    seatsTotal: integer("seats_total").notNull(),
    seatsHeld: integer("seats_held").notNull().default(0),
    seatsBooked: integer("seats_booked").notNull().default(0),
    status: departureStatus("status").notNull().default("open"),
    isPeak: boolean("is_peak").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("departure_pkg_date_idx").on(t.packageId, t.startDate, t.status),
    check("departure_seats_sane", sql`${t.seatsHeld} + ${t.seatsBooked} <= ${t.seatsTotal}`),
  ]
);

/** Short-TTL hold taken at checkout so two people cannot take the last seat. */
export const seatHold = pgTable(
  "seat_hold",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departureId: uuid("departure_id").notNull().references(() => departure.id, { onDelete: "cascade" }),
    tripRequestId: uuid("trip_request_id").notNull(),
    seats: integer("seats").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("seat_hold_expiry_idx").on(t.expiresAt)]
);

/**
 * A trip request is both the planner output and, when published, the item that
 * providers bid on. Contact details live on `lead`, never on the board
 * projection.
 */
export const tripRequest = pgTable(
  "trip_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    travellerId: uuid("traveller_id").references(() => traveller.id, { onDelete: "set null" }),
    anonToken: text("anon_token"),
    circuitId: uuid("circuit_id").references(() => circuit.id, { onDelete: "set null" }),
    status: tripStatus("status").notNull().default("draft"),
    protocol: protocol("protocol").notNull(),
    tier: tier("tier"),
    groupSize: integer("group_size").notNull(),
    crewType: text("crew_type"),
    rooms: integer("rooms"),
    childrenAges: integer("children_ages").array(),
    fromDate: date("from_date"),
    toDate: date("to_date"),
    flexibleMonth: text("flexible_month"),
    nights: integer("nights"),
    departureCity: text("departure_city"),
    interests: text("interests").array(),
    kitchenRequired: boolean("kitchen_required").notNull().default(false),
    cookRequired: boolean("cook_required").notNull().default(false),
    preferredLanguage: text("preferred_language"),
    notes: text("notes"),

    // Posting to the provider board (spec §6.7)
    visibility: tripVisibility("visibility").notNull().default("private"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    bidsCloseAt: timestamp("bids_close_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closeReason: text("close_reason"),
    // Both nullable, independently — that is what makes the range open-ended.
    budgetMinAmount: bigint("budget_min_amount", { mode: "number" }),
    budgetMaxAmount: bigint("budget_max_amount", { mode: "number" }),
    budgetCurrency: text("budget_currency").default("INR"),
    budgetBasis: budgetBasis("budget_basis").default("unsure"),
    specialRequirements: text("special_requirements"),
    requirementTags: text("requirement_tags").array(),
    mobileVerified: boolean("mobile_verified").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("trip_traveller_status_idx").on(t.travellerId, t.status),
    // The request board — hottest read for every provider.
    index("trip_board_idx").on(t.visibility, t.status, t.bidsCloseAt),
    index("trip_board_filter_idx").on(t.protocol, t.groupSize),
    // An accompanying cook only makes sense for a real group. Enforced here so
    // application logic cannot be the only thing standing between us and a
    // promise we cannot keep.
    check("trip_cook_requires_group", sql`NOT ${t.cookRequired} OR ${t.groupSize} >= 10`),
    // Unverified demand can never reach the board.
    check("trip_publish_requires_verified_mobile",
      sql`${t.visibility} = 'private' OR ${t.mobileVerified}`),
  ]
);

export const requestInvite = pgTable("request_invite", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripRequestId: uuid("trip_request_id").notNull().references(() => tripRequest.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id").notNull().references(() => vendor.id, { onDelete: "cascade" }),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Powers the "4 providers viewing" signal, and detects scraping. */
export const requestBoardView = pgTable(
  "request_board_view",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripRequestId: uuid("trip_request_id").notNull().references(() => tripRequest.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id").notNull().references(() => vendor.id, { onDelete: "cascade" }),
    viewCount: integer("view_count").notNull().default(1),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("board_view_trip_idx").on(t.tripRequestId, t.vendorId)]
);

/** Contact details live here and are released only on booking confirmation. */
export const lead = pgTable(
  "lead",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripRequestId: uuid("trip_request_id").references(() => tripRequest.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => account.id, { onDelete: "set null" }),
    source: leadSource("source").notNull().default("web"),
    name: text("name"),
    email: text("email"),
    mobile: text("mobile"),
    whatsappOptin: boolean("whatsapp_optin").notNull().default(false),
    message: text("message"),
    // The enquiry form asks these four of every visitor, so they are columns
    // rather than prose inside `message`. A lead you cannot filter by protocol
    // or group size is a lead you cannot route.
    departureCity: text("departure_city"),
    groupSize: integer("group_size"),
    protocol: protocol("protocol"),
    travelMonth: text("travel_month"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    status: leadStatus("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lead_status_created_idx").on(t.status, t.createdAt)]
);

export const itinerary = pgTable("itinerary", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripRequestId: uuid("trip_request_id").notNull().unique().references(() => tripRequest.id, { onDelete: "cascade" }),
  source: itinerarySource("source").notNull().default("curated"),
  complianceChecked: boolean("compliance_checked").notNull().default(false),
  days: jsonb("days").notNull(),
  modelVersion: text("model_version"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A system match and a provider bid are the same row, told apart by `origin`,
 * so acceptance, booking, pricing and payout have exactly one code path.
 *
 * The provider sets `vendorNetAmount`. The platform derives `totalAmount`. A
 * provider can never set the traveller-facing price.
 */
export const offer = pgTable(
  "offer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripRequestId: uuid("trip_request_id").notNull().references(() => tripRequest.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id").references(() => vendor.id, { onDelete: "cascade" }),
    packageId: uuid("package_id").references(() => pkg.id, { onDelete: "set null" }),
    departureId: uuid("departure_id").references(() => departure.id, { onDelete: "set null" }),
    origin: offerOrigin("origin").notNull().default("system_match"),
    title: text("title").notNull(),
    summary: text("summary"),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
    vendorNetAmount: bigint("vendor_net_amount", { mode: "number" }),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }),
    currency: text("currency").notNull().default("INR"),
    pricePerPerson: bigint("price_per_person", { mode: "number" }),
    lineItems: jsonb("line_items"),
    inclusionsDelta: jsonb("inclusions_delta"),
    dayPlan: jsonb("day_plan"),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    status: offerStatus("status").notNull().default("draft"),
    declineReason: text("decline_reason"),
    rank: integer("rank"),
    score: integer("score"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("offer_trip_rank_idx").on(t.tripRequestId, t.rank),
    index("offer_vendor_status_idx").on(t.vendorId, t.status, t.submittedAt),
  ]
);

/** Bid-spam control, tiered by verification age and rating. */
export const proposalQuota = pgTable("proposal_quota", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().unique().references(() => vendor.id, { onDelete: "cascade" }),
  maxActive: integer("max_active").notNull().default(5),
  used: integer("used").notNull().default(0),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull().defaultNow(),
});

export const messageThread = pgTable("message_thread", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripRequestId: uuid("trip_request_id").references(() => tripRequest.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id").references(() => vendor.id, { onDelete: "cascade" }),
  bookingId: uuid("booking_id"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Pre-booking both sides see `bodyMasked` only — phone numbers, emails and URLs
 * stripped. Without this the two parties meet on the board and close on
 * WhatsApp, and the platform earns nothing.
 */
export const message = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id").notNull().references(() => messageThread.id, { onDelete: "cascade" }),
    senderAccountId: uuid("sender_account_id").references(() => account.id, { onDelete: "set null" }),
    bodyRaw: text("body_raw").notNull(),
    bodyMasked: text("body_masked").notNull(),
    contactAttemptDetected: boolean("contact_attempt_detected").notNull().default(false),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("message_thread_sent_idx").on(t.threadId, t.sentAt)]
);

export const booking = pgTable(
  "booking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    tripRequestId: uuid("trip_request_id").notNull().references(() => tripRequest.id, { onDelete: "restrict" }),
    offerId: uuid("offer_id").references(() => offer.id, { onDelete: "set null" }),
    travellerId: uuid("traveller_id").references(() => traveller.id, { onDelete: "set null" }),
    packageId: uuid("package_id").references(() => pkg.id, { onDelete: "set null" }),
    departureId: uuid("departure_id").references(() => departure.id, { onDelete: "set null" }),
    vendorId: uuid("vendor_id").references(() => vendor.id, { onDelete: "set null" }),
    pax: integer("pax").notNull(),
    rooms: integer("rooms"),
    // Always recomputed server-side. The client never sends an amount.
    grossAmount: bigint("gross_amount", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("INR"),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }),
    commissionAmount: bigint("commission_amount", { mode: "number" }),
    netAmount: bigint("net_amount", { mode: "number" }),
    status: bookingStatus("status").notNull().default("pending_payment"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("booking_traveller_status_idx").on(t.travellerId, t.status),
    index("booking_vendor_status_idx").on(t.vendorId, t.status),
  ]
);

export const bookingTraveller = pgTable("booking_traveller", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => booking.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  // Encrypted at the application layer before it ever reaches this column.
  passportNumberEnc: text("passport_number_enc"),
  passportExpiry: date("passport_expiry"),
  dietaryNotes: text("dietary_notes"),
  isLead: boolean("is_lead").notNull().default(false),
});

export const bookingDocument = pgTable("booking_document", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => booking.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  fileUrl: text("file_url").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Verified-booking-gated only. No review without a completed booking. */
export const review = pgTable(
  "review",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").notNull().unique().references(() => booking.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id").references(() => vendor.id, { onDelete: "cascade" }),
    packageId: uuid("package_id").references(() => pkg.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    foodComplianceKept: boolean("food_compliance_kept"),
    comment: text("comment"),
    published: boolean("published").notNull().default(false),
    moderatedBy: uuid("moderated_by").references(() => account.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("review_vendor_idx").on(t.vendorId, t.published),
    check("review_rating_range", sql`${t.rating} BETWEEN 1 AND 5`),
  ]
);

/** Listings chosen on a booking. */
export const bookingListing = pgTable("booking_listing", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => booking.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => serviceListing.id, { onDelete: "restrict" }),
  priceSnapshot: bigint("price_snapshot", { mode: "number" }).notNull(),
});
