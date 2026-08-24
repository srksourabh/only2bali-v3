"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { NotchNav } from "@/components/ui/notch-nav";

type NavLabels = {
  home: string;
  destinations: string;
  providers: string;
  services: string;
  packages: string;
  guarantee: string;
};

function activeFromPath(pathname: string, lang: Locale, hash: string): string {
  const rest = pathname.replace(new RegExp(`^/${lang}(?=/|$)`), "") || "/";

  if (rest.startsWith("/destinations")) return "destinations";
  if (rest.startsWith("/providers")) return "providers";
  if (rest.startsWith("/services")) return "services";
  if (rest.startsWith("/packages")) return "packages";
  if (rest.startsWith("/food") || rest.startsWith("/about")) return "guarantee";
  if ((rest === "/" || rest === "") && hash === "#guarantee") return "guarantee";
  if (rest === "/" || rest === "") return "home";
  return "";
}

export default function SiteNotchNav({ lang, labels }: { lang: Locale; labels: NavLabels }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  const items = useMemo(
    () => [
      { value: "home", label: labels.home, href: `/${lang}` },
      { value: "destinations", label: labels.destinations, href: `/${lang}/destinations` },
      { value: "providers", label: labels.providers, href: `/${lang}/providers` },
      { value: "services", label: labels.services, href: `/${lang}/services` },
      { value: "packages", label: labels.packages, href: `/${lang}/packages` },
      { value: "guarantee", label: labels.guarantee, href: `/${lang}#guarantee` },
    ],
    [lang, labels],
  );

  return (
    <div className="navlinks">
      <NotchNav items={items} value={activeFromPath(pathname, lang, hash)} ariaLabel="Primary" />
    </div>
  );
}
