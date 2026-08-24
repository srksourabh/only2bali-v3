ALTER TABLE "vendor" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_assigned_to_account_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendor_assigned_to_idx" ON "vendor" USING btree ("assigned_to");
