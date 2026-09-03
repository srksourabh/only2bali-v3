/** Keep post-authentication redirects on this origin and inside the active locale. */
export function safePostSignInDestination(
  requested: string | null,
  lang: string,
  role: "traveller" | "vendor"
): string {
  const fallback = role === "vendor" ? `/${lang}/provider` : `/${lang}/account`;
  if (!requested?.startsWith(`/${lang}/`) || requested.startsWith("//")) return fallback;
  return requested;
}
