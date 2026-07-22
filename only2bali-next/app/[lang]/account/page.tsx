import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { getSessionUser } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

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

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);

  // Guarded here rather than only in middleware. The live IDOR in the legacy
  // Django app existed because one layer was trusted to have done the check.
  const user = await getSessionUser();
  if (!user) redirect(`/${lang}/login?next=/${lang}/account`);

  const roleLabel =
    user.role === "vendor" ? dict.account.roleVendor
    : user.role === "admin" ? dict.account.roleAdmin
    : dict.account.roleTraveller;

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
          <section className="acard">
            <h2>{dict.account.tripsHeading}</h2>
            <p className="empty">{dict.account.tripsEmpty}</p>
            <Link className="btn btn-solid btn-sm" href={`/${lang}/planner`}>
              {dict.account.tripsEmptyCta}
            </Link>
          </section>

          <section className="acard">
            <h2>{dict.account.bookingsHeading}</h2>
            <p className="empty">{dict.account.bookingsEmpty}</p>
          </section>

          <section className="acard">
            <h2>{dict.account.savedHeading}</h2>
            <p className="empty">{dict.account.savedEmpty}</p>
            <Link className="btn btn-ghost btn-sm" href={`/${lang}#packages`}>
              {dict.account.browseCta}
            </Link>
          </section>
        </div>

        <p className="accountnote">{dict.account.protocolNote}</p>
      </div>
    </main>
  );
}
