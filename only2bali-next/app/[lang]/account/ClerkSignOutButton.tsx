"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";

export default function ClerkSignOutButton({ label, lang }: { label: string; lang: string }) {
  const [busy, setBusy] = useState(false);
  const { signOut } = useClerk();

  async function handle() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut();
      // Full navigation: client components elsewhere on the page (like the
      // nav's own signed-in state) only ever check once on mount and would
      // otherwise keep showing "Sign out" after signing out.
      window.location.href = `/${lang}`;
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={() => void handle()} disabled={busy} type="button">
      {label}
    </button>
  );
}
