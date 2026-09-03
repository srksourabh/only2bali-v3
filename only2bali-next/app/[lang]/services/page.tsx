import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { listPublicServicesForPage } from "@/lib/repositories/listings-public";
import ServicesBrowse from "./ServicesBrowse";

export const revalidate = 120;

const SERVICE_TYPES = [
  "restaurant",
  "accommodation",
  "transport",
  "guide",
  "cook",
  "activity_operator",
  "tour_agency",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  return {
    title: `${dict.services.heading} — Only2Bali`,
    description: dict.services.sub,
  };
}

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ region?: string; type?: string }>;
}) {
  const lang = (await params).lang as Locale;
  const sp = await searchParams;
  const dict = await getDictionary(lang);
  const services = await listPublicServicesForPage({ region: "all", limit: 60 });
  const initialRegion =
    sp.region === "bali" || sp.region === "jakarta" ? sp.region : "all";
  const initialType = SERVICE_TYPES.includes(sp.type as (typeof SERVICE_TYPES)[number])
    ? sp.type
    : "";

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap">
          <div className="sechead">
            <h1>{dict.services.heading}</h1>
            <p>{dict.services.sub}</p>
          </div>

          <ServicesBrowse
            lang={lang}
            services={services}
            initialRegion={initialRegion}
            initialType={initialType ?? ""}
            copy={{
              empty: dict.services.empty,
              filterAll: dict.services.filterAll,
              filterBali: dict.services.filterBali,
              filterJakarta: dict.services.filterJakarta,
              verified: dict.services.verified,
              from: dict.services.from,
              viewCta: dict.services.viewCta,
            }}
          />
        </div>
      </section>
    </main>
  );
}
