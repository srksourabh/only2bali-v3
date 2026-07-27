import { listPackageCards, type PackageCard } from "./catalog";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

/**
 * What the homepage actually renders for a package.
 *
 * Facts come from Postgres — price, nights, the next real departure and how many
 * seats are left. Marketing copy comes from the dictionary, because translating
 * database rows per request into seven languages is not a thing you want to do
 * at read time.
 *
 * They are joined on `slug`.
 */
export interface HomePackage {
  slug: string;
  tag: string;
  name: string;
  meta: string;
  price: string;
  why: string[];
  chips: string[];
  /** Present only when the row came from the database. */
  live: {
    days: number;
    nights: number;
    places: string[];
    nextDeparture: { startDate: string; priceAmount: number; seatsAvailable: number } | null;
  } | null;
}

const MONEY: Record<string, string> = { INR: "en-IN", USD: "en-US" };

function formatMoney(paise: number, currency: string): string {
  return new Intl.NumberFormat(MONEY[currency] ?? "en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatDeparture(iso: string, locale: Locale): string {
  // Indic locales fall back to en-IN formatting rather than risking an
  // unsupported locale throwing at render time.
  const tag = locale === "en" ? "en-GB" : `${locale}-IN`;
  try {
    return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));
  }
}

/**
 * Reads the catalogue, falling back to dictionary-only content if the database
 * is unreachable.
 *
 * The homepage is marketing: it must render even when Postgres is down. What it
 * loses in that case is the live departure date and seat count, which is the
 * honest degradation — a stale price is better than a blank page, and no date at
 * all is better than a wrong one.
 */
export async function getHomePackages(
  dict: Dictionary,
  locale: Locale
): Promise<{ packages: HomePackage[]; source: "database" | "fallback" }> {
  const fromDict = new Map(dict.packages.items.map((i) => [i.slug, i]));

  let rows: PackageCard[] = [];
  try {
    rows = await listPackageCards({ limit: 3 });
  } catch (err) {
    console.error("[homepage] catalogue unavailable, using dictionary content", err);
    return {
      packages: dict.packages.items.map((i) => ({ ...i, why: [...i.why], chips: [...i.chips], live: null })),
      source: "fallback",
    };
  }

  if (rows.length === 0) {
    return {
      packages: dict.packages.items.map((i) => ({ ...i, why: [...i.why], chips: [...i.chips], live: null })),
      source: "fallback",
    };
  }

  const packages = rows.map((row): HomePackage => {
    const copy = fromDict.get(row.slug);

    return {
      slug: row.slug,
      // Translated where we have it; the database value is the English original.
      tag: copy?.tag ?? row.circuitKeys[0] ?? "",
      name: copy?.name ?? row.name,
      why: copy?.why ? [...copy.why] : row.highlights,
      chips: copy?.chips ? [...copy.chips] : row.protocols,
      // Built from real columns rather than a hardcoded string, so a price or a
      // night count changed in the database shows up here immediately.
      meta: `${row.days} ${dict.packages.days} · ${row.nights} ${dict.packages.nights} · ${row.places.join(", ")}`,
      // The card is the latest admin/partner offer. Database package rows may
      // carry higher premium inventory rates, but the landing page should not
      // imply that every Bali trip starts at the premium partner price.
      price: copy?.price ?? formatMoney(row.basePriceAmount, row.basePriceCurrency),
      live: {
        days: row.days,
        nights: row.nights,
        places: row.places,
        nextDeparture: row.nextDeparture,
      },
    };
  });

  return { packages, source: "database" };
}
