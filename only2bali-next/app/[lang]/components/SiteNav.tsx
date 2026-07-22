import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import Mark from "./Mark";
import LanguageSwitcher from "./LanguageSwitcher";

export default function SiteNav({ lang, dict }: { lang: Locale; dict: Dictionary }) {
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
          <Link href={`/${lang}#circuits`}>{dict.nav.circuits}</Link>
          <Link href={`/${lang}#guarantee`}>{dict.nav.guarantee}</Link>
          <Link href={`/${lang}#verify`}>{dict.nav.verify}</Link>
          <Link href={`/${lang}#packages`}>{dict.nav.packages}</Link>
        </div>

        <div className="navactions">
          <LanguageSwitcher lang={lang} label={dict.nav.language} />
          <Link className="btn btn-primary" href={`/${lang}/inquiry`}>
            {dict.nav.plan}
          </Link>
        </div>
      </div>
    </nav>
  );
}
