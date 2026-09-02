import type { Protocol } from "@/lib/protocols";
import { listingMatchesRegion, type RegionFilter } from "@/lib/marketplace-region";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isSchemaLagError } from "@/lib/db/schema-lag";
import { availability, serviceListing, vendor } from "@/lib/db/schema";
import { isCatalogueCircuitOpen, tripCatalogueCircuit } from "@/lib/db/catalogue-circuit";
import {
  getFallbackServiceById,
  isFallbackServiceId,
  listFallbackServices,
} from "@/lib/repositories/marketplace-fallback";

export type PublicListingFilters = {
  region?: RegionFilter;
  serviceType?: string;
  priceMin?: number;
  priceMax?: number;
  protocol?: Protocol;
  limit?: number;
};

export { listingMatchesRegion };
export type { RegionFilter };

type QueryMode = "full" | "legacy";

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

function regionClause(region: PublicListingFilters["region"], mode: QueryMode) {
  if (!region || region === "all") return undefined;

  if (region === "jakarta") {
    if (mode === "legacy") {
      return or(ilike(serviceListing.area, "%jakarta%"), ilike(vendor.baseArea, "%jakarta%"));
    }
    return or(
      ilike(serviceListing.city, "%jakarta%"),
      ilike(serviceListing.area, "%jakarta%"),
      ilike(vendor.city, "%jakarta%"),
      ilike(vendor.baseArea, "%jakarta%")
    );
  }

  const baliArea = or(
    ilike(serviceListing.area, "%ubud%"),
    ilike(serviceListing.area, "%seminyak%"),
    ilike(serviceListing.area, "%canggu%"),
    ilike(serviceListing.area, "%nusa%"),
    ilike(serviceListing.area, "%kuta%"),
    ilike(serviceListing.area, "%sanur%"),
    ilike(vendor.baseArea, "%ubud%"),
    ilike(vendor.baseArea, "%bali%")
  );

  if (mode === "legacy") {
    return and(
      or(baliArea, sql`coalesce(${serviceListing.area}, '') not ilike '%jakarta%'`)
    );
  }

  return and(
    or(
      ilike(serviceListing.city, "%bali%"),
      baliArea,
      ilike(vendor.city, "%denpasar%"),
      sql`coalesce(${serviceListing.city}, '') not ilike '%jakarta%'
          and coalesce(${serviceListing.area}, '') not ilike '%jakarta%'`
    )
  );
}

function visibilityClauses(filters: PublicListingFilters, mode: QueryMode) {
  const clauses = [
    eq(serviceListing.status, "active"),
    eq(serviceListing.active, true),
    eq(vendor.verificationStatus, "verified"),
    sql`${serviceListing.title} not ilike 'TEST --%'`,
    sql`${vendor.businessName} not ilike 'TEST --%'`,
  ];

  if (filters.serviceType) {
    clauses.push(sql`${serviceListing.serviceType} = ${filters.serviceType}`);
  }
  if (filters.priceMin != null) clauses.push(gte(serviceListing.priceAmount, filters.priceMin));
  if (filters.priceMax != null) clauses.push(lte(serviceListing.priceAmount, filters.priceMax));

  const region = regionClause(filters.region, mode);
  if (region) clauses.push(region);
  return clauses;
}

const listingCoreSelect = {
  id: serviceListing.id,
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
  vendorId: vendor.id,
  vendorSlug: vendor.slug,
  businessName: vendor.businessName,
  vendorArea: vendor.baseArea,
  ratingAvg: vendor.ratingAvg,
  ratingCount: vendor.ratingCount,
  coverImage: vendor.coverImage,
};

async function queryListings(filters: PublicListingFilters, mode: QueryMode) {
  const clauses = visibilityClauses(filters, mode);
  const limit = filters.limit ?? 60;

  if (mode === "legacy") {
    const rows = await db
      .select(listingCoreSelect)
      .from(serviceListing)
      .innerJoin(vendor, eq(serviceListing.vendorId, vendor.id))
      .where(and(...clauses))
      .orderBy(desc(serviceListing.updatedAt))
      .limit(limit);
    return rows.map((row) => ({
      ...row,
      city: null as string | null,
      inclusions: null as string[] | null,
      exclusions: null as string[] | null,
      vendorCity: null as string | null,
    }));
  }

  return db
    .select({
      ...listingCoreSelect,
      city: serviceListing.city,
      inclusions: serviceListing.inclusions,
      exclusions: serviceListing.exclusions,
      vendorCity: vendor.city,
    })
    .from(serviceListing)
    .innerJoin(vendor, eq(serviceListing.vendorId, vendor.id))
    .where(and(...clauses))
    .orderBy(desc(serviceListing.updatedAt))
    .limit(limit);
}

