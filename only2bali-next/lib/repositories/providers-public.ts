import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceListing, vendor, vendorHighlight, vendorMedia } from "@/lib/db/schema";
import { listPublishedVendorReviews } from "@/lib/repositories/reviews";

export type PublicProviderFilters = {
  region?: "bali" | "jakarta" | "all";
  limit?: number;
};

/** Pure gate used by tests and by the repository. */
export function isPubliclyVisibleProvider(verificationStatus: string): boolean {
  return verificationStatus === "verified";
}

function providerRegionClause(region: PublicProviderFilters["region"]) {
  if (!region || region === "all") return undefined;
  if (region === "jakarta") {
    return or(ilike(vendor.city, "%jakarta%"), ilike(vendor.baseArea, "%jakarta%"));
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

/** Public directory — verified vendors only. */
export async function listPublicProviders(filters: PublicProviderFilters = {}) {
  const clauses = [eq(vendor.verificationStatus, "verified")];
  const region = providerRegionClause(filters.region);
  if (region) clauses.push(region);

  return db
    .select({
      slug: vendor.slug,
      businessName: vendor.businessName,
      vendorType: vendor.vendorType,
      description: vendor.description,
      baseArea: vendor.baseArea,
      city: vendor.city,
      logo: vendor.logo,
      coverImage: vendor.coverImage,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
      languages: vendor.languages,
    })
    .from(vendor)
    .where(and(...clauses))
    .orderBy(desc(vendor.ratingCount), asc(vendor.businessName))
    .limit(filters.limit ?? 60);
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

/** Public provider profile — verified vendors only. */
export async function getPublicProviderBySlug(slug: string) {
  const [row] = await db
    .select({
      id: vendor.id,
      slug: vendor.slug,
      businessName: vendor.businessName,
      vendorType: vendor.vendorType,
      description: vendor.description,
      baseArea: vendor.baseArea,
      city: vendor.city,
      country: vendor.country,
      logo: vendor.logo,
      coverImage: vendor.coverImage,
      languages: vendor.languages,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
      verificationStatus: vendor.verificationStatus,
      verifiedAt: vendor.verifiedAt,
    })
    .from(vendor)
    .where(eq(vendor.slug, slug))
    .limit(1);

  if (!row || !isPubliclyVisibleProvider(row.verificationStatus)) return null;

  const [highlights, media, listings, reviews] = await Promise.all([
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
    db
      .select({
        id: vendorMedia.id,
        fileUrl: vendorMedia.fileUrl,
        kind: vendorMedia.kind,
        altText: vendorMedia.altText,
        caption: vendorMedia.caption,
        sortOrder: vendorMedia.sortOrder,
      })
      .from(vendorMedia)
      .where(and(eq(vendorMedia.vendorId, row.id), eq(vendorMedia.approved, true)))
      .orderBy(asc(vendorMedia.sortOrder))
      .limit(24),
    db
      .select({
        id: serviceListing.id,
        title: serviceListing.title,
        serviceType: serviceListing.serviceType,
        area: serviceListing.area,
        city: serviceListing.city,
        priceAmount: serviceListing.priceAmount,
        priceCurrency: serviceListing.priceCurrency,
        priceUnit: serviceListing.priceUnit,
        images: serviceListing.images,
        tier: serviceListing.tier,
      })
      .from(serviceListing)
      .where(
        and(
          eq(serviceListing.vendorId, row.id),
          eq(serviceListing.status, "active"),
          eq(serviceListing.active, true)
        )
      )
      .orderBy(desc(serviceListing.updatedAt))
      .limit(40),
    listPublishedVendorReviews(row.id, 12),
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
