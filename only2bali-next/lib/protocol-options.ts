import { PROTOCOL_DISPLAY_ORDER, PROTOCOL_FALLBACK_LABELS, type Protocol } from "@/lib/protocols";

/**
 * The dictionary key for each protocol.
 *
 * The keys predate the enum and do not match it — the dictionaries have said
 * `veg` since before `vegetarian` was a stored value — so the mapping is
 * written out rather than derived. Renaming the dictionary keys would be a
 * seven-file change for no gain.
 */
const DICTIONARY_KEY: Record<Protocol, string> = {
  jain: "jain",
  vegetarian: "veg",
  vegan: "vegan",
  satvik: "satvik",
  eggetarian: "eggetarian",
  halal: "halal",
  non_veg: "nonVeg",
};

/**
 * Every protocol a traveller can choose, in display order, labelled in their
 * language. A missing translation falls back to English rather than rendering
 * a raw enum value like `non_veg` at somebody.
 */
export function protocolOptions(
  labels: Partial<Record<string, string>>
): Array<{ value: Protocol; label: string }> {
  return PROTOCOL_DISPLAY_ORDER.map((value) => ({
    value,
    label: labels[DICTIONARY_KEY[value]] ?? PROTOCOL_FALLBACK_LABELS[value],
  }));
}
