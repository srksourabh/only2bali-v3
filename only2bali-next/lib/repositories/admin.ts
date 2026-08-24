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
import { hashPassword } from "@/lib/auth/crypto";
import type {
  AdminApplicationDecisionInput,
  AdminContentStatusInput,
  AdminListingPatchInput,
  AdminPromotionPatchInput,
  AdminVendorVerificationInput,
  BootstrapAdminInput,
} from "@/lib/validators/admin";
import { listAdminVendorDesk } from "@/lib/repositories/admin-desk";
import { listRecentDocuments } from "@/lib/repositories/vendor-documents";
import {
  planApplicationOnboarding,
  slugifyBusinessName,
  type VendorType,
} from "@/lib/repositories/application-onboarding";

export async function upsertAdminAccount(input: BootstrapAdminInput) {
  const email = input.email ? input.email : null;
  const [existing] = await db
    .select({ id: account.id })
    .from(account)
    .where(eq(account.username, input.username))
    .limit(1);

  if (existing) {
    await db
      .update(account)
      .set({
        passwordHash: hashPassword(input.password),
        email,
        role: "admin",
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(account.id, existing.id));
    return { created: false as const, username: input.username };
  }

  await db.insert(account).values({
    username: input.username,
    passwordHash: hashPassword(input.password),
    email,
    role: "admin",
    status: "active",
  });
  return { created: true as const, username: input.username };
}

export async function getAdminOverview() {
  const [vendors, applications, listings, media, events, promotions, documents, desk] = await Promise.all([
    db.select().from(vendor).orderBy(desc(vendor.createdAt)).limit(50),
    db.select().from(vendorApplication).orderBy(desc(vendorApplication.createdAt)).limit(50),
    db.select().from(serviceListing).orderBy(desc(serviceListing.updatedAt)).limit(80),
    db.select().from(vendorMedia).orderBy(desc(vendorMedia.uploadedAt)).limit(80),
    db.select().from(vendorEvent).orderBy(desc(vendorEvent.createdAt)).limit(80),
    db.select().from(vendorPromotion).orderBy(desc(vendorPromotion.createdAt)).limit(80),
    listRecentDocuments(80),
    listAdminVendorDesk(),
  ]);

  return { vendors, applications, listings, media, events, promotions, documents, desk };
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

async function uniqueUsername(base: string): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 8; i++) {
    const [hit] = await db.select({ id: account.id }).from(account).where(eq(account.username, candidate)).limit(1);
    if (!hit) return candidate;
    candidate = `${base.slice(0, 28)}${i + 2}`;
  }
  return `${base.slice(0, 20)}${Date.now().toString(36)}`;
}

async function uniqueVendorSlug(base: string): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 8; i++) {
    const [hit] = await db.select({ id: vendor.id }).from(vendor).where(eq(vendor.slug, candidate)).limit(1);
    if (!hit) return candidate;
    candidate = `${base.slice(0, 40)}-${i + 2}`;
  }
  return `${base.slice(0, 32)}-${Date.now().toString(36)}`;
}

async function verifyVendorForAccount(
  accountId: string,
  adminId: string,
  profile?: { businessName: string; vendorType: VendorType; baseArea: string; whatsapp: string; email?: string }
) {
  const [existing] = await db.select({ id: vendor.id }).from(vendor).where(eq(vendor.accountId, accountId)).limit(1);
  if (existing) {
    const [row] = await db
      .update(vendor)
      .set({
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verifiedBy: adminId,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(vendor.accountId, accountId))
      .returning({ id: vendor.id });
    return row?.id ?? null;
  }

  if (!profile) return null;

  const [created] = await db
    .insert(vendor)
    .values({
      accountId,
      slug: await uniqueVendorSlug(slugifyBusinessName(profile.businessName)),
      businessName: profile.businessName,
      vendorType: profile.vendorType,
      baseArea: profile.baseArea,
      whatsapp: profile.whatsapp,
      email: profile.email ?? null,
      verificationStatus: "verified",
      verifiedAt: new Date(),
      verifiedBy: adminId,
      onboardingStep: 2,
    })
    .returning({ id: vendor.id });
  return created?.id ?? null;
}

/**
 * Approving an application records the decision and provisions the vendor side:
 * create a vendor account when the email is new, promote a traveller, or verify
 * an existing vendor. An anonymous form still cannot mint an account by itself.
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
  let onboardedAccountId: string | null = null;
  const email = app.email?.trim().toLowerCase() || null;
  const [existingAccount] = email
    ? await db
        .select({ id: account.id, role: account.role })
        .from(account)
        .where(eq(account.email, email))
        .limit(1)
    : [];

  const plan = planApplicationOnboarding({
    decision: input.status,
    email,
    businessName: app.businessName,
    businessType: app.businessType,
    baseArea: app.baseArea,
    whatsapp: app.whatsapp,
    existingAccount: existingAccount ?? null,
  });

  if (plan.kind === "create_account") {
    const [created] = await db
      .insert(account)
      .values({
        email: plan.email,
        username: await uniqueUsername(plan.username),
        role: "vendor",
      })
      .returning({ id: account.id });
    onboardedAccountId = created.id;
    linkedVendorId = await verifyVendorForAccount(created.id, adminId, {
      businessName: plan.businessName,
      vendorType: plan.vendorType,
      baseArea: plan.baseArea,
      whatsapp: plan.whatsapp,
      email: plan.email,
    });
  } else if (plan.kind === "promote_traveller") {
    await db
      .update(account)
      .set({ role: "vendor", updatedAt: new Date() })
      .where(eq(account.id, plan.accountId));
    onboardedAccountId = plan.accountId;
    linkedVendorId = await verifyVendorForAccount(plan.accountId, adminId, {
      businessName: plan.businessName,
      vendorType: plan.vendorType,
      baseArea: plan.baseArea,
      whatsapp: plan.whatsapp,
      email: email ?? undefined,
    });
  } else if (plan.kind === "verify_vendor") {
    onboardedAccountId = plan.accountId;
    linkedVendorId = await verifyVendorForAccount(plan.accountId, adminId);
  }

  await audit(adminId, "admin.application_decided", "vendor_application", id, {
    ...input,
    linkedVendorId,
    onboardedAccountId,
    onboarding: plan.kind,
  });
  return row ?? null;
}

export async function adminSetVendorVerification(
  adminId: string,
  id: string,
  input: AdminVendorVerificationInput
) {
  if (input.assignedTo) {
    const [staff] = await db
      .select({ id: account.id, role: account.role, status: account.status })
      .from(account)
      .where(eq(account.id, input.assignedTo))
      .limit(1);
    if (!staff || staff.role !== "admin" || staff.status !== "active") {
      throw Object.assign(new Error("Assign an active admin developer."), { status: 400 });
    }
  }

  const [row] = await db
    .update(vendor)
    .set({
      updatedAt: new Date(),
      ...(input.verificationStatus !== undefined
        ? {
            verificationStatus: input.verificationStatus,
            verifiedAt: input.verificationStatus === "verified" ? new Date() : null,
            verifiedBy: input.verificationStatus === "verified" ? adminId : null,
            rejectionReason:
              input.verificationStatus === "rejected" || input.verificationStatus === "suspended"
                ? input.rejectionReason ?? null
                : null,
          }
        : {}),
      ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
    })
    .where(eq(vendor.id, id))
    .returning();
  if (row) {
    await audit(
      adminId,
      input.assignedTo !== undefined ? "admin.vendor_assigned" : "admin.vendor_verification",
      "vendor",
      id,
      input
    );
  }
  return row ?? null;
}
