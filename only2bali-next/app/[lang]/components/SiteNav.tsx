import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { getSessionUser } from "@/lib/auth";
import Mark from "./Mark";
import LanguageSwitcher from "./LanguageSwitcher";

export default async function SiteNav({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const user = await getSessionUser();

  return (
    <nav className="o2b-nav" aria-label="Main">
      <div className="o2b-wrap o2b-navrow">
        <Link className="lockup" href={`/${lang}`}>
          <Mark size={30} title="Only2Bali" />
          <span className="wm">
            Only<i>2</i>Bali
          </span>
        </Link>

        <div className="navlinks">
          <Link href={`/${lang}/destinations`}>{dict.nav.destinations}</Link>
          <Link href={`/${lang}/providers`}>{dict.nav.providers}</Link>
          <Link href={`/${lang}/services`}>{dict.nav.services}</Link>
          <Link href={`/${lang}/packages`}>{dict.nav.packages}</Link>
          <Link href={`/${lang}#guarantee`}>{dict.nav.guarantee}</Link>
        </div>

        <div className="navactions">
          <LanguageSwitcher lang={lang} label={dict.nav.language} />

          {user ? (
            <Link className="btn btn-ghost btn-sm" href={`/${lang}/account`}>
              {dict.auth.account}
            </Link>
          ) : (
            <Link className="navsignin" href={`/${lang}/login`}>
              {dict.auth.signIn}
            </Link>
          )}

          <Link className="btn btn-primary" href={`/${lang}/planner`}>
            {dict.nav.plan}
          </Link>
        </div>
      </div>
    </nav>
  );
}
