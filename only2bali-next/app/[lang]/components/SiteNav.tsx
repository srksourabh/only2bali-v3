import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { getSessionUser } from "@/lib/auth";
import Mark from "./Mark";
import LanguageSwitcher from "./LanguageSwitcher";
import SiteNotchNav from "./SiteNotchNav";

export default async function SiteNav({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const user = await getSessionUser();

  return (
    <header className="o2b-nav">
      <div className="o2b-wrap o2b-navrow">
        <Link className="lockup" href={`/${lang}`}>
          <Mark size={30} title="Only2Bali" />
          <span className="wm">
            Only<i>2</i>Bali
          </span>
        </Link>

        <SiteNotchNav
          lang={lang}
          labels={{
            home: dict.nav.home,
            destinations: dict.nav.destinations,
            providers: dict.nav.providers,
            services: dict.nav.services,
            packages: dict.nav.packages,
            guarantee: dict.nav.guarantee,
          }}
        />

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
    </header>
  );
}
