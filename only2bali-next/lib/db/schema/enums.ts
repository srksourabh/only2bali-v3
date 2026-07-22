import { pgEnum } from "drizzle-orm/pg-core";

export const accountRole = pgEnum("account_role", ["traveller", "vendor", "admin"]);
export const accountStatus = pgEnum("account_status", ["active", "suspended", "deleted"]);

export const protocol = pgEnum("protocol", ["jain", "vegetarian", "vegan"]);

/** Display label only. Never a price boundary — pricing is open-ended (spec §2.3). */
export const tier = pgEnum("tier", ["economical", "comfort", "premium"]);

export const circuitKey = pgEnum("circuit_key", [
  "ramayana",
  "adventure",
  "culinary",
  "artistic",
  "wellness",
]);

export const packageStatus = pgEnum("package_status", ["draft", "published", "archived"]);
export const priceUnit = pgEnum("price_unit", [
  "per_person",
  "per_day",
  "per_group",
  "per_night",
  "per_trip",
]);
export const occupancy = pgEnum("occupancy", ["single", "double", "triple", "child"]);
export const departureType = pgEnum("departure_type", ["fixed", "on_request", "private"]);
export const mealSlot = pgEnum("meal_slot", ["breakfast", "lunch", "dinner"]);

/** The colour-coded compliance rating. Always rendered with icon and text too. */
export const complianceRating = pgEnum("compliance_rating", ["green", "amber", "red"]);
export const guaranteeLevel = pgEnum("guarantee_level", [
  "certified",
  "capable",
  "on_request",
  "not_supported",
]);
export const kitchenType = pgEnum("kitchen_type", ["dedicated_veg", "separate_line", "shared"]);

export const vendorType = pgEnum("vendor_type", [
  "restaurant",
  "accommodation",
  "transport",
  "guide",
  "cook",
  "produce",
  "artisan",
  "activity_operator",
  "tour_agency",
]);
export const verificationStatus = pgEnum("verification_status", [
  "draft",
  "pending",
  "in_review",
  "verified",
  "rejected",
  "suspended",
]);
export const listingStatus = pgEnum("listing_status", [
  "draft",
  "pending_review",
  "active",
  "paused",
  "rejected",
]);

export const tripStatus = pgEnum("trip_status", [
  "draft",
  "submitted",
  "quoted",
  "booked",
  "expired",
  "cancelled",
]);
export const tripVisibility = pgEnum("trip_visibility", [
  "private",
  "open_to_verified",
  "invite_only",
]);
export const budgetBasis = pgEnum("budget_basis", ["per_person", "total", "unsure"]);

/** A system match and a provider bid are the same row, told apart by this. */
export const offerOrigin = pgEnum("offer_origin", ["system_match", "vendor_bid"]);
export const offerStatus = pgEnum("offer_status", [
  "draft",
  "sent",
  "viewed",
  "shortlisted",
  "revision_requested",
  "accepted",
  "declined",
  "withdrawn",
  "expired",
]);

export const bookingStatus = pgEnum("booking_status", [
  "pending_payment",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "refunded",
]);

export const availabilityStatus = pgEnum("availability_status", [
  "open",
  "held",
  "booked",
  "blocked",
]);
export const departureStatus = pgEnum("departure_status", [
  "open",
  "filling",
  "sold_out",
  "cancelled",
]);

export const leadSource = pgEnum("lead_source", [
  "web",
  "planner",
  "whatsapp",
  "package_page",
  "partner_referral",
]);
export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "quoted",
  "converted",
  "lost",
]);

export const itinerarySource = pgEnum("itinerary_source", ["ai", "curated", "hybrid"]);
export const otpPurpose = pgEnum("otp_purpose", ["login", "signup", "publish_request"]);
export const documentKind = pgEnum("document_kind", [
  "business_licence",
  "tax_id",
  "insurance",
  "photo_id",
  "kitchen_certificate",
]);
