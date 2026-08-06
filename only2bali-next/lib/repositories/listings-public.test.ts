import { describe, it, expect } from "vitest";
import { isPubliclyVisibleListing } from "./listings-public";

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
