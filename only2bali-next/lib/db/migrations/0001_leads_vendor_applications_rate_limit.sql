CREATE TABLE "vendor_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"business_type" text NOT NULL,
	"base_area" text NOT NULL,
	"cuisine" text,
	"capabilities" text[] NOT NULL,
	"languages" text[],
	"price_band" text,
	"whatsapp" text NOT NULL,
	"email" text,
	"availability" text,
	"notes" text,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "departure_city" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "group_size" integer;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "protocol" "protocol";--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "travel_month" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "ip" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "vendor_application" ADD CONSTRAINT "vendor_application_reviewed_by_account_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendor_application_status_idx" ON "vendor_application" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "rate_limit_reset_idx" ON "rate_limit" USING btree ("reset_at");