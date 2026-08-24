import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { listingCardImage } from "@/lib/media/listing-art";
import { listPublicServicesForPage } from "@/lib/repositories/listings-public";
import { listCompliantPublicServices } from "@/lib/repositories/compliance-match";

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

const SERVICE_TYPES = [
  "restaurant",
  "accommodation",
  "transport",
  "guide",
  "cook",
  "activity_operator",
  "tour_agency",
] as const;

type ProtocolFilter = "jain" | "vegetarian" | "vegan";

function hrefFor(
  lang: string,
  next: { region?: string; type?: string; protocol?: string }
) {
  const params = new URLSearchParams();
  if (next.region && next.region !== "all") params.set("region", next.region);
  if (next.type) params.set("type", next.type);
  if (next.protocol) params.set("protocol", next.protocol);
  const q = params.toString();
  return q ? `/${lang}/services?${q}` : `/${lang}/services`;
}

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ region?: string; type?: string; protocol?: string }>;
}) {
  const lang = (await params).lang as Locale;
  const sp = await searchParams;
  const dict = await getDictionary(lang);
  const region =
    sp.region === "bali" || sp.region === "jakarta" ? sp.region : "all";
  const serviceType = SERVICE_TYPES.includes(sp.type as (typeof SERVICE_TYPES)[number])
    ? (sp.type as (typeof SERVICE_TYPES)[number])
    : undefined;
  const protocol: ProtocolFilter | undefined =
    sp.protocol === "jain" || sp.protocol === "vegetarian" || sp.protocol === "vegan"
      ? sp.protocol
      : undefined;

  const services = protocol
    ? (await listCompliantPublicServices({ protocol, region, limit: 60 }).catch(() => [])).filter(
        (s) => !serviceType || s.serviceType === serviceType
      )
    : await listPublicServicesForPage({ region, serviceType, limit: 60 });

  const regionFilters = [
    { key: "all", label: dict.services.filterAll, href: hrefFor(lang, { type: serviceType, protocol }) },
    { key: "bali", label: dict.services.filterBali, href: hrefFor(lang, { region: "bali", type: serviceType, protocol }) },
    { key: "jakarta", label: dict.services.filterJakarta, href: hrefFor(lang, { region: "jakarta", type: serviceType, protocol }) },
  ] as const;

  const typeFilters = [
    { key: "", label: "All types", href: hrefFor(lang, { region, protocol }) },
    ...SERVICE_TYPES.map((key) => ({
      key,
      label: key.replaceAll("_", " "),
      href: hrefFor(lang, { region, type: key, protocol }),
    })),
  ];

  const protocolFilters = [
    { key: "", label: dict.services.protocol, href: hrefFor(lang, { region, type: serviceType }) },
    { key: "jain", label: dict.guarantee.protocols.jain, href: hrefFor(lang, { region, type: serviceType, protocol: "jain" }) },
    { key: "vegetarian", label: dict.guarantee.protocols.veg, href: hrefFor(lang, { region, type: serviceType, protocol: "vegetarian" }) },
    { key: "vegan", label: dict.guarantee.protocols.vegan, href: hrefFor(lang, { region, type: serviceType, protocol: "vegan" }) },
  ];

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap">
          <div className="sechead">
            <h1>{dict.services.heading}</h1>
            <p>{dict.services.sub}</p>
          </div>

          <div className="chips" style={{ marginBottom: "0.75rem", flexWrap: "wrap" }}>
            {regionFilters.map((f) => (
              <Link
                key={f.key}
                href={f.href}
                className={`chip${region === f.key || (f.key === "all" && region === "all") ? " chip-on" : ""}`}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <div className="chips" style={{ marginBottom: "0.75rem", flexWrap: "wrap" }}>
            {typeFilters.map((f) => (
              <Link
                key={f.key || "all-types"}
                href={f.href}
                className={`chip${(serviceType ?? "") === f.key ? " chip-on" : ""}`}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <div className="chips" style={{ marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {protocolFilters.map((f) => (
              <Link
                key={f.key || "any-protocol"}
                href={f.href}
                className={`chip${(protocol ?? "") === f.key ? " chip-on" : ""}`}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {services.length === 0 ? (
            <p className="empty">{dict.services.empty}</p>
          ) : (
            <div className="pkgs">
              {services.map((s) => {
                const image = listingCardImage({
                  serviceType: s.serviceType,
                  title: s.title,
                  images: s.images,
                  coverImage: "coverImage" in s ? s.coverImage : null,
                });
                return (
                <article className="pkg" key={s.id}>
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt=""
                      style={{ width: "100%", height: "160px", objectFit: "cover" }}
                    />
                  )}
                  <div className="pkg-body">
                    <span className="pkg-tag" style={{ position: "static", marginBottom: ".4rem" }}>
                      {s.serviceType.replaceAll("_", " ")}
                    </span>
                    <h3>{s.title}</h3>
                    <div className="meta">
                      <Link href={`/${lang}/providers/${s.vendorSlug}`}>{s.businessName}</Link>
                      {s.area ? ` · ${s.area}` : ""}
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
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
