"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { providerCoverImage } from "@/lib/media/listing-art";
import { listingMatchesRegion, type RegionFilter } from "@/lib/marketplace-region";

export type BrowseProvider = {
  slug: string;
  businessName: string;
  vendorType: string | null;
  description: string | null;
  city: string | null;
  baseArea: string | null;
  coverImage: string | null;
  ratingCount: number;
  ratingAvg: string | number | null;
};

export default function ProvidersBrowse({
  lang,
  providers,
  copy,
}: {
  lang: string;
  providers: BrowseProvider[];
  copy: {
    empty: string;
    filterAll: string;
    filterBali: string;
    filterJakarta: string;
    verified: string;
    viewCta: string;
  };
}) {
  const [region, setRegion] = useState<RegionFilter>("all");
  const filtered = useMemo(
    () =>
      providers.filter((p) =>
        listingMatchesRegion({ city: p.city, vendorArea: p.baseArea, vendorCity: p.city }, region)
      ),
    [providers, region]
  );

  const filters: { key: RegionFilter; label: string }[] = [
    { key: "all", label: copy.filterAll },
    { key: "bali", label: copy.filterBali },
    { key: "jakarta", label: copy.filterJakarta },
  ];

  return (
    <>
      <div className="chips" style={{ marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {filters.map((f) => (
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

      {filtered.length === 0 ? (
        <p className="empty">{copy.empty}</p>
      ) : (
        <div className="pkgs">
          {filtered.map((p) => (
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
                  <span className="chip">{copy.verified}</span>
                  {p.ratingCount > 0 && p.ratingAvg && (
                    <span className="chip">
                      ★ {p.ratingAvg} ({p.ratingCount})
                    </span>
                  )}
                </div>
                <div className="pkg-foot">
                  <div />
                  <Link className="btn btn-solid btn-sm" href={`/${lang}/providers/${p.slug}`}>
                    {copy.viewCta}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
