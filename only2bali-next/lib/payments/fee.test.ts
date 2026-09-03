import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLATFORM_FEE_RATE,
  feeRateToPercent,
  parseFeeRate,
  percentToFeeRate,
  resolveCommissionRate,
  splitGrossAmount,
  toFeeRateString,
} from "./fee";

describe("splitGrossAmount", () => {
  it("keeps 10% and pays the vendor the rest in integer paise", () => {
    const split = splitGrossAmount(10_000_00, 0.1);
    expect(split.commissionAmount).toBe(1_000_00);
    expect(split.netAmount).toBe(9_000_00);
    expect(split.rateString).toBe("0.1000");
    expect(split.commissionAmount + split.netAmount).toBe(10_000_00);
  });

  it("uses banker's-adjacent Math.round on the platform take", () => {
    // 101 paise * 10% = 10.1 → 10
    expect(splitGrossAmount(101, 0.1)).toEqual({
      commissionAmount: 10,
      netAmount: 91,
      rate: 0.1,
      rateString: "0.1000",
    });
  });

  it("refuses a non-integer or non-positive gross", () => {
    expect(() => splitGrossAmount(10.5, 0.1)).toThrow(/minor units/);
    expect(() => splitGrossAmount(0, 0.1)).toThrow(/minor units/);
  });
});

describe("resolveCommissionRate", () => {
  it("lets an existing vendor rate override the platform default", () => {
    expect(resolveCommissionRate("0.1800", 0.1)).toBe(0.18);
    expect(resolveCommissionRate(0.12, 0.1)).toBe(0.12);
  });

  it("falls back to the platform default when the vendor rate is missing", () => {
    expect(resolveCommissionRate(null, 0.1)).toBe(0.1);
    expect(resolveCommissionRate("nope", DEFAULT_PLATFORM_FEE_RATE)).toBe(0.1);
  });
});

describe("fee rate parsing", () => {
  it("clamps and formats like vendor.commission_rate", () => {
    expect(parseFeeRate("0.1000")).toBe(0.1);
    expect(toFeeRateString(0.1)).toBe("0.1000");
    expect(percentToFeeRate(10)).toBe(0.1);
    expect(feeRateToPercent(0.1)).toBe(10);
    expect(parseFeeRate("9")).toBe(0.5);
  });
});
