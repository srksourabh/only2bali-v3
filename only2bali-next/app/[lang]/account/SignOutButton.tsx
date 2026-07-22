"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton({ label, lang }: { label: string; lang: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signOut() {
    setBusy(true);
    try {
      // Deletes the session row server-side, not just the cookie.
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(`/${lang}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={signOut} disabled={busy} type="button">
      {label}
    </button>
  );
}
