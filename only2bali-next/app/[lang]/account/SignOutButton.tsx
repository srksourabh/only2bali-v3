"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());

const ClerkSignOutButton = dynamic(() => import("./ClerkSignOutButton"), { ssr: false });

export default function SignOutButton({ label, lang }: { label: string; lang: string }) {
  if (clerkEnabled) {
    return <ClerkSignOutButton label={label} lang={lang} />;
  }
  return <AppOnlySignOut label={label} lang={lang} />;
}

function AppOnlySignOut({ label, lang }: { label: string; lang: string }) {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Full navigation, not router.push: client components elsewhere on the
      // page (like the nav's own signed-in state) only ever check once on
      // mount and would otherwise keep showing "Sign out" after signing out.
      window.location.href = `/${lang}`;
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={() => void signOut()} disabled={busy} type="button">
      {label}
    </button>
  );
}
