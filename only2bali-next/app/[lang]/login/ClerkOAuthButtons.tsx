"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs/legacy";
import type { Locale } from "@/lib/i18n/config";

/**
 * Clerk OAuth entry. Completes at /login/sso-callback then /login/sso-complete
 * which bridges into the app's o2b_session.
 */
export default function ClerkOAuthButtons({
  role,
  lang,
  next,
}: {
  role: "traveller" | "vendor";
  lang: Locale;
  next: string;
}) {
  const { isLoaded, signIn } = useSignIn();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dest =
    role === "vendor" ? `/${lang}/provider` : next.startsWith("/") ? next : `/${lang}/account`;

  async function start(strategy: "oauth_google" | "oauth_apple") {
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      const complete = `/${lang}/login/sso-complete?role=${role}&next=${encodeURIComponent(dest)}`;
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `/${lang}/login/sso-callback`,
        redirectUrlComplete: complete,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start OAuth.");
      setBusy(false);
    }
  }

  return (
    <div className="clerk-oauth">
      <button
        type="button"
        className="googlebtn"
        disabled={!isLoaded || busy}
        onClick={() => void start("oauth_google")}
      >
        <span aria-hidden="true">G</span>
        {busy ? "Redirecting…" : "Continue with Google"}
      </button>
      <button
        type="button"
        className="googlebtn clerk-apple"
        disabled={!isLoaded || busy}
        onClick={() => void start("oauth_apple")}
      >
        <span aria-hidden="true">A</span>
        Continue with Apple
      </button>
      {error && (
        <p className="autherr" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
