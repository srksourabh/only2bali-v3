import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { locales, defaultLocale, isLocale } from "@/lib/i18n/config";
import { clerkConfigured } from "@/lib/auth/clerk";

/**
 * Every page lives under /{locale}. This sends a bare path to the reader's
 * language: an explicit choice they made earlier wins, then Accept-Language,
 * then English.
 */
function pickLocale(req: NextRequest): string {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && isLocale(cookie)) return cookie;

  const header = req.headers.get("accept-language");
  if (header) {
    const ranked = header
      .split(",")
      .map((part) => {
        const [tag, q] = part.trim().split(";q=");
        return { tag: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
      })
      .sort((a, b) => b.q - a.q);

    for (const { tag } of ranked) {
      if (isLocale(tag)) return tag;
    }
  }

  return defaultLocale;
}

function localeResponse(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) return null;

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return null;

  const locale = pickLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const redirect = NextResponse.redirect(url);

  /**
   * This redirect is per-visitor: the target comes from their NEXT_LOCALE
   * cookie and their Accept-Language. It shipped as `public, max-age=0,
   * must-revalidate` with no Vary header at all, which tells every shared
   * cache that `/` has one answer for everybody - so a Hindi reader's
   * redirect could be handed to an English one, and a browser could pin
   * whichever it saw first and stop asking. A pinned bad entry is a bare
   * domain that will not open while every other path works.
   *
   * Never store it, and say what it varies on for any cache that ignores that.
   */
  redirect.headers.set("Cache-Control", "no-store, must-revalidate");
  redirect.headers.set("Vary", "Accept-Language, Cookie");

  return redirect;
}

function localeOnlyMiddleware(req: NextRequest) {
  return localeResponse(req) ?? NextResponse.next();
}

const withClerk = clerkMiddleware(async (_auth, req) => {
  return localeResponse(req) ?? NextResponse.next();
});

/**
 * Clerk middleware only when keys are set. Otherwise keep the original
 * locale-only behaviour so deploys without Clerk stay healthy.
 */
export default clerkConfigured() ? withClerk : localeOnlyMiddleware;

export const config = {
  matcher: [
    // Pages + API (Clerk needs API for session); skip static assets.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)",
    "/(api|trpc)(.*)",
  ],
};
