CREATE TABLE IF NOT EXISTS "app_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value_enc" text NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app_setting" ADD CONSTRAINT "app_setting_updated_by_account_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
