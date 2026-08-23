import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { getPublicProviderBySlug } from "@/lib/repositories/providers-public";

export const revalidate = 120;

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getPublicProviderBySlug(slug);
  if (!provider) return { title: "Provider — Only2Bali" };
  return {
    title: `${provider.businessName} — Only2Bali`,
    description: provider.description ?? `Verified ${provider.vendorType} on Only2Bali`,
  };
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: langRaw, slug } = await params;
  const lang = langRaw as Locale;
  const dict = await getDictionary(lang);
  const provider = await getPublicProviderBySlug(slug);
  if (!provider) notFound();

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap" style={{ maxWidth: "52rem" }}>
          <Link href={`/${lang}/providers`} className="bookinglink">
            ← {dict.nav.providers}
          </Link>

          <header className="accounthead" style={{ marginTop: "1.2rem" }}>
            <div>
              <span className="eyebrow">
                {provider.vendorType.replaceAll("_", " ")}
                {(provider.city || provider.baseArea) &&
                  ` · ${provider.city || provider.baseArea}`}
              </span>
              <h1>{provider.businessName}</h1>
              <p className="empty">
                {dict.services.verified}
                {provider.ratingCount > 0 && provider.ratingAvg
                  ? ` · ★ ${provider.ratingAvg} (${provider.ratingCount})`
                  : ""}
              </p>
            </div>
          </header>

          {provider.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={provider.coverImage}
              alt=""
              style={{ width: "100%", maxHeight: "280px", objectFit: "cover", marginTop: "1rem" }}
            />
          )}

          {provider.description && (
            <p style={{ marginTop: "1.2rem" }}>{provider.description}</p>
          )}

          {provider.highlights.length > 0 && (
            <ul className="why" style={{ marginTop: "1rem" }}>
              {provider.highlights.map((h) => (
                <li key={h.id}>
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>
          )}

          {provider.media.length > 0 && (
            <div className="chips" style={{ marginTop: "1.5rem", flexWrap: "wrap", gap: ".75rem" }}>
              {provider.media.slice(0, 8).map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={m.fileUrl}
                  alt={m.altText ?? ""}
                  style={{ width: "7rem", height: "7rem", objectFit: "cover" }}
                />
              ))}
            </div>
          )}

          <h2 style={{ marginTop: "2rem", fontSize: "1.2rem" }}>{dict.services.heading}</h2>
          {provider.listings.length === 0 ? (
            <p className="empty">{dict.services.empty}</p>
          ) : (
            <div className="pkgs" style={{ marginTop: "1rem" }}>
              {provider.listings.map((s) => (
                <article className="pkg" key={s.id}>
                  {s.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.images[0]}
                      alt=""
                      style={{ width: "100%", height: "140px", objectFit: "cover" }}
                    />
                  )}
                  <div className="pkg-body">
                    <span className="pkg-tag" style={{ position: "static", marginBottom: ".4rem" }}>
                      {s.serviceType.replaceAll("_", " ")}
                    </span>
                    <h3>{s.title}</h3>
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

          {provider.reviews.length > 0 && (
            <section style={{ marginTop: "2rem" }}>
              <h2 style={{ fontSize: "1.2rem" }}>{dict.account.reviewHeading}</h2>
              <ul className="admin-list">
                {provider.reviews.map((r) => (
                  <li key={r.id}>
                    <b>★ {r.rating}</b>
                    <span>{r.comment ?? ""}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
