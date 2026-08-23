import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { locales, type Locale } from "@/lib/i18n/config";
import { getPackageBySlug } from "@/lib/repositories/catalog";
import { formatDeparture } from "@/lib/repositories/homepage";
import { getSessionUser } from "@/lib/auth";
import PackageBookForm from "../PackageBookForm";
import "./package.css";

/**
 * The page the whole product rests on.
 *
 * The homepage claims a verified veg guarantee. This is where the claim is
 * shown rather than asserted: every meal on every day, with its own green,
 * amber or red rating and the reason. A traveller who cannot see which meal is
 * amber has no reason to believe the badge on the card.
 *
 * Rendered from the database on request. It is not statically generated,
 * because seat counts and departure dates go stale within hours.
 */
export const dynamic = "force-dynamic";

/**
 * The parent layout sets `dynamicParams = false` so that only the seven known
 * locales exist. That must not be inherited here: a package published after the
 * last deploy would 404 until someone redeployed.
 */
export const dynamicParams = true;

const MONEY: Record<string, string> = { INR: "en-IN", USD: "en-US" };
const money = (minor: number, currency: string) =>
  new Intl.NumberFormat(MONEY[currency] ?? "en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return { title: "Not found — Only2Bali" };

  return {
    title: `${pkg.name} — ${pkg.days} days in Bali — Only2Bali`,
    description: pkg.blurb ?? undefined,
    alternates: {
      canonical: `/${lang}/packages/${slug}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/packages/${slug}`])),
    },
  };
}

const RATING_LABEL = {
  green: "Fully compliant",
  amber: "Compliant on request",
  red: "Substitution arranged",
} as const;

