import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { formatDeparture, getHomePackages } from "@/lib/repositories/homepage";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  return {
    title: `${dict.nav.packages} — Only2Bali`,
    description: dict.packages.sub,
  };
}

export default async function PackagesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  const { packages } = await getHomePackages(dict, lang, { limit: 24 });

  return (
    <main>
      <section className="packages-band" style={{ paddingTop: "3rem" }}>
        <div className="o2b-wrap">
          <div className="sechead">
            <h1>{dict.packages.heading}</h1>
            <p>{dict.packages.sub}</p>
          </div>

          {packages.length === 0 ? (
            <p className="empty">{dict.packages.empty}</p>
          ) : (
            <div className="pkgs">
              {packages.map((p) => (
                <article className="pkg" key={p.slug}>
                  <div className="pkg-body">
                    {p.tag && (
                      <span className="pkg-tag" style={{ position: "static", marginBottom: ".4rem" }}>
                        {p.tag}
                      </span>
                    )}
                    <h3>{p.name}</h3>
                    <div className="meta">{p.meta}</div>
                    <div className="chips">
                      {p.chips.map((c) => (
                        <span className="chip" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                    {p.live?.nextDeparture && (
                      <div className="next-dep">
                        <span className="dot dot-green" aria-hidden="true" />
                        {formatDeparture(p.live.nextDeparture.startDate, lang)}
                      </div>
                    )}
                    <div className="pkg-foot">
                      <div className="price">
                        {p.price}
                        <small>{dict.packages.perPerson}</small>
                      </div>
                      <Link className="btn btn-solid btn-sm" href={`/${lang}/packages/${p.slug}`}>
                        {dict.packages.checkDates}
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
