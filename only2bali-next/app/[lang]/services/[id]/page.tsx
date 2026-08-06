import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { getSessionUser } from "@/lib/auth";
import { getPublicServiceById, listListingAvailability } from "@/lib/repositories/listings-public";
import { listPublishedVendorReviews } from "@/lib/repositories/reviews";
import ServiceBookForm from "../ServiceBookForm";

export const dynamic = "force-dynamic";

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

  const user = await getSessionUser();
  const [reviews, availability] = await Promise.all([
    listPublishedVendorReviews(service.vendorId, 8),
    listListingAvailability(id),
  ]);

  const openDates = (availability?.days ?? []).filter((d) => d.bookable).map((d) => d.date);
  const defaultDate = openDates[0] ?? null;

  const bookCopy = {
    bookNow: dict.services.bookNow,
    booking: dict.services.booking,
    signedInRequired: dict.services.signedInRequired,
    signIn: dict.services.signIn,
    leadName: dict.services.leadName,
    pax: dict.services.pax,
    protocol: dict.services.protocol,
    date: dict.services.date,
    success: dict.services.success,
    errGeneric: dict.services.errGeneric,
    protocols: dict.guarantee.protocols,
  };
  const payCopy = {
    payNow: dict.account.payNow,
    paying: dict.account.paying,
    paid: dict.account.paid,
    holdExpired: dict.account.holdExpired,
    errSetup: dict.account.payErrSetup,
    errGeneric: dict.account.payErrGeneric,
  };

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
          </div>

          <ServiceBookForm
            listingId={service.id}
            lang={lang}
            loginHref={`/${lang}/login?next=/${lang}/services/${service.id}`}
            signedIn={Boolean(user)}
            defaultDate={defaultDate}
            openDates={openDates}
            capacityMin={service.capacityMin}
            capacityMax={service.capacityMax}
            bookCopy={bookCopy}
            payCopy={payCopy}
          />

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