export default async function PackagePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang = rawLang as Locale;
  const dict = await getDictionary(lang);

  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const user = await getSessionUser();
  const copy = dict.packages.items.find((i) => i.slug === slug);
  const totalMeals = pkg.compliance.green + pkg.compliance.amber + pkg.compliance.red;

  const bookCopy = {
    bookNow: dict.packages.bookNow,
    booking: dict.services.booking,
    signedInRequired: dict.services.signedInRequired,
    signIn: dict.services.signIn,
    leadName: dict.services.leadName,
    pax: dict.services.pax,
    protocol: dict.services.protocol,
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
    <main className="pkgpage">
      <div className="o2b-wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href={`/${lang}/packages`}>{dict.nav.packages}</Link>
          <span aria-hidden="true"> / </span>
          <span>{copy?.name ?? pkg.name}</span>
        </nav>

        <header className="pkghead">
          <div>
            {copy?.tag && <span className="tag">{copy.tag}</span>}
            <h1>{copy?.name ?? pkg.name}</h1>
            <p className="pkgmeta">
              {pkg.days} {dict.packages.days} · {pkg.nights} {dict.packages.nights}
              {pkg.places.length > 0 && ` · ${pkg.places.join(", ")}`}
            </p>
            {pkg.blurb && <p className="pkgblurb">{pkg.blurb}</p>}
            <div className="chips">
              {(copy?.chips ?? pkg.protocols).map((c) => (
                <span className="chip" key={c}>{c}</span>
              ))}
              {pkg.kitchen && <span className="chip">Kitchen access</span>}
              {pkg.cookReady && <span className="chip">Cook available</span>}
            </div>
          </div>

          <aside className="pkgbuy">
            <div className="price">
              {money(pkg.basePriceAmount, pkg.basePriceCurrency)}
              <small>{dict.packages.perPerson}</small>
            </div>
            <p className="grouprange">
              Group of {pkg.groupSizeMin}–{pkg.groupSizeMax}
            </p>
            <Link className="btn btn-ghost" href={`/${lang}/inquiry?package=${slug}`}>
              {dict.packages.checkDates}
            </Link>
            {pkg.departures[0]?.id && (
              <PackageBookForm
                departureId={pkg.departures[0].id}
                label={formatDeparture(pkg.departures[0].startDate, lang)}
                seatsAvailable={pkg.departures[0].seatsAvailable}
                lang={lang}
                loginHref={`/${lang}/login?next=/${lang}/packages/${slug}`}
                signedIn={Boolean(user)}
                bookCopy={bookCopy}
                payCopy={payCopy}
              />
            )}
          </aside>
        </header>

        {/* The guarantee, counted rather than claimed. */}
        {totalMeals > 0 && (
          <section className="compliance" aria-labelledby="compliance-h">
            <h2 id="compliance-h">Meal compliance across this itinerary</h2>
            <ul className="compbar">
              <li>
                <span className="dot dot-green" aria-hidden="true" />
                <b>{pkg.compliance.green}</b> {RATING_LABEL.green.toLowerCase()}
              </li>
              <li>
                <span className="dot dot-amber" aria-hidden="true" />
                <b>{pkg.compliance.amber}</b> {RATING_LABEL.amber.toLowerCase()}
              </li>
              <li>
                <span className="dot dot-red" aria-hidden="true" />
                <b>{pkg.compliance.red}</b> {RATING_LABEL.red.toLowerCase()}
              </li>
            </ul>
            <p className="fineprint">
              Every one of the {totalMeals} meals below carries its own rating. Amber and red are
              shown, not hidden — an amber meal is one we confirm with the kitchen before you fly.
            </p>
          </section>
        )}

        {(copy?.why ?? pkg.highlights).length > 0 && (
          <section aria-labelledby="why-h">
            <h2 id="why-h">Why this itinerary</h2>
            <ul className="why">
              {(copy?.why ?? pkg.highlights).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        {pkg.itinerary.length > 0 && (
          <section aria-labelledby="days-h">
            <h2 id="days-h">Day by day</h2>
            <ol className="days">
              {pkg.itinerary.map((d) => (
                <li key={d.dayNumber} className="day">
                  <div className="daynum">Day {d.dayNumber}</div>
                  <div className="daybody">
                    <h3>{d.title}</h3>
                    {d.summary && <p>{d.summary}</p>}
                    <p className="dayfacts">
                      {d.stayArea && <span>Stay: {d.stayArea}</span>}
                      {d.transportNote && <span>{d.transportNote}</span>}
                    </p>
                    {d.meals.length > 0 && (
                      <ul className="meals">
                        {d.meals.map((m) => (
                          <li key={m.meal} className={`meal meal-${m.complianceRating}`}>
                            <span className={`dot dot-${m.complianceRating}`} aria-hidden="true" />
                            <span className="mealslot">{m.meal}</span>
                            <span className="mealdesc">{m.description}</span>
                            <span className="mealrating">{RATING_LABEL[m.complianceRating]}</span>
                            {m.note && <span className="mealnote">{m.note}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {pkg.departures.length > 0 && (
          <section aria-labelledby="dep-h">
            <h2 id="dep-h">Upcoming departures</h2>
            <ul className="departures">
              {pkg.departures.map((d) => (
                <li key={d.id ?? d.startDate}>
                  <b>{formatDeparture(d.startDate, lang)}</b>
                  <span>{money(d.priceAmount, pkg.basePriceCurrency)}</span>
                  <span className={d.seatsAvailable <= 5 ? "seats low" : "seats"}>
                    {d.seatsAvailable} seats left
                  </span>
                  {d.id ? (
                    <PackageBookForm
                      departureId={d.id}
                      label={formatDeparture(d.startDate, lang)}
                      seatsAvailable={d.seatsAvailable}
                      lang={lang}
                      loginHref={`/${lang}/login?next=/${lang}/packages/${slug}`}
                      signedIn={Boolean(user)}
                      bookCopy={bookCopy}
                      payCopy={payCopy}
                    />
                  ) : (
                    <Link className="btn btn-o btn-sm" href={`/${lang}/inquiry?package=${slug}`}>
                      {dict.packages.checkDates}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(pkg.included.length > 0 || pkg.excluded.length > 0) && (
          <section className="inclusions" aria-labelledby="inc-h">
            <h2 id="inc-h">What is and is not included</h2>
            <div className="incgrid">
              {pkg.included.length > 0 && (
                <div>
                  <h3>Included</h3>
                  <ul>{pkg.included.map((i) => <li key={i}>{i}</li>)}</ul>
                </div>
              )}
              {pkg.excluded.length > 0 && (
                <div>
                  <h3>Not included</h3>
                  <ul>{pkg.excluded.map((i) => <li key={i}>{i}</li>)}</ul>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
