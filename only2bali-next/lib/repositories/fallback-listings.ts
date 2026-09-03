import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { PROTOCOLS } from "@/lib/protocols";
import { account, listingCompliance, serviceListing, vendor } from "@/lib/db/schema";
import { uniqueConstraintName } from "@/lib/db/unique-violation";
import { getFallbackServiceById, isFallbackServiceId } from "./marketplace-fallback";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VENDOR_TYPES = [
  "restaurant",
  "accommodation",
  "transport",
  "guide",
  "cook",
  "produce",
  "artisan",
  "activity_operator",
  "tour_agency",
] as const;

const TIERS = ["economical", "comfort", "premium"] as const;
const PRICE_UNITS = ["per_person", "per_day", "per_group", "per_night", "per_trip"] as const;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Stable UUID v5-shaped id so rematerializing the same sample listing is idempotent. */
export function uuidFromSeed(seed: string): string {
  const bytes = createHash("sha1").update(seed).digest().subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function asVendorType(value: string): (typeof VENDOR_TYPES)[number] {
  return (VENDOR_TYPES as readonly string[]).includes(value) ? (value as (typeof VENDOR_TYPES)[number]) : "tour_agency";
}

function asTier(value: string): (typeof TIERS)[number] {
  return (TIERS as readonly string[]).includes(value) ? (value as (typeof TIERS)[number]) : "comfort";
}

function asPriceUnit(value: string): (typeof PRICE_UNITS)[number] {
  return (PRICE_UNITS as readonly string[]).includes(value)
    ? (value as (typeof PRICE_UNITS)[number])
    : "per_person";
}

/**
 * Catalogue sample cards use slug ids (`sample-svc-…`). Checkout needs a real
 * `service_listing` row. Materialize once, then book against the UUID.
 */
export async function resolveBookableListingId(listingId: string): Promise<string | null> {
  if (isUuid(listingId)) return listingId;
  if (!isFallbackServiceId(listingId)) return null;
  return materializeFallbackListing(listingId);
}

export async function materializeFallbackListing(fallbackId: string): Promise<string | null> {
  const sample = getFallbackServiceById(fallbackId);
  if (!sample) return null;

  const listingUuid = uuidFromSeed(`only2bali-fallback-listing:${sample.id}`);
  const vendorUuid = uuidFromSeed(`only2bali-fallback-vendor:${sample.vendorSlug}`);
  const accountUuid = uuidFromSeed(`only2bali-fallback-account:${sample.vendorSlug}`);

  const [already] = await db
    .select({ id: serviceListing.id })
    .from(serviceListing)
    .where(eq(serviceListing.id, listingUuid))
    .limit(1);
  if (already) return already.id;

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(account)
        .values({
          id: accountUuid,
          email: `demo.${sample.vendorSlug}@only2bali.invalid`,
          username: `demo_${sample.vendorSlug}`.slice(0, 40),
          role: "vendor",
          status: "active",
        })
        .onConflictDoNothing({ target: account.id });

      await tx
        .insert(vendor)
        .values({
          id: vendorUuid,
          accountId: accountUuid,
          slug: sample.vendorSlug,
          businessName: sample.businessName,
          description: sample.vendorDescription,
          vendorType: asVendorType(sample.vendorType),
          baseArea: sample.vendorArea,
          city: sample.vendorCity,
          coverImage: sample.coverImage,
          logo: sample.logo,
          languages: sample.languages,
          verificationStatus: "verified",
          verifiedAt: new Date(),
          ratingAvg: sample.ratingAvg,
          ratingCount: sample.ratingCount,
        })
        .onConflictDoNothing({ target: vendor.slug });

      const [vendorRow] = await tx
        .select({ id: vendor.id })
        .from(vendor)
        .where(eq(vendor.slug, sample.vendorSlug))
        .limit(1);
      if (!vendorRow) throw new Error("fallback vendor missing after insert");

      await tx
        .insert(serviceListing)
        .values({
          id: listingUuid,
          vendorId: vendorRow.id,
          title: sample.title,
          serviceType: asVendorType(sample.serviceType),
          description: sample.description,
          area: sample.area,
          addressLine1: sample.addressLine1,
          city: sample.city,
          capacityMin: sample.capacityMin,
          capacityMax: sample.capacityMax,
          tier: asTier(sample.tier),
          priceAmount: sample.priceAmount,
          priceCurrency: sample.priceCurrency,
          priceUnit: asPriceUnit(sample.priceUnit),
          images: sample.images,
          inclusions: sample.inclusions,
          exclusions: sample.exclusions,
          cancellationPolicy: sample.cancellationPolicy,
          serviceDetails: sample.serviceDetails,
          status: "active",
          active: true,
        })
        .onConflictDoNothing({ target: serviceListing.id });

      const kitchen =
        sample.serviceType === "restaurant" || sample.serviceType === "cook" ? "dedicated_veg" : null;
      for (const protocolValue of PROTOCOLS) {
        const [row] = await tx
          .select({ id: listingCompliance.id })
          .from(listingCompliance)
          .where(and(eq(listingCompliance.listingId, listingUuid), eq(listingCompliance.protocol, protocolValue)))
          .limit(1);
        if (row) continue;
        await tx.insert(listingCompliance).values({
          listingId: listingUuid,
          protocol: protocolValue,
          guaranteeLevel: "certified",
          rating: "green",
          kitchenType: kitchen,
          verifiedAt: new Date(),
        });
      }
    });
  } catch (err) {
    const [row] = await db
      .select({ id: serviceListing.id })
      .from(serviceListing)
      .where(eq(serviceListing.id, listingUuid))
      .limit(1);
    if (row) return row.id;
    if (uniqueConstraintName(err) !== null) {
      const [again] = await db
        .select({ id: serviceListing.id })
        .from(serviceListing)
        .where(eq(serviceListing.id, listingUuid))
        .limit(1);
      if (again) return again.id;
    }
    throw err;
  }

  return listingUuid;
}
