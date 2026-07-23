CREATE TYPE "public"."payment_provider" AS ENUM('razorpay', 'stripe', 'payu', 'cashfree', 'manual_bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_purpose" AS ENUM('deposit', 'balance', 'full', 'addon');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_order_id" text,
	"provider_payment_id" text,
	"provider_refund_id" text,
	"amount" bigint NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"refunded_amount" bigint DEFAULT 0 NOT NULL,
	"purpose" "payment_purpose" DEFAULT 'full' NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"idempotency_key" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"failure_code" text,
	"failure_message" text,
	"authorized_at" timestamp with time zone,
	"captured_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"initiated_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "payment_amount_positive" CHECK ("payment"."amount" > 0),
	CONSTRAINT "payment_refund_within_amount" CHECK ("payment"."refunded_amount" >= 0 AND "payment"."refunded_amount" <= "payment"."amount")
);
--> statement-breakpoint
CREATE TABLE "payment_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_event_id" text NOT NULL,
	"payment_id" uuid,
	"type" text NOT NULL,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"processing_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_initiated_by_account_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_booking_status_idx" ON "payment" USING btree ("booking_id","status");--> statement-breakpoint
CREATE INDEX "payment_status_created_idx" ON "payment" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_order_uq" ON "payment" USING btree ("provider","provider_order_id") WHERE "payment"."provider_order_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_payment_uq" ON "payment" USING btree ("provider","provider_payment_id") WHERE "payment"."provider_payment_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_event_provider_event_uq" ON "payment_event" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "payment_event_unprocessed_idx" ON "payment_event" USING btree ("processed_at","received_at");