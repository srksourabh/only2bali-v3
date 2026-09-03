import type { Protocol } from "@/lib/protocols";
/**
 * Compliance hard-filter for marketplace matching.
 *
 * A listing with no compliance row for the requested protocol is invisible for
 * that protocol — never "unknown, show anyway".
 */
import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isSchemaLagError } from "@/lib/db/schema-lag";
import { listingCompliance, serviceListing, vendor } from "@/lib/db/schema";
import { isPubliclyVisibleListing, listingMatchesRegion } from "@/lib/repositories/listings-public";

export type ProtocolFilter = Protocol;

/** Pure: expired compliance does not count. */
export function isComplianceActive(expiresAt: Date | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() > now.getTime();
}

/** Pure: green/amber pass the hard filter; red does not. */
export function passesComplianceHardFilter(rating: string): boolean {
  return rating === "green" || rating === "amber";
}

const compliantCoreSelect = {
  id: serviceListing.id,
  title: serviceListing.title,
  serviceType: serviceListing.serviceType,
  description: serviceListing.description,
  area: serviceListing.area,
  priceAmount: serviceListing.priceAmount,
  priceCurrency: serviceListing.priceCurrency,
  priceUnit: serviceListing.priceUnit,
  images: serviceListing.images,
  status: serviceListing.status,
  active: serviceListing.active,
  vendorId: vendor.id,
  vendorSlug: vendor.slug,
  businessName: vendor.businessName,
  vendorVerificationStatus: vendor.verificationStatus,
  ratingAvg: vendor.ratingAvg,
  ratingCount: vendor.ratingCount,
  complianceRating: listingCompliance.rating,
  guaranteeLevel: listingCompliance.guaranteeLevel,
  expiresAt: listingCompliance.expiresAt,
};

export async function listCompliantPublicServices(opts: {
  protocol: ProtocolFilter;
  region?: "bali" | "jakarta" | "all";
  limit?: number;
}) {
  const now = new Date();
  const where = and(
    eq(serviceListing.status, "active"),
    eq(serviceListing.active, true),
    eq(vendor.verificationStatus, "verified"),
    or(isNull(listingCompliance.expiresAt), gte(listingCompliance.expiresAt, now)),
    sql`${listingCompliance.rating} in ('green', 'amber')`
  );
  const joinOn = and(
    eq(listingCompliance.listingId, serviceListing.id),
    eq(listingCompliance.protocol, opts.protocol)
  );

  let rows;
  try {
    rows = await db
      .select({ ...compliantCoreSelect, city: serviceListing.city })
      .from(serviceListing)
      .innerJoin(vendor, eq(serviceListing.vendorId, vendor.id))
      .innerJoin(listingCompliance, joinOn)
      .where(where)
      .limit(opts.limit ?? 60);
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    const legacy = await db
      .select(compliantCoreSelect)
      .from(serviceListing)
      .innerJoin(vendor, eq(serviceListing.vendorId, vendor.id))
      .innerJoin(listingCompliance, joinOn)
      .where(where)
      .limit(opts.limit ?? 60);
    rows = legacy.map((row) => ({ ...row, city: null as string | null }));
  }

  return rows.filter((r) =>
    isPubliclyVisibleListing({
      listingStatus: r.status,
      listingActive: r.active,
      vendorVerificationStatus: r.vendorVerificationStatus,
    }) && listingMatchesRegion({ city: r.city, area: r.area }, opts.region)
  );
}
