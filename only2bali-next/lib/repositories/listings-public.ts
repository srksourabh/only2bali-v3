import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { availability, serviceListing, vendor } from "@/lib/db/schema";

export type PublicListingFilters = {
  region?: "bali" | "jakarta" | "all";
  serviceType?: string;
  priceMin?: number;
  priceMax?: number;
  limit?: number;
};

/** Pure gate used by tests and by the repository. */
export function isPubliclyVisibleListing(input: {
  listingStatus: string;
  listingActive: boolean;
  vendorVerificationStatus: string;
}): boolean {
  return (
    input.listingStatus === "active" &&
    input.listingActive === true &&
    input.vendorVerificationStatus === "verified"
  );
}

function regionClause(region: PublicListingFilters["region"]) {
  if (!region || region === "all") return undefined;
  if (region === "jakarta") {
    return or(
      ilike(serviceListing.city, "%jakarta%"),
      ilike(serviceListing.area, "%jakarta%"),
      ilike(vendor.city, "%jakarta%"),
      ilike(vendor.baseArea, "%jakarta%")
    );
  }
  // Bali: explicit bali match OR no jakarta mention (default supply region).
  return and(
    or(
      ilike(serviceListing.city, "%bali%"),
      ilike(serviceListing.area, "%ubud%"),
      ilike(serviceListing.area, "%seminyak%"),
      ilike(serviceListing.area, "%canggu%"),
      ilike(serviceListing.area, "%nusa%"),
      ilike(serviceListing.area, "%kuta%"),
      ilike(serviceListing.area, "%sanur%"),
      ilike(vendor.baseArea, "%ubud%"),
      ilike(vendor.baseArea, "%bali%"),
      ilike(vendor.city, "%denpasar%"),
      sql`coalesce(${serviceListing.city}, '') not ilike '%jakarta%'
          and coalesce(${serviceListing.area}, '') not ilike '%jakarta%'`
    )
  );
}

export async function listPublicServices(filters: PublicListingFilters = {}) {
  const clauses = [
    eq(serviceListing.status, "active"),
    eq(serviceListing.active, true),
    eq(vendor.verificationStatus, "verified"),
  ];

  if (filters.serviceType) {
    clauses.push(sql`${serviceListing.serviceType} = ${filters.serviceType}`);
  }
  if (filters.priceMin != null) clauses.push(gte(serviceListing.priceAmount, filters.priceMin));
  if (filters.priceMax != null) clauses.push(lte(serviceListing.priceAmount, filters.priceMax));

  const region = regionClause(filters.region);
  if (region) clauses.push(region);

  const rows = await db
    .select({
      id: serviceListing.id,
      title: serviceListing.title,
      serviceType: serviceListing.serviceType,
      description: serviceListing.description,
      area: serviceListing.area,
      city: serviceListing.city,
      capacityMin: serviceListing.capacityMin,
      capacityMax: serviceListing.capacityMax,
      tier: serviceListing.tier,
      priceAmount: serviceListing.priceAmount,
      priceCurrency: serviceListing.priceCurrency,
      priceUnit: serviceListing.priceUnit,
      images: serviceListing.images,
      inclusions: serviceListing.inclusions,
      exclusions: serviceListing.exclusions,
      vendorId: vendor.id,
      vendorSlug: vendor.slug,
      businessName: vendor.businessName,
      vendorCity: vendor.city,
      vendorArea: vendor.baseArea,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
      coverImage: vendor.coverImage,
    })
    .from(serviceListing)
    .innerJoin(vendor, eq(serviceListing.vendorId, vendor.id))
    .where(and(...clauses))
    .orderBy(desc(serviceListing.updatedAt))
    .limit(filters.limit ?? 60);

  return rows;
}

export async function getPublicServiceById(id: string) {
  const [row] = await db
    .select({
      id: serviceListing.id,
      title: serviceListing.title,
      serviceType: serviceListing.serviceType,
      description: serviceListing.description,
      area: serviceListing.area,
      city: serviceListing.city,
      addressLine1: serviceListing.addressLine1,
      capacityMin: serviceListing.capacityMin,
      capacityMax: serviceListing.capacityMax,
      tier: serviceListing.tier,
      priceAmount: serviceListing.priceAmount,
      priceCurrency: serviceListing.priceCurrency,
      priceUnit: serviceListing.priceUnit,
      images: serviceListing.images,
      inclusions: serviceListing.inclusions,
      exclusions: serviceListing.exclusions,
      cancellationPolicy: serviceListing.cancellationPolicy,
      serviceDetails: serviceListing.serviceDetails,
      status: serviceListing.status,
      active: serviceListing.active,
      vendorId: vendor.id,
      vendorSlug: vendor.slug,
      businessName: vendor.businessName,
      vendorDescription: vendor.description,
      vendorCity: vendor.city,
      vendorArea: vendor.baseArea,
      vendorType: vendor.vendorType,
      verificationStatus: vendor.verificationStatus,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
      coverImage: vendor.coverImage,
      logo: vendor.logo,
      languages: vendor.languages,
    })
    .from(serviceListing)
    .innerJoin(vendor, eq(serviceListing.vendorId, vendor.id))
    .where(eq(serviceListing.id, id))
    .limit(1);

  if (!row) return null;
  if (
    !isPubliclyVisibleListing({
      listingStatus: row.status,
      listingActive: row.active,
      vendorVerificationStatus: row.verificationStatus,
    })
  ) {
    return null;
  }
  return row;
}

export async function listListingAvailability(
  listingId: string,
  opts: { from?: string; to?: string } = {}
) {
  const service = await getPublicServiceById(listingId);
  if (!service) return null;

  const from = opts.from ?? new Date().toISOString().slice(0, 10);
  const toDate = new Date();
  toDate.setUTCDate(toDate.getUTCDate() + 60);
  const to = opts.to ?? toDate.toISOString().slice(0, 10);

  const rows = await db
    .select({
      date: availability.date,
      status: availability.status,
      priceOverrideAmount: availability.priceOverrideAmount,
      holdExpiresAt: availability.holdExpiresAt,
    })
    .from(availability)
    .where(
      and(
        eq(availability.listingId, listingId),
        gte(availability.date, from),
        lte(availability.date, to)
      )
    )
    .orderBy(asc(availability.date));

  const now = Date.now();
  return {
    service: {
      id: service.id,
      title: service.title,
      priceAmount: service.priceAmount,
      priceCurrency: service.priceCurrency,
      priceUnit: service.priceUnit,
      capacityMin: service.capacityMin,
      capacityMax: service.capacityMax,
    },
    days: rows.map((r) => {
      const heldLive =
        r.status === "held" && r.holdExpiresAt && r.holdExpiresAt.getTime() > now;
      const open = r.status === "open" || (r.status === "held" && !heldLive);
      return {
        date: r.date,
        status: open ? ("open" as const) : (r.status as "held" | "booked" | "blocked"),
        priceAmount: r.priceOverrideAmount ?? service.priceAmount,
        bookable: open,
      };
    }),
  };
}
