import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { isSchemaLagError } from "@/lib/db/schema-lag";
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

const vendorCoreSelect = {
  id: vendor.id,
  accountId: vendor.accountId,
  slug: vendor.slug,
  businessName: vendor.businessName,
  legalName: vendor.legalName,
  vendorType: vendor.vendorType,
  baseArea: vendor.baseArea,
  description: vendor.description,
  logo: vendor.logo,
  coverImage: vendor.coverImage,
  whatsapp: vendor.whatsapp,
  phone: vendor.phone,
  email: vendor.email,
  website: vendor.website,
  languages: vendor.languages,
  verificationStatus: vendor.verificationStatus,
  verifiedAt: vendor.verifiedAt,
  verifiedBy: vendor.verifiedBy,
  rejectionReason: vendor.rejectionReason,
  commissionRate: vendor.commissionRate,
  ratingAvg: vendor.ratingAvg,
  ratingCount: vendor.ratingCount,
  responseTimeMinutes: vendor.responseTimeMinutes,
  onboardingStep: vendor.onboardingStep,
  createdAt: vendor.createdAt,
  updatedAt: vendor.updatedAt,
};

const listingCoreSelect = {
  id: serviceListing.id,
  vendorId: serviceListing.vendorId,
  title: serviceListing.title,
  serviceType: serviceListing.serviceType,
  description: serviceListing.description,
  area: serviceListing.area,
  capacityMin: serviceListing.capacityMin,
  capacityMax: serviceListing.capacityMax,
  tier: serviceListing.tier,
  priceAmount: serviceListing.priceAmount,
  priceCurrency: serviceListing.priceCurrency,
  priceUnit: serviceListing.priceUnit,
  images: serviceListing.images,
  status: serviceListing.status,
  active: serviceListing.active,
  createdAt: serviceListing.createdAt,
  updatedAt: serviceListing.updatedAt,
};

function withMissingVendorGeo<T extends object>(row: T) {
  return {
    ...row,
    addressLine1: null as string | null,
    addressLine2: null as string | null,
    city: null as string | null,
    postalCode: null as string | null,
    country: "Indonesia",
    latitude: null as number | null,
    longitude: null as number | null,
  };
}

function withMissingListingGeo<T extends object>(row: T) {
  return {
    ...row,
    addressLine1: null as string | null,
    addressLine2: null as string | null,
    city: null as string | null,
    postalCode: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
    serviceDetails: null,
    inclusions: null as string[] | null,
    exclusions: null as string[] | null,
    cancellationPolicy: null as string | null,
  };
}

export async function getVendorByAccount(accountId: string) {
  try {
    const [row] = await db.select().from(vendor).where(eq(vendor.accountId, accountId)).limit(1);
    return row ?? null;
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    const [row] = await db
      .select(vendorCoreSelect)
      .from(vendor)
      .where(eq(vendor.accountId, accountId))
      .limit(1);
    return row ? withMissingVendorGeo(row) : null;
  }
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

  try {
    const [row] = await db
      .update(vendor)
      .set(values)
      .where(eq(vendor.accountId, accountId))
      .returning();
    return row ?? null;
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    const {
      addressLine1: _a1,
      addressLine2: _a2,
      city: _city,
      postalCode: _postal,
      country: _country,
      latitude: _lat,
      longitude: _lng,
      ...legacy
    } = values;
    const [row] = await db
      .update(vendor)
      .set(legacy)
      .where(eq(vendor.accountId, accountId))
      .returning(vendorCoreSelect);
    return row ? withMissingVendorGeo(row) : null;
  }
}

export async function listProviderCatalog(vendorId: string) {
  const listings = await loadProviderListings(vendorId);
  try {
    const [media, events, promotions, payoutAccounts] = await Promise.all([
      db.select().from(vendorMedia).where(eq(vendorMedia.vendorId, vendorId)),
      db.select().from(vendorEvent).where(eq(vendorEvent.vendorId, vendorId)),
      db.select().from(vendorPromotion).where(eq(vendorPromotion.vendorId, vendorId)),
      db.select().from(vendorPayoutAccount).where(eq(vendorPayoutAccount.vendorId, vendorId)).limit(1),
    ]);
    return { listings, media, events, promotions, payoutAccount: payoutAccounts[0] ?? null };
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    return { listings, media: [], events: [], promotions: [], payoutAccount: null };
  }
}

async function loadProviderListings(vendorId: string) {
  try {
    return await db.select().from(serviceListing).where(eq(serviceListing.vendorId, vendorId));
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    const rows = await db
      .select(listingCoreSelect)
      .from(serviceListing)
      .where(eq(serviceListing.vendorId, vendorId));
    return rows.map(withMissingListingGeo);
  }
}

export async function createProviderListing(vendorId: string, input: ServiceListingInput) {
  const values = {
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
    status: "pending_review" as const,
    active: false,
  };

  try {
    const [row] = await db.insert(serviceListing).values(values).returning();
    return row;
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    const {
      addressLine1: _a1,
      addressLine2: _a2,
      city: _city,
      postalCode: _postal,
      latitude: _lat,
      longitude: _lng,
      serviceDetails: _details,
      inclusions: _inc,
      exclusions: _exc,
      cancellationPolicy: _cancel,
      ...legacy
    } = values;
    const [row] = await db.insert(serviceListing).values(legacy).returning(listingCoreSelect);
    return row ? withMissingListingGeo(row) : row;
  }
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

  try {
    const [row] = await db
      .update(serviceListing)
      .set(values)
      .where(and(eq(serviceListing.id, listingId), eq(serviceListing.vendorId, vendorId)))
      .returning();
    return row ?? null;
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    const {
      addressLine1: _a1,
      addressLine2: _a2,
      city: _city,
      postalCode: _postal,
      latitude: _lat,
      longitude: _lng,
      serviceDetails: _details,
      inclusions: _inc,
      exclusions: _exc,
      cancellationPolicy: _cancel,
      ...legacy
    } = values;
    const [row] = await db
      .update(serviceListing)
      .set(legacy)
      .where(and(eq(serviceListing.id, listingId), eq(serviceListing.vendorId, vendorId)))
      .returning(listingCoreSelect);
    return row ? withMissingListingGeo(row) : null;
  }
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

  try {
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
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    throw Object.assign(new Error("Media library needs database migration 0003."), { status: 503 });
  }
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
