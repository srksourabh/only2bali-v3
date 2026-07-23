import type { Dictionary } from "@/lib/i18n";
import { CFG } from "@/lib/config";
import Mark from "./Mark";

export default function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer className="o2b-footer">
      <div className="tumpal" aria-hidden="true" />
      <div className="o2b-wrap footrow">
        <div className="footbrand">
          <Mark size={26} reversed />
          <span className="wm">
            Only<i>2</i>Bali
          </span>
        </div>
        <p className="foottag">{dict.footer.tagline}</p>
        <p className="footnote">
          © {new Date().getFullYear()} Only2Bali · {dict.footer.note}
          {CFG.email && (
            <>
              {" · "}
              <a href={`mailto:${CFG.email}`}>{CFG.email}</a>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
