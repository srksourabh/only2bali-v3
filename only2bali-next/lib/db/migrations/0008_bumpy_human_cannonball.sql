-- Four more food protocols.
--
-- Additive on purpose. drizzle-kit wanted to drop and recreate the type so it
-- could set the value order, which would have meant casting four columns
-- through text on a live table for a cosmetic gain. Postgres appends enum
-- values without rewriting anything, so that is what this does; presentation
-- order lives in PROTOCOL_DISPLAY_ORDER, not in the type.
--
-- The same generate also emitted statements for review.direction,
-- platform_setting and vendor.assigned_to. Those are already applied - the
-- snapshot chain had drifted, not the database - and re-issuing them would
-- fail. Verified against the live schema before removing them.
ALTER TYPE "public"."protocol" ADD VALUE IF NOT EXISTS 'satvik';--> statement-breakpoint
ALTER TYPE "public"."protocol" ADD VALUE IF NOT EXISTS 'eggetarian';--> statement-breakpoint
ALTER TYPE "public"."protocol" ADD VALUE IF NOT EXISTS 'halal';--> statement-breakpoint
ALTER TYPE "public"."protocol" ADD VALUE IF NOT EXISTS 'non_veg';
