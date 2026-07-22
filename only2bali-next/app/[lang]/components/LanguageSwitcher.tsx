"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";

/**
 * Swaps the locale segment of the current path and keeps the reader where they
 * were. Names are shown in their own script first — someone looking for Tamil
 * should not have to read "Tamil" in English to find it.
 */
export default function LanguageSwitcher({ lang, label }: { lang: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(next: Locale) {
    const segments = pathname.split("/");
    segments[1] = next;
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`;
    setOpen(false);
    router.push(segments.join("/") || `/${next}`);
  }

  return (
    <div className="langsw" ref={ref}>
      <button
        type="button"
        className="langsw-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{localeNames[lang].native}</span>
      </button>

      {open && (
        <ul className="langsw-menu" role="listbox" aria-label={label}>
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === lang}
                lang={l}
                onClick={() => switchTo(l)}
              >
                <span className="native">{localeNames[l].native}</span>
                {localeNames[l].native !== localeNames[l].english && (
                  <span className="english">{localeNames[l].english}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
