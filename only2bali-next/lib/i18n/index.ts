import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

/**
 * Dictionaries are imported dynamically so a request for /ta does not ship the
 * Devanagari or Telugu strings. Keep the map literal — a computed import path
 * defeats bundler code-splitting.
 */
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en").then((m) => m.en),
  hi: () => import("./dictionaries/hi").then((m) => m.hi),
  ta: () => import("./dictionaries/ta").then((m) => m.ta),
  gu: () => import("./dictionaries/gu").then((m) => m.gu),
  te: () => import("./dictionaries/te").then((m) => m.te),
  kn: () => import("./dictionaries/kn").then((m) => m.kn),
  mr: () => import("./dictionaries/mr").then((m) => m.mr),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}

export type { Dictionary };
export * from "./config";
