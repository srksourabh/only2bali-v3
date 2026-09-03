export type RegionFilter = "bali" | "jakarta" | "all";

export function listingMatchesRegion(
  listing: { city?: string | null; area?: string | null; vendorArea?: string | null; vendorCity?: string | null },
  region: RegionFilter | undefined
): boolean {
  if (!region || region === "all") return true;
  const haystack = [listing.city, listing.area, listing.vendorArea, listing.vendorCity]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (region === "jakarta") return haystack.includes("jakarta");
  if (haystack.includes("jakarta") && !/\bbali|ubud|seminyak|canggu|nusa|kuta|sanur|denpasar\b/.test(haystack)) {
    return false;
  }
  return true;
}
