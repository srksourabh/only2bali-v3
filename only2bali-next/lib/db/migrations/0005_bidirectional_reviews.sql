CREATE TYPE "public"."review_direction" AS ENUM('traveller_to_vendor', 'vendor_to_traveller');--> statement-breakpoint
ALTER TABLE "review" ADD COLUMN "direction" "review_direction" DEFAULT 'traveller_to_vendor' NOT NULL;--> statement-breakpoint
ALTER TABLE "review" ADD COLUMN "reviewer_account_id" uuid;--> statement-breakpoint
ALTER TABLE "review" ADD COLUMN "reviewee_account_id" uuid;--> statement-breakpoint
ALTER TABLE "review" DROP CONSTRAINT "review_booking_id_unique";--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_reviewer_account_id_account_id_fk" FOREIGN KEY ("reviewer_account_id") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_reviewee_account_id_account_id_fk" FOREIGN KEY ("reviewee_account_id") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "review_booking_direction_uq" ON "review" USING btree ("booking_id","direction");--> statement-breakpoint
CREATE INDEX "review_reviewee_idx" ON "review" USING btree ("reviewee_account_id","published");
