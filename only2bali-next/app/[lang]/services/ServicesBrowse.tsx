"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { listingCardImage } from "@/lib/media/listing-art";
import { listingMatchesRegion, type RegionFilter } from "@/lib/marketplace-region";

export type BrowseService = {
  id: string;
  title: string;
  serviceType: string;
  description: string | null;
  area: string | null;
  city?: string | null;
  vendorArea?: string | null;
  vendorCity?: string | null;
  vendorSlug: string;
  businessName: string;
  images: string[] | null;
  coverImage?: string | null;
  ratingCount: number;
  ratingAvg: string | number | null;
  priceAmount: number;
  priceCurrency: string;
  priceUnit: string;
};

const SERVICE_TYPES = [
  "restaurant",
  "accommodation",
  "transport",
  "guide",
  "cook",
  "activity_operator",
  "tour_agency",
] as const;

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);

export default function ServicesBrowse({
  lang,
  services,
  copy,
  initialRegion = "all",
  initialType = "",
}: {
  lang: string;
  services: BrowseService[];
  copy: {
    empty: string;
    filterAll: string;
    filterBali: string;
    filterJakarta: string;
    verified: string;
    from: string;
    viewCta: string;
  };
  initialRegion?: RegionFilter;
  initialType?: string;
}) {
  const [region, setRegion] = useState<RegionFilter>(initialRegion);
  const [serviceType, setServiceType] = useState<string>(initialType);

  const filtered = useMemo(
    () =>
      services.filter(
        (s) =>
          listingMatchesRegion(s, region) && (!serviceType || s.serviceType === serviceType)
      ),
    [services, region, serviceType]
  );

  const regionFilters: { key: RegionFilter; label: string }[] = [
    { key: "all", label: copy.filterAll },
    { key: "bali", label: copy.filterBali },
    { key: "jakarta", label: copy.filterJakarta },
  ];

  return (
    <>
      <div className="chips" style={{ marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {regionFilters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`chip${region === f.key ? " chip-on" : ""}`}
            onClick={() => setRegion(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="chips" style={{ marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className={`chip${serviceType === "" ? " chip-on" : ""}`}
          onClick={() => setServiceType("")}
        >
          All types
        </button>
        {SERVICE_TYPES.map((key) => (
          <button
            key={key}
            type="button"
            className={`chip${serviceType === key ? " chip-on" : ""}`}
            onClick={() => setServiceType(key)}
          >
            {key.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="empty">{copy.empty}</p>
      ) : (
        <div className="pkgs">
          {filtered.map((s) => {
            const image = listingCardImage({
              serviceType: s.serviceType,
              title: s.title,
              images: s.images,
              coverImage: s.coverImage ?? null,
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
                    <span className="chip">{copy.verified}</span>
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
                        {copy.from} · {s.priceUnit.replaceAll("_", " ")}
                      </small>
                    </div>
                    <Link className="btn btn-solid btn-sm" href={`/${lang}/services/${s.id}`}>
                      {copy.viewCta}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
