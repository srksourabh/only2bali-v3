CREATE TABLE "oauth_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "oauth_account" ADD CONSTRAINT "oauth_account_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_provider_account_uq" ON "oauth_account" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "oauth_account_idx" ON "oauth_account" USING btree ("account_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_username_unique" UNIQUE("username");