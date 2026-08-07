"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function SsoCompleteClient() {
  const router = useRouter();
  const search = useSearchParams();
  const params = useParams();
  const lang = String(params.lang ?? "en");
  const { isLoaded, isSignedIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const role = search.get("role") === "vendor" ? "vendor" : "traveller";
  const next = search.get("next") || `/${lang}/account`;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setError("Clerk sign-in did not complete. Try again.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/clerk/bridge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ role }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          if (!cancelled) setError(json?.error ?? "Could not finish sign-in.");
          return;
        }
        if (!cancelled) {
          router.replace(next);
          router.refresh();
        }
      } catch {
        if (!cancelled) setError("Network error finishing sign-in.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, role, next, router]);

  if (error) {
    return (
      <p className="autherr" role="alert">
        {error}
      </p>
    );
  }
  return <p className="empty">Linking your Only2Bali account…</p>;
}
