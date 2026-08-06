import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  account,
  auditLog,
  serviceListing,
  vendor,
  vendorApplication,
  vendorEvent,
  vendorMedia,
  vendorPromotion,
} from "@/lib/db/schema";
import type {
  AdminApplicationDecisionInput,
  AdminContentStatusInput,
  AdminListingPatchInput,
  AdminPromotionPatchInput,
  AdminVendorVerificationInput,
} from "@/lib/validators/admin";
import { listRecentDocuments } from "@/lib/repositories/vendor-documents";

export async function getAdminOverview() {
  const [vendors, applications, listings, media, events, promotions, documents] = await Promise.all([
    db.select().from(vendor).orderBy(desc(vendor.createdAt)).limit(50),
    db.select().from(vendorApplication).orderBy(desc(vendorApplication.createdAt)).limit(50),
    db.select().from(serviceListing).orderBy(desc(serviceListing.updatedAt)).limit(80),
    db.select().from(vendorMedia).orderBy(desc(vendorMedia.uploadedAt)).limit(80),
    db.select().from(vendorEvent).orderBy(desc(vendorEvent.createdAt)).limit(80),
    db.select().from(vendorPromotion).orderBy(desc(vendorPromotion.createdAt)).limit(80),
    listRecentDocuments(80),
  ]);

  return { vendors, applications, listings, media, events, promotions, documents };
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

/**
 * Applications are not vendor rows. Approving records the decision and, when the
 * applicant email already belongs to a vendor account, flips that vendor to verified
 * so their publishable listings can go live without a second manual step.
 */
export async function adminDecideApplication(
  adminId: string,
  id: string,
  input: AdminApplicationDecisionInput
) {
  const [app] = await db.select().from(vendorApplication).where(eq(vendorApplication.id, id)).limit(1);
  if (!app) return null;

  const [row] = await db
    .update(vendorApplication)
    .set({
      status: input.status,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    })
    .where(eq(vendorApplication.id, id))
    .returning();

  let linkedVendorId: string | null = null;
  if (input.status === "verified" && app.email) {
    const [acct] = await db.select().from(account).where(eq(account.email, app.email)).limit(1);
    if (acct) {
      const [v] = await db
        .update(vendor)
        .set({
          verificationStatus: "verified",
          verifiedAt: new Date(),
          verifiedBy: adminId,
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(vendor.accountId, acct.id))
        .returning();
      linkedVendorId = v?.id ?? null;
    }
  }

  await audit(adminId, "admin.application_decided", "vendor_application", id, {
    ...input,
    linkedVendorId,
  });
  return row ?? null;
}

export async function adminSetVendorVerification(
  adminId: string,
  id: string,
  input: AdminVendorVerificationInput
) {
  const [row] = await db
    .update(vendor)
    .set({
      verificationStatus: input.verificationStatus,
      verifiedAt: input.verificationStatus === "verified" ? new Date() : null,
      verifiedBy: input.verificationStatus === "verified" ? adminId : null,
      rejectionReason:
        input.verificationStatus === "rejected" || input.verificationStatus === "suspended"
          ? input.rejectionReason ?? null
          : null,
      updatedAt: new Date(),
    })
    .where(eq(vendor.id, id))
    .returning();
  if (row) await audit(adminId, "admin.vendor_verification", "vendor", id, input);
  return row ?? null;
}
