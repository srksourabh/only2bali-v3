/**
 * Platform take vs vendor net. Money stays integer minor units.
 *
 * Rule for new bookings:
 *   - Catalogue / Only2Bali packages use the admin-editable platform default
 *     (stored as a decimal string, default 0.1000 = 10%).
 *   - A vendor-attached booking (listing or accepted offer) uses
 *     vendor.commissionRate when it is present and finite. That preserves
 *     existing 0.12–0.18 vendor deals. The platform default is the fallback,
 *     not a floor that silently raises those rates.
 *   - Changing the admin default never rewrites booked rows or vendor rates.
 */
export const DEFAULT_PLATFORM_FEE_RATE = 0.1;
export const DEFAULT_PLATFORM_FEE_RATE_STRING = "0.1000";
export const PLATFORM_FEE_SETTING_KEY = "platform_fee_rate";

const MIN_RATE = 0;
const MAX_RATE = 0.5;

export function clampFeeRate(rate: number): number {
  if (!Number.isFinite(rate)) return DEFAULT_PLATFORM_FEE_RATE;
  return Math.min(MAX_RATE, Math.max(MIN_RATE, rate));
}

export function parseFeeRate(
  value: string | number | null | undefined,
  fallback = DEFAULT_PLATFORM_FEE_RATE
): number {
  if (value === null || value === undefined || value === "") return clampFeeRate(fallback);
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return clampFeeRate(fallback);
  return clampFeeRate(n);
}

export function toFeeRateString(rate: number): string {
  return clampFeeRate(rate).toFixed(4);
}

export function percentToFeeRate(percent: number): number {
  return clampFeeRate(percent / 100);
}

export function feeRateToPercent(rate: number): number {
  return Number((clampFeeRate(rate) * 100).toFixed(2));
}

/** Vendor rate wins when set; otherwise the platform default. */
export function resolveCommissionRate(
  vendorRate: string | number | null | undefined,
  platformDefault: number = DEFAULT_PLATFORM_FEE_RATE
): number {
  if (vendorRate === null || vendorRate === undefined || vendorRate === "") {
    return clampFeeRate(platformDefault);
  }
  const n = typeof vendorRate === "number" ? vendorRate : Number(vendorRate);
  if (!Number.isFinite(n)) return clampFeeRate(platformDefault);
  return clampFeeRate(n);
}

export function splitGrossAmount(
  grossMinor: number,
  rate: number
): { commissionAmount: number; netAmount: number; rate: number; rateString: string } {
  if (!Number.isInteger(grossMinor) || grossMinor <= 0) {
    throw new Error("Gross amount must be a positive integer in minor units.");
  }
  const safeRate = clampFeeRate(rate);
  const commissionAmount = Math.round(grossMinor * safeRate);
  return {
    commissionAmount,
    netAmount: grossMinor - commissionAmount,
    rate: safeRate,
    rateString: toFeeRateString(safeRate),
  };
}
