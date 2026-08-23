import type { Metadata } from "next";
import {
  Fraunces,
  Inter,
  Noto_Sans_Devanagari,
  Noto_Sans_Tamil,
  Noto_Sans_Gujarati,
  Noto_Sans_Telugu,
  Noto_Sans_Kannada,
} from "next/font/google";
import { getDictionary } from "@/lib/i18n";
import { locales, localeScript, type Locale } from "@/lib/i18n/config";
import CustomCursor from "./components/CustomCursor";
import SiteNav from "./components/SiteNav";
import SiteFooter from "./components/SiteFooter";
import PwaRegister from "./components/PwaRegister";
import ClerkAppProvider from "@/lib/auth/clerk-provider";
import "../globals.css";
import "./brand.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

/**
 * Script faces are declared with preload disabled and applied per locale, so a
 * Tamil reader downloads Tamil and nothing else. Adding a locale means adding
 * its face here and to localeScript.
 */
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-script", display: "swap", preload: false });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-script", display: "swap", preload: false });
const gujarati = Noto_Sans_Gujarati({ subsets: ["gujarati"], variable: "--font-script", display: "swap", preload: false });
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], variable: "--font-script", display: "swap", preload: false });
const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], variable: "--font-script", display: "swap", preload: false });

const scriptFont = { latin: null, devanagari, tamil, gujarati, telugu, kannada } as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);

  return {
    metadataBase: new URL("https://only2bali.com"),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      url: `/${lang}`,
      siteName: "Only2Bali",
      locale: lang,
      type: "website",
    },
    icons: { icon: "/brand/mark.svg" },
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "Only2Bali", statusBarStyle: "default" },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  const script = scriptFont[localeScript[lang]];

  const bodyClass = [fraunces.variable, inter.variable, script?.variable]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={bodyClass}>
        <ClerkAppProvider>
          <CustomCursor />
          <PwaRegister />
          <SiteNav lang={lang} dict={dict} />
          {children}
          <SiteFooter dict={dict} />
        </ClerkAppProvider>
      </body>
    </html>
  );
}
