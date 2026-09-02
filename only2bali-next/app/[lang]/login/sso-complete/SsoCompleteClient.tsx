"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { safePostSignInDestination } from "@/lib/auth/navigation";

export default function SsoCompleteClient() {
  const search = useSearchParams();
  const params = useParams();
  const lang = String(params.lang ?? "en");
  const { isLoaded, isSignedIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const role = search.get("role") === "vendor" ? "vendor" : "traveller";
  const next = safePostSignInDestination(search.get("next"), lang, role);

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
        // Do not use a client transition here. It preserves the mounted nav,
        // whose session check ran before the bridge cookie existed. Confirm
        // that the app session is resolvable, then remount the document so all
        // server guards and the top-right auth control see the same identity.
        const session = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const sessionJson = await session.json().catch(() => null);
        if (!session.ok || !sessionJson?.data?.user) {
          if (!cancelled) setError("Sign-in completed, but the account session could not be started. Try again.");
          return;
        }
        if (!cancelled) {
          window.location.replace(next);
        }
      } catch {
        if (!cancelled) setError("Network error finishing sign-in.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, role, next]);

  if (error) {
    return (
      <p className="autherr" role="alert">
        {error}
      </p>
    );
  }
  return <p className="empty">Linking your Only2Bali account…</p>;
}
