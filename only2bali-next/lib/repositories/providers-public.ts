import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isSchemaLagError } from "@/lib/db/schema-lag";
import { serviceListing, vendor, vendorHighlight, vendorMedia } from "@/lib/db/schema";
import { listPublishedVendorReviews } from "@/lib/repositories/reviews";

export type PublicProviderFilters = {
  region?: "bali" | "jakarta" | "all";
  limit?: number;
};

type QueryMode = "full" | "legacy";

/** Pure gate used by tests and by the repository. */
export function isPubliclyVisibleProvider(verificationStatus: string): boolean {
  return verificationStatus === "verified";
}

function providerRegionClause(region: PublicProviderFilters["region"], mode: QueryMode) {
  if (!region || region === "all") return undefined;
  if (region === "jakarta") {
    if (mode === "legacy") return ilike(vendor.baseArea, "%jakarta%");
    return or(ilike(vendor.city, "%jakarta%"), ilike(vendor.baseArea, "%jakarta%"));
  }
  if (mode === "legacy") {
    return and(
      or(
        ilike(vendor.baseArea, "%bali%"),
        ilike(vendor.baseArea, "%ubud%"),
        sql`coalesce(${vendor.baseArea}, '') not ilike '%jakarta%'`
      )
    );
  }
  return and(
    or(
      ilike(vendor.city, "%bali%"),
      ilike(vendor.city, "%denpasar%"),
      ilike(vendor.baseArea, "%bali%"),
      ilike(vendor.baseArea, "%ubud%"),
      sql`coalesce(${vendor.city}, '') not ilike '%jakarta%'
          and coalesce(${vendor.baseArea}, '') not ilike '%jakarta%'`
    )
  );
}

const providerCoreSelect = {
  slug: vendor.slug,
  businessName: vendor.businessName,
  vendorType: vendor.vendorType,
  description: vendor.description,
  baseArea: vendor.baseArea,
  logo: vendor.logo,
  coverImage: vendor.coverImage,
  ratingAvg: vendor.ratingAvg,
  ratingCount: vendor.ratingCount,
  languages: vendor.languages,
};

async function queryProviders(filters: PublicProviderFilters, mode: QueryMode) {
  const clauses = [eq(vendor.verificationStatus, "verified")];
  const region = providerRegionClause(filters.region, mode);
  if (region) clauses.push(region);

  if (mode === "legacy") {
    const rows = await db
      .select(providerCoreSelect)
      .from(vendor)
      .where(and(...clauses))
      .orderBy(desc(vendor.ratingCount), asc(vendor.businessName))
      .limit(filters.limit ?? 60);
    return rows.map((row) => ({ ...row, city: null as string | null }));
  }

  return db
    .select({
      ...providerCoreSelect,
      city: vendor.city,
    })
    .from(vendor)
    .where(and(...clauses))
    .orderBy(desc(vendor.ratingCount), asc(vendor.businessName))
    .limit(filters.limit ?? 60);
}

/** Public directory — verified vendors only. */
export async function listPublicProviders(filters: PublicProviderFilters = {}) {
  try {
    return await queryProviders(filters, "full");
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    console.warn("[providers] schema behind 0003; retrying directory without city columns");
    return queryProviders(filters, "legacy");
  }
}

/** Browse pages must render when production schema is behind. */
export async function listPublicProvidersForPage(filters: PublicProviderFilters = {}) {
  try {
    return await listPublicProviders(filters);
  } catch (err) {
    console.warn("[providers] directory unavailable", err);
    return [];
  }
}

const providerProfileCoreSelect = {
  id: vendor.id,
  slug: vendor.slug,
  businessName: vendor.businessName,
  vendorType: vendor.vendorType,
  description: vendor.description,
  baseArea: vendor.baseArea,
  logo: vendor.logo,
  coverImage: vendor.coverImage,
  languages: vendor.languages,
  ratingAvg: vendor.ratingAvg,
  ratingCount: vendor.ratingCount,
  verificationStatus: vendor.verificationStatus,
  verifiedAt: vendor.verifiedAt,
};

