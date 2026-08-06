import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { listPublicServices } from "@/lib/repositories/listings-public";

export const revalidate = 120;

const REGIONS: Record<string, { name: string; blurb: string; filter?: "bali" | "jakarta" }> = {
  bali: {
    name: "Bali",
    blurb: "Temples, coasts, Ubud, Nusa islands — the core circuits and most of our verified supply.",
    filter: "bali",
  },
  jakarta: {
    name: "Jakarta",
    blurb: "City stays, airport logistics, dining and add-on services for groups entering Indonesia.",
    filter: "jakarta",
  },
};

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; region: string }>;
}): Promise<Metadata> {
  const { region } = await params;
  const meta = REGIONS[region];
  if (!meta) return { title: "Destination — Only2Bali" };
  return { title: `${meta.name} — Only2Bali`, description: meta.blurb };
}

export default async function DestinationRegionPage({
  params,
}: {
  params: Promise<{ lang: string; region: string }>;
}) {
  const { lang: langRaw, region } = await params;
  const lang = langRaw as Locale;
  const meta = REGIONS[region];
  if (!meta?.filter) notFound();

  const dict = await getDictionary(lang);
  const services = await listPublicServices({ region: meta.filter, limit: 24 });

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap">
          <Link href={`/${lang}/destinations`} className="bookinglink">
            ← {dict.nav.destinations}
          </Link>
          <div className="sechead" style={{ marginTop: "1rem" }}>
            <h1>{meta.name}</h1>
            <p>{meta.blurb}</p>
          </div>
          {services.length === 0 ? (
            <p className="empty">{dict.services.empty}</p>
          ) : (
            <div className="pkgs">
              {services.map((s) => (
                <article className="pkg" key={s.id}>
                  <div className="pkg-body">
                    <h3>{s.title}</h3>
                    <div className="meta">
                      <Link href={`/${lang}/providers/${s.vendorSlug}`}>{s.businessName}</Link>
                      {s.ratingCount > 0 && s.ratingAvg ? ` · ★ ${s.ratingAvg}` : ""}
                    </div>
                    <div className="pkg-foot">
                      <div className="price">{money(s.priceAmount, s.priceCurrency)}</div>
                      <Link className="btn btn-solid btn-sm" href={`/${lang}/services/${s.id}`}>
                        {dict.services.viewCta}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
