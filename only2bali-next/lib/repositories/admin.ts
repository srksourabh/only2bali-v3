import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  auditLog,
  serviceListing,
  vendor,
  vendorApplication,
  vendorEvent,
  vendorMedia,
  vendorPromotion,
} from "@/lib/db/schema";
import type {
  AdminContentStatusInput,
  AdminListingPatchInput,
  AdminPromotionPatchInput,
} from "@/lib/validators/admin";

export async function getAdminOverview() {
  const [vendors, applications, listings, media, events, promotions] = await Promise.all([
    db.select().from(vendor).orderBy(desc(vendor.createdAt)).limit(50),
    db.select().from(vendorApplication).orderBy(desc(vendorApplication.createdAt)).limit(50),
    db.select().from(serviceListing).orderBy(desc(serviceListing.updatedAt)).limit(80),
    db.select().from(vendorMedia).orderBy(desc(vendorMedia.uploadedAt)).limit(80),
    db.select().from(vendorEvent).orderBy(desc(vendorEvent.createdAt)).limit(80),
    db.select().from(vendorPromotion).orderBy(desc(vendorPromotion.createdAt)).limit(80),
  ]);

  return { vendors, applications, listings, media, events, promotions };
}

async function audit(adminId: string, action: string, resourceType: string, resourceId: string, details: unknown) {
  await db.insert(auditLog).values({
    accountId: adminId,
    action,
    resourceType,
    resourceId,
    details,
  });
}

export async function adminPatchListing(adminId: string, id: string, input: AdminListingPatchInput) {
  const [row] = await db
    .update(serviceListing)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(serviceListing.id, id))
    .returning();
  if (row) await audit(adminId, "admin.listing_updated", "service_listing", id, input);
  return row ?? null;
}

export async function adminPatchMedia(adminId: string, id: string, input: AdminContentStatusInput) {
  const approved = input.approved ?? (input.status === undefined ? undefined : input.status === "published");
  const [row] = await db
    .update(vendorMedia)
    .set({ approved })
    .where(eq(vendorMedia.id, id))
    .returning();
  if (row) await audit(adminId, "admin.media_updated", "vendor_media", id, input);
  return row ?? null;
}

export async function adminPatchEvent(adminId: string, id: string, input: AdminContentStatusInput) {
  const [row] = await db
    .update(vendorEvent)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(vendorEvent.id, id))
    .returning();
  if (row) await audit(adminId, "admin.event_updated", "vendor_event", id, input);
  return row ?? null;
}

export async function adminPatchPromotion(adminId: string, id: string, input: AdminPromotionPatchInput) {
  const [row] = await db
    .update(vendorPromotion)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(vendorPromotion.id, id))
    .returning();
  if (row) await audit(adminId, "admin.promotion_updated", "vendor_promotion", id, input);
  return row ?? null;
}