async function queryProviderRow(slug: string, mode: QueryMode) {
  if (mode === "legacy") {
    const [row] = await db
      .select(providerProfileCoreSelect)
      .from(vendor)
      .where(eq(vendor.slug, slug))
      .limit(1);
    if (!row) return null;
    return { ...row, city: null as string | null, country: null as string | null };
  }
  const [row] = await db
    .select({
      ...providerProfileCoreSelect,
      city: vendor.city,
      country: vendor.country,
    })
    .from(vendor)
    .where(eq(vendor.slug, slug))
    .limit(1);
  return row ?? null;
}

const listingCardCoreSelect = {
  id: serviceListing.id,
  title: serviceListing.title,
  serviceType: serviceListing.serviceType,
  area: serviceListing.area,
  priceAmount: serviceListing.priceAmount,
  priceCurrency: serviceListing.priceCurrency,
  priceUnit: serviceListing.priceUnit,
  images: serviceListing.images,
  tier: serviceListing.tier,
};

async function queryProviderListings(vendorId: string, mode: QueryMode) {
  const where = and(
    eq(serviceListing.vendorId, vendorId),
    eq(serviceListing.status, "active"),
    eq(serviceListing.active, true)
  );

  if (mode === "legacy") {
    const rows = await db
      .select(listingCardCoreSelect)
      .from(serviceListing)
      .where(where)
      .orderBy(desc(serviceListing.updatedAt))
      .limit(40);
    return rows.map((row) => ({ ...row, city: null as string | null }));
  }

  return db
    .select({
      ...listingCardCoreSelect,
      city: serviceListing.city,
    })
    .from(serviceListing)
    .where(where)
    .orderBy(desc(serviceListing.updatedAt))
    .limit(40);
}

async function queryProviderMedia(vendorId: string) {
  try {
    return await db
      .select({
        id: vendorMedia.id,
        fileUrl: vendorMedia.fileUrl,
        kind: vendorMedia.kind,
        altText: vendorMedia.altText,
        caption: vendorMedia.caption,
        sortOrder: vendorMedia.sortOrder,
      })
      .from(vendorMedia)
      .where(and(eq(vendorMedia.vendorId, vendorId), eq(vendorMedia.approved, true)))
      .orderBy(asc(vendorMedia.sortOrder))
      .limit(24);
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    return [];
  }
}

async function queryProviderReviews(vendorId: string) {
  try {
    return await listPublishedVendorReviews(vendorId, 12);
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    return [];
  }
}

/** Public provider profile — verified vendors only. */
export async function getPublicProviderBySlug(slug: string) {
  let row;
  try {
    row = await queryProviderRow(slug, "full");
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    console.warn("[providers] schema behind 0003; retrying profile without city columns");
    row = await queryProviderRow(slug, "legacy");
  }

  if (!row || !isPubliclyVisibleProvider(row.verificationStatus)) return null;

  let listings;
  try {
    listings = await queryProviderListings(row.id, "full");
  } catch (err) {
    if (!isSchemaLagError(err)) throw err;
    listings = await queryProviderListings(row.id, "legacy");
  }

  const [highlights, media, reviews] = await Promise.all([
    db
      .select({
        id: vendorHighlight.id,
        text: vendorHighlight.text,
        icon: vendorHighlight.icon,
        sortOrder: vendorHighlight.sortOrder,
      })
      .from(vendorHighlight)
      .where(and(eq(vendorHighlight.vendorId, row.id), eq(vendorHighlight.approved, true)))
      .orderBy(asc(vendorHighlight.sortOrder)),
    queryProviderMedia(row.id),
    queryProviderReviews(row.id),
  ]);

  return { ...row, highlights, media, listings, reviews };
}

export async function getPublicProviderBySlugForPage(slug: string) {
  try {
    return await getPublicProviderBySlug(slug);
  } catch (err) {
    console.warn("[provider] profile unavailable", err);
    return null;
  }
}
