import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { getPublicServiceById } from "@/lib/repositories/listings-public";
import { listPublishedVendorReviews } from "@/lib/repositories/reviews";

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
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await getPublicServiceById(id);
  if (!service) return { title: "Service — Only2Bali" };
  return {
    title: `${service.title} — Only2Bali`,
    description: service.description ?? service.businessName,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langRaw, id } = await params;
  const lang = langRaw as Locale;
  const dict = await getDictionary(lang);
  const service = await getPublicServiceById(id);
  if (!service) notFound();

  const reviews = await listPublishedVendorReviews(service.vendorId, 8);

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap" style={{ maxWidth: "52rem" }}>
          <Link href={`/${lang}/services`} className="bookinglink">
            ← {dict.services.back}
          </Link>

          <header className="accounthead" style={{ marginTop: "1.2rem" }}>
            <div>
              <span className="eyebrow">
                {service.serviceType.replaceAll("_", " ")}
                {(service.city || service.area) && ` · ${service.city || service.area}`}
              </span>
              <h1>{service.title}</h1>
              <p className="empty">
                {service.businessName}
                {service.ratingCount > 0 && service.ratingAvg
                  ? ` · ★ ${service.ratingAvg} (${service.ratingCount})`
                  : ""}
              </p>
            </div>
          </header>

          <div className="acard" style={{ marginTop: "1.5rem" }}>
            <div className="price" style={{ marginBottom: "1rem" }}>
              {money(service.priceAmount, service.priceCurrency)}
              <small>
                {" "}
                {dict.services.from} · {service.priceUnit.replaceAll("_", " ")} · {service.tier}
              </small>
            </div>
            {service.description && <p>{service.description}</p>}
            {service.inclusions && service.inclusions.length > 0 && (
              <>
                <h2 style={{ fontSize: "1.05rem" }}>Inclusions</h2>
                <ul className="why">
                  {service.inclusions.map((item) => (
                    <li key={item}>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="close-actions" style={{ marginTop: "1.5rem" }}>
              <Link className="btn btn-primary" href={`/${lang}/inquiry`}>
                {dict.services.bookCta} →
              </Link>
              <Link className="btn btn-ghost" href={`/${lang}/planner`}>
                {dict.nav.plan}
              </Link>
            </div>
          </div>

          {reviews.length > 0 && (
            <div className="acard" style={{ marginTop: "1.2rem" }}>
              <h2 style={{ fontSize: "1.05rem" }}>{dict.services.reviewsHeading}</h2>
              <ul className="admin-list">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <b>★ {r.rating}</b>
                    <span>{r.comment || "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
