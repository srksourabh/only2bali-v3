"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export default function ClerkSignOutButton({ label, lang }: { label: string; lang: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { signOut } = useClerk();

  async function handle() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut({ redirectUrl: `/${lang}` });
      router.refresh();
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
