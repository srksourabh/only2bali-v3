import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 300;

const REGIONS = [
  {
    slug: "bali",
    name: "Bali",
    blurb: "Temples, coasts, Ubud, Nusa islands — the core circuits and most of our verified supply.",
  },
  {
    slug: "jakarta",
    name: "Jakarta",
    blurb: "City stays, airport logistics, dining and add-on services for groups entering Indonesia.",
  },
  {
    slug: "yogyakarta",
    name: "Yogyakarta",
    blurb: "Coming next — Borobudur, Prambanan and central Java stays for temple-and-culture groups.",
    soon: true,
  },
  {
    slug: "lombok",
    name: "Lombok",
    blurb: "Coming next — quieter coasts and Gili day trips as supply comes online.",
    soon: true,
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  return {
    title: `${dict.nav.destinations} — Only2Bali`,
    description: dict.destinations.sub,
  };
}

export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap">
          <div className="sechead">
            <h1>{dict.destinations.heading}</h1>
            <p>{dict.destinations.sub}</p>
          </div>
          <div className="pkgs">
            {REGIONS.map((r) => (
              <article className="pkg" key={r.slug}>
                <div className="pkg-body">
                  <h3>{r.name}</h3>
                  <p style={{ fontSize: ".95rem", color: "var(--muted)" }}>{r.blurb}</p>
                  <div className="pkg-foot">
                    {"soon" in r && r.soon ? (
                      <span className="chip">Coming soon</span>
                    ) : (
                      <Link className="btn btn-solid btn-sm" href={`/${lang}/destinations/${r.slug}`}>
                        {dict.services.viewCta}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
