/**
 * Server-side price for a service listing. The client never sends an amount.
 */
export function computeListingGrossAmount(input: {
  priceAmount: number;
  priceUnit: string;
  pax: number;
  priceOverrideAmount?: number | null;
}): number {
  const unit = input.priceOverrideAmount ?? input.priceAmount;
  if (!Number.isInteger(unit) || unit <= 0) {
    throw new Error("Listing price must be a positive integer in minor units.");
  }
  if (input.priceUnit === "per_person") return unit * input.pax;
  return unit;
}
