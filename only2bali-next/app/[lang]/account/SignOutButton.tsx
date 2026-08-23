"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(`/${lang}`);
      router.refresh();
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
