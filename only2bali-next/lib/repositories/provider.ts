import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  serviceListing,
  vendor,
  vendorEvent,
  vendorMedia,
  vendorPayoutAccount,
  vendorPromotion,
} from "@/lib/db/schema";
import type {
  PayoutAccountInput,
  ProviderEventInput,
  ProviderMediaInput,
  ProviderProfileInput,
  ProviderPromotionInput,
  ServiceListingInput,
  ServiceListingPatchInput,
} from "@/lib/validators/provider";

function clean(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function getVendorByAccount(accountId: string) {
  const [row] = await db.select().from(vendor).where(eq(vendor.accountId, accountId)).limit(1);
  return row ?? null;
}

export async function updateProviderProfile(accountId: string, input: ProviderProfileInput) {
  const values: Partial<typeof vendor.$inferInsert> = {
    businessName: input.businessName,
    legalName: clean(input.legalName),
    baseArea: clean(input.baseArea),
    description: clean(input.description),
    addressLine1: clean(input.addressLine1),
    addressLine2: clean(input.addressLine2),
    city: clean(input.city),
    postalCode: clean(input.postalCode),
    country: clean(input.country) ?? undefined,
    latitude: input.latitude,
    longitude: input.longitude,
    logo: clean(input.logo),
    coverImage: clean(input.coverImage),
    whatsapp: clean(input.whatsapp),
    phone: clean(input.phone),
    email: clean(input.email),
    website: clean(input.website),
    languages: input.languages,
    updatedAt: new Date(),
  };

  const [row] = await db
    .update(vendor)
    .set(values)
    .where(eq(vendor.accountId, accountId))
    .returning();
  return row ?? null;
}

export async function listProviderCatalog(vendorId: string) {
  const [listings, media, events, promotions, payoutAccounts] = await Promise.all([
    db.select().from(serviceListing).where(eq(serviceListing.vendorId, vendorId)),
    db.select().from(vendorMedia).where(eq(vendorMedia.vendorId, vendorId)),
    db.select().from(vendorEvent).where(eq(vendorEvent.vendorId, vendorId)),
    db.select().from(vendorPromotion).where(eq(vendorPromotion.vendorId, vendorId)),
    db.select().from(vendorPayoutAccount).where(eq(vendorPayoutAccount.vendorId, vendorId)).limit(1),
  ]);

  return { listings, media, events, promotions, payoutAccount: payoutAccounts[0] ?? null };
}

export async function createProviderListing(vendorId: string, input: ServiceListingInput) {
  const [row] = await db
    .insert(serviceListing)
    .values({
      vendorId,
      title: input.title,
      serviceType: input.serviceType,
      description: clean(input.description),
      area: clean(input.area),
      addressLine1: clean(input.addressLine1),
      addressLine2: clean(input.addressLine2),
      city: clean(input.city),
      postalCode: clean(input.postalCode),
      latitude: input.latitude,
      longitude: input.longitude,
      capacityMin: input.capacityMin,
      capacityMax: input.capacityMax,
      tier: input.tier,
      priceAmount: input.priceAmount,
      priceCurrency: input.priceCurrency,
      priceUnit: input.priceUnit,
      images: input.images,
      serviceDetails: input.serviceDetails,
      inclusions: input.inclusions,
      exclusions: input.exclusions,
      cancellationPolicy: clean(input.cancellationPolicy),
      status: "pending_review",
      active: false,
    })
    .returning();
  return row;
}

export async function updateProviderListing(
  vendorId: string,
  listingId: string,
  input: ServiceListingPatchInput
) {
  const values: Partial<typeof serviceListing.$inferInsert> = {
    title: input.title,
    serviceType: input.serviceType,
    description: clean(input.description),
    area: clean(input.area),
    addressLine1: clean(input.addressLine1),
    addressLine2: clean(input.addressLine2),
    city: clean(input.city),
    postalCode: clean(input.postalCode),
    latitude: input.latitude,
    longitude: input.longitude,
    capacityMin: input.capacityMin,
    capacityMax: input.capacityMax,
    tier: input.tier,
    priceAmount: input.priceAmount,
    priceCurrency: input.priceCurrency,
    priceUnit: input.priceUnit,
    images: input.images,
    serviceDetails: input.serviceDetails,
    inclusions: input.inclusions,
    exclusions: input.exclusions,
    cancellationPolicy: clean(input.cancellationPolicy),
    status: "pending_review",
    active: false,
    updatedAt: new Date(),
  };

  const [row] = await db
    .update(serviceListing)
    .set(values)
    .where(and(eq(serviceListing.id, listingId), eq(serviceListing.vendorId, vendorId)))
    .returning();
  return row ?? null;
}

export async function addProviderMedia(vendorId: string, input: ProviderMediaInput) {
  if (input.listingId) {
    const [owned] = await db
      .select({ id: serviceListing.id })
      .from(serviceListing)
      .where(and(eq(serviceListing.id, input.listingId), eq(serviceListing.vendorId, vendorId)))
      .limit(1);
    if (!owned) return null;
  }

  const [row] = await db
    .insert(vendorMedia)
    .values({
      vendorId,
      listingId: input.listingId,
      kind: input.kind,
      fileUrl: input.fileUrl,
      altText: clean(input.altText),
      caption: clean(input.caption),
      sortOrder: input.sortOrder,
      approved: false,
    })
    .returning();
  return row;
}

export async function createProviderEvent(vendorId: string, input: ProviderEventInput) {
  const [row] = await db
    .insert(vendorEvent)
    .values({
      vendorId,
      title: input.title,
      description: clean(input.description),
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      area: clean(input.area),
      addressLine1: clean(input.addressLine1),
      priceAmount: input.priceAmount,
      priceCurrency: input.priceCurrency,
      displayCurrency: input.displayCurrency,
      capacity: input.capacity,
      images: input.images,
      status: "pending_review",
    })
    .returning();
  return row;
}

export async function createProviderPromotion(vendorId: string, input: ProviderPromotionInput) {
  if (input.listingId) {
    const [owned] = await db
      .select({ id: serviceListing.id })
      .from(serviceListing)
      .where(and(eq(serviceListing.id, input.listingId), eq(serviceListing.vendorId, vendorId)))
      .limit(1);
    if (!owned) return null;
  }

  const [row] = await db
    .insert(vendorPromotion)
    .values({
      vendorId,
      listingId: input.listingId,
      title: input.title,
      description: clean(input.description),
      offerCode: clean(input.offerCode),
      priceAmount: input.priceAmount,
      priceCurrency: input.priceCurrency,
      displayCurrency: input.displayCurrency,
      terms: clean(input.terms),
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      images: input.images,
      status: "pending_review",
    })
    .returning();
  return row;
}

export async function upsertPayoutAccount(vendorId: string, input: PayoutAccountInput) {
  const [row] = await db
    .insert(vendorPayoutAccount)
    .values({
      vendorId,
      accountHolderName: input.accountHolderName,
      bankName: clean(input.bankName),
      bankCountry: input.bankCountry,
      currency: input.currency,
      maskedAccount: clean(input.maskedAccount),
      upiId: clean(input.upiId),
      status: "pending",
    })
    .onConflictDoUpdate({
      target: vendorPayoutAccount.vendorId,
      set: {
        accountHolderName: input.accountHolderName,
        bankName: clean(input.bankName),
        bankCountry: input.bankCountry,
        currency: input.currency,
        maskedAccount: clean(input.maskedAccount),
        upiId: clean(input.upiId),
        status: "pending",
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}
