import { describe, it, expect } from "vitest";
import { computeListingGrossAmount } from "./listing-price";

describe("computeListingGrossAmount", () => {
  it("multiplies per-person rates by pax", () => {
    expect(
      computeListingGrossAmount({
        priceAmount: 10_000_00,
        priceUnit: "per_person",
        pax: 3,
      })
    ).toBe(30_000_00);
  });

  it("charges once for per-group and per-trip", () => {
    expect(
      computeListingGrossAmount({
        priceAmount: 85_00,
        priceUnit: "per_group",
        pax: 8,
      })
    ).toBe(85_00);
    expect(
      computeListingGrossAmount({
        priceAmount: 50_000_00,
        priceUnit: "per_trip",
        pax: 4,
      })
    ).toBe(50_000_00);
  });

  it("uses a date override when present", () => {
    expect(
      computeListingGrossAmount({
        priceAmount: 10_000_00,
        priceUnit: "per_person",
        pax: 2,
        priceOverrideAmount: 12_000_00,
      })
    ).toBe(24_000_00);
  });

  it("refuses non-positive amounts", () => {
    expect(() =>
      computeListingGrossAmount({ priceAmount: 0, priceUnit: "per_day", pax: 1 })
    ).toThrow(/positive integer/);
  });
});
