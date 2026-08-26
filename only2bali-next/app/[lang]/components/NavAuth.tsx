"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import SignOutButton from "../account/SignOutButton";

export default function NavAuth({
  lang,
  signInLabel,
  accountLabel,
  signOutLabel,
}: {
  lang: Locale;
  signInLabel: string;
  accountLabel: string;
  signOutLabel: string;
}) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) setSignedIn(Boolean(body?.data?.user));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (signedIn) {
    return (
      <>
        <Link className="btn btn-ghost btn-sm" href={`/${lang}/account`}>
          {accountLabel}
        </Link>
        <SignOutButton label={signOutLabel} lang={lang} />
      </>
    );
  }

  return (
    <Link className="navsignin" href={`/${lang}/login`}>
      {signInLabel}
    </Link>
  );
}
