CREATE TYPE "public"."account_role" AS ENUM('traveller', 'vendor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."availability_status" AS ENUM('open', 'held', 'booked', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."budget_basis" AS ENUM('per_person', 'total', 'unsure');--> statement-breakpoint
CREATE TYPE "public"."circuit_key" AS ENUM('ramayana', 'adventure', 'culinary', 'artistic', 'wellness');--> statement-breakpoint
CREATE TYPE "public"."compliance_rating" AS ENUM('green', 'amber', 'red');--> statement-breakpoint
CREATE TYPE "public"."departure_status" AS ENUM('open', 'filling', 'sold_out', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."departure_type" AS ENUM('fixed', 'on_request', 'private');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('business_licence', 'tax_id', 'insurance', 'photo_id', 'kitchen_certificate');--> statement-breakpoint
CREATE TYPE "public"."guarantee_level" AS ENUM('certified', 'capable', 'on_request', 'not_supported');--> statement-breakpoint
CREATE TYPE "public"."itinerary_source" AS ENUM('ai', 'curated', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."kitchen_type" AS ENUM('dedicated_veg', 'separate_line', 'shared');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('web', 'planner', 'whatsapp', 'package_page', 'partner_referral');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'quoted', 'converted', 'lost');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'pending_review', 'active', 'paused', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."meal_slot" AS ENUM('breakfast', 'lunch', 'dinner');--> statement-breakpoint
CREATE TYPE "public"."occupancy" AS ENUM('single', 'double', 'triple', 'child');--> statement-breakpoint
CREATE TYPE "public"."offer_origin" AS ENUM('system_match', 'vendor_bid');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('draft', 'sent', 'viewed', 'shortlisted', 'revision_requested', 'accepted', 'declined', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('login', 'signup', 'publish_request');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('per_person', 'per_day', 'per_group', 'per_night', 'per_trip');--> statement-breakpoint
CREATE TYPE "public"."protocol" AS ENUM('jain', 'vegetarian', 'vegan');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('economical', 'comfort', 'premium');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('draft', 'submitted', 'quoted', 'booked', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."trip_visibility" AS ENUM('private', 'open_to_verified', 'invite_only');--> statement-breakpoint
CREATE TYPE "public"."vendor_type" AS ENUM('restaurant', 'accommodation', 'transport', 'guide', 'cook', 'produce', 'artisan', 'activity_operator', 'tour_agency');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('draft', 'pending', 'in_review', 'verified', 'rejected', 'suspended');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"mobile" text,
	"role" "account_role" DEFAULT 'traveller' NOT NULL,
	"status" "account_status" DEFAULT 'active' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"mobile_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_email_unique" UNIQUE("email"),
	CONSTRAINT "account_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"details" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"identifier" text NOT NULL,
	"code_hash" text NOT NULL,
	"purpose" "otp_purpose" DEFAULT 'login' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "traveller" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"full_name" text,
	"home_city" text,
	"default_protocol" text,
	"preferred_language" text DEFAULT 'en',
	"whatsapp_optin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "traveller_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "circuit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" "circuit_key" NOT NULL,
	"name" text NOT NULL,
	"blurb" text,
	"story" text,
	"hero_image" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "circuit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "package_circuit" (
	"package_id" uuid NOT NULL,
	"circuit_id" uuid NOT NULL,
	CONSTRAINT "package_circuit_package_id_circuit_id_pk" PRIMARY KEY("package_id","circuit_id")
);
--> statement-breakpoint
CREATE TABLE "package_day" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"stay_area" text,
	"transport_note" text
);
--> statement-breakpoint
CREATE TABLE "package_day_meal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_day_id" uuid NOT NULL,
	"meal" "meal_slot" NOT NULL,
	"description" text NOT NULL,
	"compliance_rating" "compliance_rating" DEFAULT 'amber' NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "package_day_place" (
	"package_day_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	CONSTRAINT "package_day_place_package_day_id_place_id_pk" PRIMARY KEY("package_day_id","place_id")
);
--> statement-breakpoint
CREATE TABLE "package_highlight" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"text" text NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_inclusion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"kind" text DEFAULT 'included' NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"label" text NOT NULL,
	"detail" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_place" (
	"package_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "package_place_package_id_place_id_pk" PRIMARY KEY("package_id","place_id")
);
--> statement-breakpoint
CREATE TABLE "package_price_tier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"occupancy" "occupancy" NOT NULL,
	"amount" bigint NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"days" integer NOT NULL,
	"nights" integer NOT NULL,
	"tier" "tier" DEFAULT 'comfort' NOT NULL,
	"protocols" "protocol"[] NOT NULL,
	"group_size_min" integer DEFAULT 1 NOT NULL,
	"group_size_max" integer DEFAULT 30 NOT NULL,
	"base_price_amount" bigint NOT NULL,
	"base_price_currency" text DEFAULT 'INR' NOT NULL,
	"price_unit" "price_unit" DEFAULT 'per_person' NOT NULL,
	"hero_image" text,
	"gallery" text[],
	"blurb" text,
	"description" text,
	"kitchen" boolean DEFAULT false NOT NULL,
	"cook_ready" boolean DEFAULT false NOT NULL,
	"languages" text[],
	"departure_type" "departure_type" DEFAULT 'fixed' NOT NULL,
	"status" "package_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "place" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"area" text,
	"region" text DEFAULT 'bali' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_of_interest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circuit_id" uuid NOT NULL,
	"place_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"typical_duration_minutes" integer,
	"image" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" "availability_status" DEFAULT 'open' NOT NULL,
	"price_override_amount" bigint,
	"hold_expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "blackout_date" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"scope_id" uuid,
	"date" date NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "listing_circuit" (
	"listing_id" uuid NOT NULL,
	"circuit_id" uuid NOT NULL,
	CONSTRAINT "listing_circuit_listing_id_circuit_id_pk" PRIMARY KEY("listing_id","circuit_id")
);
--> statement-breakpoint
CREATE TABLE "listing_compliance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"protocol" "protocol" NOT NULL,
	"guarantee_level" "guarantee_level" DEFAULT 'on_request' NOT NULL,
	"rating" "compliance_rating" DEFAULT 'amber' NOT NULL,
	"kitchen_type" "kitchen_type",
	"evidence_url" text,
	"evidence_notes" text,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_listing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"service_type" "vendor_type" NOT NULL,
	"description" text,
	"area" text,
	"capacity_min" integer DEFAULT 1 NOT NULL,
	"capacity_max" integer DEFAULT 30 NOT NULL,
	"tier" "tier" DEFAULT 'comfort' NOT NULL,
	"price_amount" bigint NOT NULL,
	"price_currency" text DEFAULT 'INR' NOT NULL,
	"price_unit" "price_unit" DEFAULT 'per_person' NOT NULL,
	"images" text[],
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"business_name" text NOT NULL,
	"legal_name" text,
	"vendor_type" "vendor_type" NOT NULL,
	"base_area" text,
	"description" text,
	"logo" text,
	"cover_image" text,
	"whatsapp" text,
	"phone" text,
	"email" text,
	"website" text,
	"languages" text[],
	"verification_status" "verification_status" DEFAULT 'draft' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"rejection_reason" text,
	"commission_rate" numeric(5, 4) DEFAULT '0.15' NOT NULL,
	"rating_avg" numeric(3, 2),
	"rating_count" integer DEFAULT 0 NOT NULL,
	"response_time_minutes" integer,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_account_id_unique" UNIQUE("account_id"),
	CONSTRAINT "vendor_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "vendor_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"kind" "document_kind" NOT NULL,
	"file_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_highlight" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"text" text NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"approved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"trip_request_id" uuid NOT NULL,
	"offer_id" uuid,
	"traveller_id" uuid,
	"package_id" uuid,
	"departure_id" uuid,
	"vendor_id" uuid,
	"pax" integer NOT NULL,
	"rooms" integer,
	"gross_amount" bigint NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"commission_rate" numeric(5, 4),
	"commission_amount" bigint,
	"net_amount" bigint,
	"status" "booking_status" DEFAULT 'pending_payment' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "booking_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"file_url" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_listing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"price_snapshot" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_traveller" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"age" integer,
	"gender" text,
	"passport_number_enc" text,
	"passport_expiry" date,
	"dietary_notes" text,
	"is_lead" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"price_amount" bigint NOT NULL,
	"price_currency" text DEFAULT 'INR' NOT NULL,
	"seats_total" integer NOT NULL,
	"seats_held" integer DEFAULT 0 NOT NULL,
	"seats_booked" integer DEFAULT 0 NOT NULL,
	"status" "departure_status" DEFAULT 'open' NOT NULL,
	"is_peak" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departure_seats_sane" CHECK ("departure"."seats_held" + "departure"."seats_booked" <= "departure"."seats_total")
);
--> statement-breakpoint
CREATE TABLE "itinerary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_request_id" uuid NOT NULL,
	"source" "itinerary_source" DEFAULT 'curated' NOT NULL,
	"compliance_checked" boolean DEFAULT false NOT NULL,
	"days" jsonb NOT NULL,
	"model_version" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "itinerary_trip_request_id_unique" UNIQUE("trip_request_id")
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_request_id" uuid,
	"account_id" uuid,
	"source" "lead_source" DEFAULT 'web' NOT NULL,
	"name" text,
	"email" text,
	"mobile" text,
	"whatsapp_optin" boolean DEFAULT false NOT NULL,
	"message" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_account_id" uuid,
	"body_raw" text NOT NULL,
	"body_masked" text NOT NULL,
	"contact_attempt_detected" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "message_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_request_id" uuid,
	"vendor_id" uuid,
	"booking_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_request_id" uuid NOT NULL,
	"vendor_id" uuid,
	"package_id" uuid,
	"departure_id" uuid,
	"origin" "offer_origin" DEFAULT 'system_match' NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"total_amount" bigint NOT NULL,
	"vendor_net_amount" bigint,
	"commission_rate" numeric(5, 4),
	"currency" text DEFAULT 'INR' NOT NULL,
	"price_per_person" bigint,
	"line_items" jsonb,
	"inclusions_delta" jsonb,
	"day_plan" jsonb,
	"valid_until" timestamp with time zone,
	"status" "offer_status" DEFAULT 'draft' NOT NULL,
	"decline_reason" text,
	"rank" integer,
	"score" integer,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_quota" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"max_active" integer DEFAULT 5 NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"period_start" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_quota_vendor_id_unique" UNIQUE("vendor_id")
);
--> statement-breakpoint
CREATE TABLE "request_board_view" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_request_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"view_count" integer DEFAULT 1 NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_request_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"vendor_id" uuid,
	"package_id" uuid,
	"rating" integer NOT NULL,
	"food_compliance_kept" boolean,
	"comment" text,
	"published" boolean DEFAULT false NOT NULL,
	"moderated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "review_rating_range" CHECK ("review"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "seat_hold" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"departure_id" uuid NOT NULL,
	"trip_request_id" uuid NOT NULL,
	"seats" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"traveller_id" uuid,
	"anon_token" text,
	"circuit_id" uuid,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"protocol" "protocol" NOT NULL,
	"tier" "tier",
	"group_size" integer NOT NULL,
	"crew_type" text,
	"rooms" integer,
	"children_ages" integer[],
	"from_date" date,
	"to_date" date,
	"flexible_month" text,
	"nights" integer,
	"departure_city" text,
	"interests" text[],
	"kitchen_required" boolean DEFAULT false NOT NULL,
	"cook_required" boolean DEFAULT false NOT NULL,
	"preferred_language" text,
	"notes" text,
	"visibility" "trip_visibility" DEFAULT 'private' NOT NULL,
	"published_at" timestamp with time zone,
	"bids_close_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"close_reason" text,
	"budget_min_amount" bigint,
	"budget_max_amount" bigint,
	"budget_currency" text DEFAULT 'INR',
	"budget_basis" "budget_basis" DEFAULT 'unsure',
	"special_requirements" text,
	"requirement_tags" text[],
	"mobile_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_cook_requires_group" CHECK (NOT "trip_request"."cook_required" OR "trip_request"."group_size" >= 10),
	CONSTRAINT "trip_publish_requires_verified_mobile" CHECK ("trip_request"."visibility" = 'private' OR "trip_request"."mobile_verified")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_code" ADD CONSTRAINT "otp_code_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traveller" ADD CONSTRAINT "traveller_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_circuit" ADD CONSTRAINT "package_circuit_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_circuit" ADD CONSTRAINT "package_circuit_circuit_id_circuit_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_day" ADD CONSTRAINT "package_day_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_day_meal" ADD CONSTRAINT "package_day_meal_package_day_id_package_day_id_fk" FOREIGN KEY ("package_day_id") REFERENCES "public"."package_day"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_day_place" ADD CONSTRAINT "package_day_place_package_day_id_package_day_id_fk" FOREIGN KEY ("package_day_id") REFERENCES "public"."package_day"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_day_place" ADD CONSTRAINT "package_day_place_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_highlight" ADD CONSTRAINT "package_highlight_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_inclusion" ADD CONSTRAINT "package_inclusion_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_place" ADD CONSTRAINT "package_place_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_place" ADD CONSTRAINT "package_place_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_price_tier" ADD CONSTRAINT "package_price_tier_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_of_interest" ADD CONSTRAINT "point_of_interest_circuit_id_circuit_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_of_interest" ADD CONSTRAINT "point_of_interest_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_listing_id_service_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."service_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_circuit" ADD CONSTRAINT "listing_circuit_listing_id_service_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."service_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_circuit" ADD CONSTRAINT "listing_circuit_circuit_id_circuit_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_compliance" ADD CONSTRAINT "listing_compliance_listing_id_service_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."service_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_compliance" ADD CONSTRAINT "listing_compliance_verified_by_account_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_listing" ADD CONSTRAINT "service_listing_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_verified_by_account_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_document" ADD CONSTRAINT "vendor_document_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_document" ADD CONSTRAINT "vendor_document_reviewed_by_account_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_highlight" ADD CONSTRAINT "vendor_highlight_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_trip_request_id_trip_request_id_fk" FOREIGN KEY ("trip_request_id") REFERENCES "public"."trip_request"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_offer_id_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_traveller_id_traveller_id_fk" FOREIGN KEY ("traveller_id") REFERENCES "public"."traveller"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_departure_id_departure_id_fk" FOREIGN KEY ("departure_id") REFERENCES "public"."departure"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_document" ADD CONSTRAINT "booking_document_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_listing" ADD CONSTRAINT "booking_listing_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_listing" ADD CONSTRAINT "booking_listing_listing_id_service_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."service_listing"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_traveller" ADD CONSTRAINT "booking_traveller_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departure" ADD CONSTRAINT "departure_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary" ADD CONSTRAINT "itinerary_trip_request_id_trip_request_id_fk" FOREIGN KEY ("trip_request_id") REFERENCES "public"."trip_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_trip_request_id_trip_request_id_fk" FOREIGN KEY ("trip_request_id") REFERENCES "public"."trip_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_thread_id_message_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_account_id_account_id_fk" FOREIGN KEY ("sender_account_id") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_thread" ADD CONSTRAINT "message_thread_trip_request_id_trip_request_id_fk" FOREIGN KEY ("trip_request_id") REFERENCES "public"."trip_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_thread" ADD CONSTRAINT "message_thread_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_trip_request_id_trip_request_id_fk" FOREIGN KEY ("trip_request_id") REFERENCES "public"."trip_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_departure_id_departure_id_fk" FOREIGN KEY ("departure_id") REFERENCES "public"."departure"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_quota" ADD CONSTRAINT "proposal_quota_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_board_view" ADD CONSTRAINT "request_board_view_trip_request_id_trip_request_id_fk" FOREIGN KEY ("trip_request_id") REFERENCES "public"."trip_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_board_view" ADD CONSTRAINT "request_board_view_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_invite" ADD CONSTRAINT "request_invite_trip_request_id_trip_request_id_fk" FOREIGN KEY ("trip_request_id") REFERENCES "public"."trip_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_invite" ADD CONSTRAINT "request_invite_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_package_id_package_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."package"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_moderated_by_account_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_hold" ADD CONSTRAINT "seat_hold_departure_id_departure_id_fk" FOREIGN KEY ("departure_id") REFERENCES "public"."departure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_request" ADD CONSTRAINT "trip_request_traveller_id_traveller_id_fk" FOREIGN KEY ("traveller_id") REFERENCES "public"."traveller"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_request" ADD CONSTRAINT "trip_request_circuit_id_circuit_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuit"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_role_status_idx" ON "account" USING btree ("role","status");--> statement-breakpoint
