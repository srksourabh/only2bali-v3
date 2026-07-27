CREATE TYPE "public"."disbursement_status" AS ENUM('pending', 'approved', 'processing', 'paid', 'failed', 'held');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('photo', 'menu', 'licence', 'gallery', 'cover');--> statement-breakpoint
CREATE TYPE "public"."payout_account_status" AS ENUM('pending', 'verified', 'rejected', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."provider_content_status" AS ENUM('draft', 'pending_review', 'published', 'paused', 'rejected');--> statement-breakpoint
CREATE TABLE "vendor_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"area" text,
	"address_line1" text,
	"price_amount" bigint,
	"price_currency" text DEFAULT 'INR' NOT NULL,
	"display_currency" text DEFAULT 'IDR' NOT NULL,
	"capacity" integer,
	"images" text[],
	"status" "provider_content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"listing_id" uuid,
	"kind" "media_kind" DEFAULT 'photo' NOT NULL,
	"file_url" text NOT NULL,
	"alt_text" text,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_payout_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"account_holder_name" text NOT NULL,
	"bank_name" text,
	"bank_country" text DEFAULT 'Indonesia' NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"gateway_contact_id" text,
	"gateway_fund_account_id" text,
	"masked_account" text,
	"upi_id" text,
	"status" "payout_account_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_payout_account_vendor_id_unique" UNIQUE("vendor_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_promotion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"listing_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"offer_code" text,
	"price_amount" bigint,
	"price_currency" text DEFAULT 'INR' NOT NULL,
	"display_currency" text DEFAULT 'IDR' NOT NULL,
	"terms" text,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"images" text[],
	"status" "provider_content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_disbursement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"payment_id" uuid,
	"vendor_id" uuid NOT NULL,
	"payout_account_id" uuid,
	"provider" "payment_provider" DEFAULT 'manual_bank_transfer' NOT NULL,
	"provider_payout_id" text,
	"gross_amount" bigint NOT NULL,
	"commission_amount" bigint DEFAULT 0 NOT NULL,
	"net_amount" bigint NOT NULL,
	"traveller_currency" text DEFAULT 'INR' NOT NULL,
	"vendor_currency" text DEFAULT 'IDR' NOT NULL,
	"fx_rate" text,
	"status" "disbursement_status" DEFAULT 'pending' NOT NULL,
	"hold_reason" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"failure_code" text,
	"failure_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disbursement_amounts_sane" CHECK ("payment_disbursement"."gross_amount" > 0 AND "payment_disbursement"."commission_amount" >= 0 AND "payment_disbursement"."net_amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "address_line1" text;--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "address_line2" text;--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "service_details" jsonb;--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "inclusions" text[];--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "exclusions" text[];--> statement-breakpoint
ALTER TABLE "service_listing" ADD COLUMN "cancellation_policy" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "address_line1" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "address_line2" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "country" text DEFAULT 'Indonesia' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "vendor_event" ADD CONSTRAINT "vendor_event_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_media" ADD CONSTRAINT "vendor_media_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_media" ADD CONSTRAINT "vendor_media_listing_id_service_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."service_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payout_account" ADD CONSTRAINT "vendor_payout_account_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_promotion" ADD CONSTRAINT "vendor_promotion_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_promotion" ADD CONSTRAINT "vendor_promotion_listing_id_service_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."service_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disbursement" ADD CONSTRAINT "payment_disbursement_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disbursement" ADD CONSTRAINT "payment_disbursement_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disbursement" ADD CONSTRAINT "payment_disbursement_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disbursement" ADD CONSTRAINT "payment_disbursement_payout_account_id_vendor_payout_account_id_fk" FOREIGN KEY ("payout_account_id") REFERENCES "public"."vendor_payout_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disbursement" ADD CONSTRAINT "payment_disbursement_approved_by_account_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendor_event_vendor_status_idx" ON "vendor_event" USING btree ("vendor_id","status","starts_at");--> statement-breakpoint
CREATE INDEX "vendor_event_board_idx" ON "vendor_event" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "vendor_media_vendor_idx" ON "vendor_media" USING btree ("vendor_id","kind","approved");--> statement-breakpoint
CREATE INDEX "vendor_media_listing_idx" ON "vendor_media" USING btree ("listing_id","sort_order");--> statement-breakpoint
CREATE INDEX "vendor_payout_status_idx" ON "vendor_payout_account" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "vendor_promotion_vendor_status_idx" ON "vendor_promotion" USING btree ("vendor_id","status","valid_until");--> statement-breakpoint
CREATE INDEX "vendor_promotion_listing_idx" ON "vendor_promotion" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "disbursement_vendor_status_idx" ON "payment_disbursement" USING btree ("vendor_id","status","created_at");--> statement-breakpoint
CREATE INDEX "disbursement_booking_idx" ON "payment_disbursement" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "disbursement_provider_payout_uq" ON "payment_disbursement" USING btree ("provider","provider_payout_id") WHERE "payment_disbursement"."provider_payout_id" IS NOT NULL;