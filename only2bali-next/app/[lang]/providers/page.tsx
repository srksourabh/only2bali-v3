import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { providerCoverImage } from "@/lib/media/listing-art";
import { listPublicProvidersForPage } from "@/lib/repositories/providers-public";

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
  const providers = await listPublicProvidersForPage({ region, limit: 60 });

  const filters = [
    { key: "all", label: dict.services.filterAll, href: `/${lang}/providers` },
    { key: "bali", label: dict.services.filterBali, href: `/${lang}/providers?region=bali` },
    { key: "jakarta", label: dict.services.filterJakarta, href: `/${lang}/providers?region=jakarta` },
  ] as const;

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap">
          <div className="sechead">
            <h1>{dict.providers.heading}</h1>
            <p>{dict.providers.sub}</p>
          </div>

          <div className="chips" style={{ marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {filters.map((f) => (
              <Link
                key={f.key}
                href={f.href}
                className={`chip${region === f.key ? " chip-on" : ""}`}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {providers.length === 0 ? (
            <p className="empty">{dict.providers.empty}</p>
          ) : (
            <div className="pkgs">
              {providers.map((p) => (
                <article className="pkg" key={p.slug}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={providerCoverImage({
                      vendorType: p.vendorType,
                      coverImage: p.coverImage,
                      businessName: p.businessName,
                    })}
                    alt=""
                    style={{ width: "100%", height: "160px", objectFit: "cover" }}
                  />
                  <div className="pkg-body">
                    <span className="pkg-tag" style={{ position: "static", marginBottom: ".4rem" }}>
                      {(p.vendorType ?? "provider").replaceAll("_", " ")}
                    </span>
                    <h3>{p.businessName}</h3>
                    <div className="meta">{[p.city, p.baseArea].filter(Boolean).join(" · ")}</div>
                    {p.description && (
                      <p style={{ fontSize: ".9rem", color: "var(--muted)", margin: 0 }}>
                        {p.description.slice(0, 140)}
                        {p.description.length > 140 ? "…" : ""}
                      </p>
                    )}
                    <div className="chips">
                      <span className="chip">{dict.providers.verified}</span>
                      {p.ratingCount > 0 && p.ratingAvg && (
                        <span className="chip">
                          ★ {p.ratingAvg} ({p.ratingCount})
                        </span>
                      )}
                    </div>
                    <div className="pkg-foot">
                      <div />
                      <Link className="btn btn-solid btn-sm" href={`/${lang}/providers/${p.slug}`}>
                        {dict.providers.viewCta}
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
