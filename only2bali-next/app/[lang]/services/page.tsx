import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { listPublicServices } from "@/lib/repositories/listings-public";

export const revalidate = 120;

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

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ region?: string }>;
}) {
  const lang = (await params).lang as Locale;
  const sp = await searchParams;
  const dict = await getDictionary(lang);
  const region =
    sp.region === "bali" || sp.region === "jakarta" ? sp.region : "all";
  const services = await listPublicServices({ region, limit: 60 });

  const filters = [
    { key: "all", label: dict.services.filterAll, href: `/${lang}/services` },
    { key: "bali", label: dict.services.filterBali, href: `/${lang}/services?region=bali` },
    { key: "jakarta", label: dict.services.filterJakarta, href: `/${lang}/services?region=jakarta` },
  ] as const;

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap">
          <div className="sechead">
            <h1>{dict.services.heading}</h1>
            <p>{dict.services.sub}</p>
          </div>

          <div className="chips" style={{ marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {filters.map((f) => (
              <Link
                key={f.key}
                href={f.href}
                className={`chip${region === f.key || (f.key === "all" && region === "all") ? " chip-on" : ""}`}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {services.length === 0 ? (
            <p className="empty">{dict.services.empty}</p>
          ) : (
            <div className="pkgs">
              {services.map((s) => (
                <article className="pkg" key={s.id}>
                  <div className="pkg-body">
                    <span className="pkg-tag" style={{ position: "static", marginBottom: ".4rem" }}>
                      {s.serviceType.replaceAll("_", " ")}
                    </span>
                    <h3>{s.title}</h3>
                    <div className="meta">
                      {s.businessName}
                      {(s.city || s.area || s.vendorArea) &&
                        ` · ${s.city || s.area || s.vendorArea}`}
                    </div>
                    {s.description && (
                      <p style={{ fontSize: ".9rem", color: "var(--muted)", margin: 0 }}>
                        {s.description.slice(0, 140)}
                        {s.description.length > 140 ? "…" : ""}
                      </p>
                    )}
                    <div className="chips">
                      <span className="chip">{dict.services.verified}</span>
                      {s.ratingCount > 0 && s.ratingAvg && (
                        <span className="chip">
                          ★ {s.ratingAvg} ({s.ratingCount})
                        </span>
                      )}
                    </div>
                    <div className="pkg-foot">
                      <div className="price">
                        {money(s.priceAmount, s.priceCurrency)}
                        <small>
                          {dict.services.from} · {s.priceUnit.replaceAll("_", " ")}
                        </small>
                      </div>
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
