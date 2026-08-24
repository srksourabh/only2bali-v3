import { describe, it, expect } from "vitest";
import { isPubliclyVisibleListing, listingMatchesRegion } from "./listings-public";

describe("isPubliclyVisibleListing", () => {
  it("shows only active listings from verified vendors", () => {
    expect(
      isPubliclyVisibleListing({
        listingStatus: "active",
        listingActive: true,
        vendorVerificationStatus: "verified",
      })
    ).toBe(true);
  });

  it("hides draft listings even from verified vendors", () => {
    expect(
      isPubliclyVisibleListing({
        listingStatus: "draft",
        listingActive: true,
        vendorVerificationStatus: "verified",
      })
    ).toBe(false);
  });

  it("hides active listings from unverified vendors", () => {
    expect(
      isPubliclyVisibleListing({
        listingStatus: "active",
        listingActive: true,
        vendorVerificationStatus: "pending",
      })
    ).toBe(false);
  });

  it("matches Jakarta only when the listing is in Jakarta", () => {
    expect(listingMatchesRegion({ city: "Jakarta", area: "Menteng" }, "jakarta")).toBe(true);
    expect(listingMatchesRegion({ city: "Bali", area: "Ubud" }, "jakarta")).toBe(false);
  });

  it("keeps Bali listings out of a Jakarta-only filter", () => {
    expect(listingMatchesRegion({ city: "Ubud", vendorArea: "Bali" }, "bali")).toBe(true);
    expect(listingMatchesRegion({ city: "Jakarta", area: "Menteng" }, "bali")).toBe(false);
  });

  it("hides paused-active false listings", () => {
    expect(
      isPubliclyVisibleListing({
        listingStatus: "active",
        listingActive: false,
        vendorVerificationStatus: "verified",
      })
    ).toBe(false);
  });
});
