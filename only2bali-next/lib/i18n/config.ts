export const locales = ["en", "hi", "ta", "gu", "te", "kn", "mr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Native name first — a speaker should recognise their language without reading English. */
export const localeNames: Record<Locale, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  hi: { native: "हिन्दी", english: "Hindi" },
  ta: { native: "தமிழ்", english: "Tamil" },
  gu: { native: "ગુજરાતી", english: "Gujarati" },
  te: { native: "తెలుగు", english: "Telugu" },
  kn: { native: "ಕನ್ನಡ", english: "Kannada" },
  mr: { native: "मराठी", english: "Marathi" },
};

/**
 * Which script each locale needs. Drives the font loaded for that route so a
 * Tamil reader does not download Devanagari, and an English reader downloads
 * neither.
 */
export const localeScript: Record<Locale, "latin" | "devanagari" | "tamil" | "gujarati" | "telugu" | "kannada"> = {
  en: "latin",
  hi: "devanagari",
  mr: "devanagari",
  ta: "tamil",
  gu: "gujarati",
  te: "telugu",
  kn: "kannada",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