export async function listPublicServices(filters: PublicListingFilters = {}) {
  try {
    return await queryListings(filters, "full");
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    console.warn("[services] schema behind 0003; retrying catalogue without city columns");
    return queryListings(filters, "legacy");
  }
}

/** Browse pages must render when production schema is behind or empty. */
export async function listPublicServicesForPage(filters: PublicListingFilters = {}) {
  if (isCatalogueCircuitOpen()) return listFallbackServices(filters);
  try {
    const rows = await listPublicServices(filters);
    if (rows.length > 0) return rows;
  } catch (err) {
    console.warn("[services] catalogue unavailable", err);
    tripCatalogueCircuit();
  }
  return listFallbackServices(filters);
}

const serviceDetailCoreSelect = {
  id: serviceListing.id,
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
  vendorId: vendor.id,
  vendorSlug: vendor.slug,
  businessName: vendor.businessName,
  vendorDescription: vendor.description,
  vendorArea: vendor.baseArea,
  vendorType: vendor.vendorType,
  verificationStatus: vendor.verificationStatus,
  ratingAvg: vendor.ratingAvg,
  ratingCount: vendor.ratingCount,
  coverImage: vendor.coverImage,
  logo: vendor.logo,
  languages: vendor.languages,
};

async function queryServiceById(id: string, mode: QueryMode) {
  if (mode === "legacy") {
    const [row] = await db
      .select(serviceDetailCoreSelect)
      .from(serviceListing)
      .innerJoin(vendor, eq(serviceListing.vendorId, vendor.id))
      .where(eq(serviceListing.id, id))
      .limit(1);
    if (!row) return null;
    return {
      ...row,
      city: null as string | null,
      addressLine1: null as string | null,
      inclusions: null as string[] | null,
      exclusions: null as string[] | null,
      cancellationPolicy: null as string | null,
      serviceDetails: null as unknown,
      vendorCity: null as string | null,
    };
  }

  const [row] = await db
    .select({
      ...serviceDetailCoreSelect,
      city: serviceListing.city,
      addressLine1: serviceListing.addressLine1,
      inclusions: serviceListing.inclusions,
      exclusions: serviceListing.exclusions,
      cancellationPolicy: serviceListing.cancellationPolicy,
      serviceDetails: serviceListing.serviceDetails,
      vendorCity: vendor.city,
    })
    .from(serviceListing)
    .innerJoin(vendor, eq(serviceListing.vendorId, vendor.id))
    .where(eq(serviceListing.id, id))
    .limit(1);
  return row ?? null;
}

export async function getPublicServiceById(id: string) {
  if (!isCatalogueCircuitOpen()) {
    try {
      let row;
      try {
        row = await queryServiceById(id, "full");
      } catch (err) {
        if (!isSchemaLagError(err)) throw err;
        console.warn("[services] schema behind 0003; retrying service detail without city columns");
        row = await queryServiceById(id, "legacy");
      }

      if (row) {
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
    } catch (err) {
      console.warn("[services] service detail unavailable", err);
      tripCatalogueCircuit();
    }
  }
  return getFallbackServiceById(id);
}

export async function listListingAvailability(
  listingId: string,
  opts: { from?: string; to?: string } = {}
) {
  const service = await getPublicServiceById(listingId);
  if (!service) return null;

  const empty = {
    service: {
      id: service.id,
      title: service.title,
      priceAmount: service.priceAmount,
      priceCurrency: service.priceCurrency,
      priceUnit: service.priceUnit,
      capacityMin: service.capacityMin,
      capacityMax: service.capacityMax,
    },
    days: [] as Array<{
      date: string;
      status: "open" | "held" | "booked" | "blocked";
      priceAmount: number;
      bookable: boolean;
    }>,
  };

  if (isFallbackServiceId(listingId)) return empty;

  try {
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
      ...empty,
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
  } catch (err) {
    console.warn("[services] availability unavailable", err);
    return empty;
  }
}
