import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const BASE_URL = "https://only2bali.com";
const PUBLIC_ROUTES = [
  "",
  "/about",
  "/destinations",
  "/faq",
  "/food",
  "/inquiry",
  "/planner",
  "/services",
  "/vendors",
  "/privacy",
  "/terms",
];
const PUBLIC_PACKAGE_SLUGS = ["sattvik-serenity", "bali-veg-explorer", "active-bali"];

export default function sitemap(): MetadataRoute.Sitemap {
  const generatedAt = new Date();
  return locales.flatMap((lang) => [
    ...PUBLIC_ROUTES.map((route) => ({
      url: `${BASE_URL}/${lang}${route}`,
      lastModified: generatedAt,
      changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
      priority: route === "" ? 1 : 0.8,
    })),
    ...PUBLIC_PACKAGE_SLUGS.map((slug) => ({
      url: `${BASE_URL}/${lang}/packages/${slug}`,
      lastModified: generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ]);
}
