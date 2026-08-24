/**
 * Food protocols — the single list.
 *
 * This was written out as `["jain", "vegetarian", "vegan"]` in sixteen files,
 * which is how a fourth option becomes a day's work instead of a line. Define
 * it once; every validator, filter, seed and form reads from here.
 *
 * PROTOCOLS is in storage order - Postgres can only append to an enum - and
 * PROTOCOL_DISPLAY_ORDER is what a traveller sees. Keep them separate.
 *
 * A note on `non_veg`, since it looks like it contradicts the premise. It does
 * not. The guarantee Only2Bali sells is that **the protocol a traveller chose
 * is the protocol they get, disclosed meal by meal** — verified, rated, and
 * visible before they book. That promise is worth exactly as much to the mixed
 * family group where one person eats Jain and the rest do not. The compliance
 * machinery is unchanged and still a hard filter: a listing is invisible under
 * a protocol it has no active, non-red compliance row for. What changes is only
 * how many protocols there are to be compliant with.
 */

export const PROTOCOLS = [
  "jain",
  "vegetarian",
  "vegan",
  "satvik",
  "eggetarian",
  "halal",
  "non_veg",
] as const;

export type Protocol = (typeof PROTOCOLS)[number];

/**
 * The order a traveller sees, which is not the order the enum is stored in.
 *
 * Postgres enum values can only be appended without rewriting the type, so the
 * list above has to stay in the order it grew. Presentation is a separate
 * concern: strictest first, because the whole point of the product is that the
 * strict cases are handled properly rather than treated as an awkward
 * variation of everyone else's meal.
 */
export const PROTOCOL_DISPLAY_ORDER = [
  "jain",
  "satvik",
  "vegan",
  "vegetarian",
  "eggetarian",
  "halal",
  "non_veg",
] as const satisfies readonly Protocol[];

/** The three the platform launched with, kept for copy that still says "veg". */
export const VEGETARIAN_PROTOCOLS = ["jain", "satvik", "vegan", "vegetarian"] as const;

export function isProtocol(value: unknown): value is Protocol {
  return typeof value === "string" && (PROTOCOLS as readonly string[]).includes(value);
}

/**
 * Whether a protocol excludes meat, fish and eggs entirely.
 *
 * Used for the veg-guarantee badge, which should not appear on a booking whose
 * protocol never promised one.
 */
export function isVegetarianProtocol(value: Protocol): boolean {
  return (VEGETARIAN_PROTOCOLS as readonly string[]).includes(value);
}

/**
 * English fallbacks. Real copy lives in the dictionaries; these exist so a
 * protocol added to the list is never rendered as a raw enum value while the
 * translations catch up.
 */
export const PROTOCOL_FALLBACK_LABELS: Record<Protocol, string> = {
  jain: "Jain",
  satvik: "Satvik (no onion or garlic)",
  vegan: "Vegan",
  vegetarian: "Pure vegetarian",
  eggetarian: "Vegetarian with egg",
  halal: "Halal",
  non_veg: "No restriction",
};
