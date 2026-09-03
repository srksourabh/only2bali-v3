CREATE TABLE "platform_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);--> statement-breakpoint
ALTER TABLE "platform_setting" ADD CONSTRAINT "platform_setting_updated_by_account_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "platform_setting" ("key", "value") VALUES ('platform_fee_rate', '0.1000');
