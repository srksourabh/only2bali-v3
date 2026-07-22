import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import GuaranteeDemo from "./components/GuaranteeDemo";

const CIRCUIT_ART = {
  ramayana: { src: "/Asset/D-card-img2.png", span: 2, num: "01" },
  adventure: { src: "/Asset/adventure.png", span: 1, num: "02" },
  culinary: { src: "/Asset/culinary.png", span: 1, num: "03" },
  artistic: { src: "/Asset/cultures.png", span: 2, num: "04" },
  coast: { src: "/Asset/beaches.png", span: 1, num: "+" },
  wellness: { src: "/Asset/D-card-img3.png", span: 1, num: "+" },
} as const;

const PKG_ART = ["/Asset/D-card-img2.png", "/Asset/beaches.png", "/Asset/adventure.png"];

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);

  return (
    <main>
      {/* ── hero: asymmetric, copy on emerald, photograph carrying the emotion ── */}
      <header className="hero">
        <div className="hero-copy">
          <div className="kawung" aria-hidden="true" />
          <span className="eyebrow">{dict.hero.eyebrow}</span>
          <h1>
            {dict.hero.headlineBefore}
            <em>{dict.hero.headlineEm}</em>
            {dict.hero.headlineAfter}
          </h1>
          <p className="hero-sub">{dict.hero.sub}</p>
          <div className="hero-cta">
            <Link className="btn btn-primary" href={`/${lang}/inquiry`}>
              {dict.hero.cta1} →
            </Link>
            <Link className="btn btn-onDark" href="#guarantee">
              {dict.hero.cta2}
            </Link>
          </div>
        </div>
        <div className="hero-photo">
          <Image
            src="/Asset/Heroimg.png"
            alt={dict.hero.caption}
            fill
            priority
            sizes="(max-width: 960px) 100vw, 50vw"
            style={{ objectFit: "cover", objectPosition: "52% 38%" }}
          />
          <div className="hero-cap">{dict.hero.caption}</div>
        </div>
      </header>

      {/* ── trust rail: real facts only, no animated counters ── */}
      <div className="rail">
        {dict.rail.map((item) => (
          <div key={item.label}>
            <b>{item.value}</b>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── circuits: the product spine ── */}
      <section id="circuits">
        <div className="o2b-wrap">
          <div className="sechead">
            <h2>{dict.circuits.heading}</h2>
            <p>{dict.circuits.sub}</p>
          </div>
          <div className="circuits">
            {(Object.keys(CIRCUIT_ART) as Array<keyof typeof CIRCUIT_ART>).map((key) => {
              const art = CIRCUIT_ART[key];
              const c = dict.circuits.items[key];
              const isAddOn = art.num === "+";
              return (
                <Link
                  key={key}
                  href={`/${lang}/planner`}
                  className="circuit"
                  style={{ gridColumn: `span ${art.span}` }}
                >
                  <Image src={art.src} alt="" fill sizes="(max-width: 960px) 100vw, 50vw"
                         style={{ objectFit: "cover" }} />
                  <div className="circuit-body">
                    <span className="num">
                      {isAddOn ? `+ ${dict.circuits.addOn}` : `${art.num} — ${key.toUpperCase()}`}
                    </span>
                    <h3>{c.name}</h3>
                    <p>{c.blurb}</p>
                    {c.stops && <div className="stops">{c.stops}</div>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── the guarantee: the interactive centrepiece ── */}
      <section className="guarantee" id="guarantee">
        <div className="kawung" aria-hidden="true" />
        <div className="seahills" aria-hidden="true" />
        <div className="o2b-wrap">
          <div className="sechead">
            <h2>{dict.guarantee.heading}</h2>
            <p>{dict.guarantee.sub}</p>
          </div>
          <GuaranteeDemo dict={dict} />
        </div>
      </section>

      {/* ── how we verify ── */}
      <section id="verify">
        <div className="o2b-wrap">
          <div className="sechead">
            <h2>{dict.verify.heading}</h2>
            <p>{dict.verify.sub}</p>
          </div>
          <div className="verify">
            <div className="verify-photo">
              <Image src="/Asset/aboutusgrp.png" alt="" width={900} height={565}
                     sizes="(max-width: 960px) 100vw, 45vw" style={{ width: "100%", height: "auto" }} />
              <div className="poleng-band" aria-hidden="true" />
            </div>
            <ol className="steps">
              {dict.verify.steps.map((s) => (
                <li className="step" key={s.title}>
                  <div>
                    <h4>{s.title}</h4>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── packages ── */}
      <section id="packages" className="packages-band">
        <div className="o2b-wrap">
          <div className="sechead">
            <h2>{dict.packages.heading}</h2>
            <p>{dict.packages.sub}</p>
          </div>
          <div className="pkgs">
            {dict.packages.items.map((p, i) => (
              <article className="pkg" key={p.name}>
                <div className="pkg-img">
                  <Image src={PKG_ART[i]} alt="" fill sizes="(max-width: 960px) 100vw, 33vw"
                         style={{ objectFit: "cover" }} />
                  <span className="pkg-tag">{p.tag}</span>
                </div>
                <div className="pkg-body">
                  <h3>{p.name}</h3>
                  <div className="meta">{p.meta}</div>
                  <ul className="why">
                    {p.why.map((w) => (
                      <li key={w}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="chips">
                    {p.chips.map((c) => (
                      <span className="chip" key={c}>{c}</span>
                    ))}
                  </div>
                  <div className="pkg-foot">
                    <div className="price">
                      {p.price}
                      <small>{dict.packages.perPerson}</small>
                    </div>
                    <Link className="btn btn-solid btn-sm" href={`/${lang}/planner`}>
                      {dict.packages.checkDates}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── languages: every locale we actually serve ── */}
      <section id="languages">
        <div className="o2b-wrap">
          <div className="sechead sechead-tight">
            <h2>{dict.langs.heading}</h2>
            <p>{dict.langs.sub}</p>
          </div>
          <div className="langs">
            {locales.map((l) => (
              <Link className={`lang${l === lang ? " current" : ""}`} key={l} href={`/${l}`} lang={l}>
                {localeNames[l].native}
                {localeNames[l].native !== localeNames[l].english && (
                  <span>{localeNames[l].english}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── closing CTA ── */}
      <section className="close-section">
        <div className="o2b-wrap">
          <div className="close-cta">
            <div>
              <h2>{dict.close.heading}</h2>
              <p>{dict.close.body}</p>
            </div>
            <div className="close-actions">
              <Link className="btn btn-primary" href={`/${lang}/inquiry`}>
                {dict.close.cta1} →
              </Link>
              <Link className="btn btn-ghost" href={`/${lang}/vendors`}>
                {dict.close.cta2}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
