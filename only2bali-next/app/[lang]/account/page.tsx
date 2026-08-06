import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { getSessionUser } from "@/lib/auth";
import { listAccountBookings } from "@/lib/repositories/payments";
import SignOutButton from "./SignOutButton";
import BookingPayButton from "./BookingPayButton";
import ReviewForm from "./ReviewForm";
import TravellerMarketplacePanel from "./TravellerMarketplacePanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  return { title: `${dict.account.heading} — Only2Bali`, robots: { index: false, follow: false } };
}

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);

  // Guarded here rather than only in middleware. The live IDOR in the legacy
  // Django app existed because one layer was trusted to have done the check.
  const user = await getSessionUser();
  if (!user) redirect(`/${lang}/login?next=/${lang}/account`);

  const bookings = user.role === "traveller" || user.role === "admin"
    ? await listAccountBookings(user.accountId)
    : [];

  const roleLabel =
    user.role === "vendor" ? dict.account.roleVendor
    : user.role === "admin" ? dict.account.roleAdmin
    : dict.account.roleTraveller;

  const payCopy = {
    payNow: dict.account.payNow,
    paying: dict.account.paying,
    paid: dict.account.paid,
    holdExpired: dict.account.holdExpired,
    errSetup: dict.account.payErrSetup,
    errGeneric: dict.account.payErrGeneric,
  };

  return (
    <main className="accountpage">
      <div className="o2b-wrap">
        <header className="accounthead">
          <div>
            <span className="eyebrow">{dict.account.signedInAs}</span>
            <h1>{user.email ?? user.mobile}</h1>
            <span className="rolechip">{roleLabel}</span>
          </div>
          <SignOutButton label={dict.auth.signOut} lang={lang} />
        </header>

        <div className="accountgrid">
          {(user.role === "traveller" || user.role === "admin") && (
            <TravellerMarketplacePanel lang={lang} />
          )}

          <section className="acard">
            <h2>{dict.account.tripsHeading}</h2>
            <p className="empty">{dict.account.tripsEmpty}</p>
            <Link className="btn btn-solid btn-sm" href={`/${lang}/planner`}>
              {dict.account.tripsEmptyCta}
            </Link>
          </section>

          <section className="acard">
            <h2>{dict.account.bookingsHeading}</h2>
            {bookings.length === 0 ? (
              <p className="empty">{dict.account.bookingsEmpty}</p>
            ) : (
              <ul className="bookinglist">
                {bookings.map((b) => (
                  <li key={b.bookingId} className="bookingrow">
                    <div>
                      <strong>{b.packageName ?? b.listingTitle ?? b.reference}</strong>
                      <p className="bookingmeta">
                        {b.reference} · {b.pax} pax · {money(b.grossAmount, b.currency)}
                        {" · "}
                        {b.status === "pending_payment"
                          ? dict.account.awaitingPayment
                          : b.status === "confirmed"
                            ? dict.account.confirmed
                            : b.status}
                      </p>
                      {b.packageSlug && (
                        <Link className="bookinglink" href={`/${lang}/packages/${b.packageSlug}`}>
                          {b.packageName ?? b.packageSlug}
                        </Link>
                      )}
                      {b.listingId && (
                        <Link className="bookinglink" href={`/${lang}/services/${b.listingId}`}>
                          {b.listingTitle ?? b.listingId}
                        </Link>
                      )}
                    </div>
                    {b.status === "pending_payment" && (
                      <BookingPayButton
                        bookingId={b.bookingId}
                        amount={b.grossAmount}
                        currency={b.currency}
                        reference={b.reference}
                        holdExpiresAt={b.holdExpiresAt ? b.holdExpiresAt.toISOString() : null}
                        copy={payCopy}
                      />
                    )}
                    {(b.status === "confirmed" || b.status === "completed") && (
                      <ReviewForm
                        bookingId={b.bookingId}
                        direction="traveller_to_vendor"
                        copy={{
                          heading: dict.account.reviewHeading,
                          submit: dict.account.reviewSubmit,
                          thanks: dict.account.reviewThanks,
                          prompt: dict.account.reviewPrompt,
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="acard">
            <h2>{dict.account.savedHeading}</h2>
            <p className="empty">{dict.account.savedEmpty}</p>
            <Link className="btn btn-ghost btn-sm" href={`/${lang}#packages`}>
              {dict.account.browseCta}
            </Link>
          </section>

          {user.role === "vendor" && (
            <section className="acard">
              <h2>Provider workspace</h2>
              <p className="empty">Manage prices, services, photos, events, offers, address and payout details.</p>
              <Link className="btn btn-solid btn-sm" href={`/${lang}/provider`}>
                Open provider dashboard
              </Link>
            </section>
          )}

          {user.role === "admin" && (
            <section className="acard">
              <h2>Admin control</h2>
              <p className="empty">Fix rates, approve pictures, announce events and publish discounts.</p>
              <Link className="btn btn-solid btn-sm" href={`/${lang}/admin`}>
                Open admin dashboard
              </Link>
            </section>
          )}
        </div>

        <p className="accountnote">{dict.account.protocolNote}</p>
      </div>
    </main>
  );
}
