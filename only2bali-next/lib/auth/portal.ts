import type { Locale } from "@/lib/i18n/config";

export type PortalRole = "traveller" | "vendor" | "admin";

export function portalHomePath(role: PortalRole, lang: Locale): string {
  if (role === "vendor") return `/${lang}/provider`;
  if (role === "admin") return `/${lang}/admin`;
  return `/${lang}/account`;
}
