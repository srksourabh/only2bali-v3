import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { listPublicProvidersForPage } from "@/lib/repositories/providers-public";
import ProvidersBrowse from "./ProvidersBrowse";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  return {
    title: `${dict.nav.providers} — Only2Bali`,
    description: dict.providers.sub,
  };
}

export default async function ProvidersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  const providers = await listPublicProvidersForPage({ region: "all", limit: 60 });

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap">
          <div className="sechead">
            <h1>{dict.providers.heading}</h1>
            <p>{dict.providers.sub}</p>
          </div>

          <ProvidersBrowse
            lang={lang}
            providers={providers}
            copy={{
              empty: dict.providers.empty,
              filterAll: dict.services.filterAll,
              filterBali: dict.services.filterBali,
              filterJakarta: dict.services.filterJakarta,
              verified: dict.providers.verified,
              viewCta: dict.providers.viewCta,
            }}
          />
        </div>
      </section>
    </main>
  );
}