CREATE INDEX "audit_account_created_idx" ON "audit_log" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_action_created_idx" ON "audit_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "otp_identifier_created_idx" ON "otp_code" USING btree ("identifier","created_at");--> statement-breakpoint
CREATE INDEX "otp_expires_idx" ON "otp_code" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "session_account_idx" ON "session" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "package_circuit_circuit_idx" ON "package_circuit" USING btree ("circuit_id","package_id");--> statement-breakpoint
CREATE INDEX "package_day_pkg_idx" ON "package_day" USING btree ("package_id","day_number");--> statement-breakpoint
CREATE INDEX "package_price_tier_pkg_idx" ON "package_price_tier" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "package_status_tier_idx" ON "package" USING btree ("status","tier");--> statement-breakpoint
CREATE INDEX "package_price_idx" ON "package" USING btree ("base_price_amount");--> statement-breakpoint
CREATE INDEX "place_region_area_idx" ON "place" USING btree ("region","area");--> statement-breakpoint
CREATE INDEX "availability_listing_date_idx" ON "availability" USING btree ("listing_id","date");--> statement-breakpoint
CREATE INDEX "blackout_scope_date_idx" ON "blackout_date" USING btree ("scope","scope_id","date");--> statement-breakpoint
CREATE INDEX "compliance_listing_protocol_idx" ON "listing_compliance" USING btree ("listing_id","protocol","rating");--> statement-breakpoint
CREATE INDEX "compliance_expiry_idx" ON "listing_compliance" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "listing_vendor_status_idx" ON "service_listing" USING btree ("vendor_id","status","active");--> statement-breakpoint
CREATE INDEX "listing_capacity_idx" ON "service_listing" USING btree ("capacity_min","capacity_max");--> statement-breakpoint
CREATE INDEX "vendor_status_type_idx" ON "vendor" USING btree ("verification_status","vendor_type");--> statement-breakpoint
CREATE INDEX "vendor_area_idx" ON "vendor" USING btree ("base_area");--> statement-breakpoint
CREATE INDEX "booking_traveller_status_idx" ON "booking" USING btree ("traveller_id","status");--> statement-breakpoint
CREATE INDEX "booking_vendor_status_idx" ON "booking" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "departure_pkg_date_idx" ON "departure" USING btree ("package_id","start_date","status");--> statement-breakpoint
CREATE INDEX "lead_status_created_idx" ON "lead" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "message_thread_sent_idx" ON "message" USING btree ("thread_id","sent_at");--> statement-breakpoint
CREATE INDEX "offer_trip_rank_idx" ON "offer" USING btree ("trip_request_id","rank");--> statement-breakpoint
CREATE INDEX "offer_vendor_status_idx" ON "offer" USING btree ("vendor_id","status","submitted_at");--> statement-breakpoint
CREATE INDEX "board_view_trip_idx" ON "request_board_view" USING btree ("trip_request_id","vendor_id");--> statement-breakpoint
CREATE INDEX "review_vendor_idx" ON "review" USING btree ("vendor_id","published");--> statement-breakpoint
CREATE INDEX "seat_hold_expiry_idx" ON "seat_hold" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "trip_traveller_status_idx" ON "trip_request" USING btree ("traveller_id","status");--> statement-breakpoint
CREATE INDEX "trip_board_idx" ON "trip_request" USING btree ("visibility","status","bids_close_at");--> statement-breakpoint
CREATE INDEX "trip_board_filter_idx" ON "trip_request" USING btree ("protocol","group_size");