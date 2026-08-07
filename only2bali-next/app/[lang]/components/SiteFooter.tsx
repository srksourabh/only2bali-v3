import type { Dictionary } from "@/lib/i18n";
import { getContactConfig } from "@/lib/config-server";
import Mark from "./Mark";

export default async function SiteFooter({ dict }: { dict: Dictionary }) {
  const contact = await getContactConfig();
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
          {contact.email && (
            <>
              {" · "}
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
