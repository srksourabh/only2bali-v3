"use client";

import { useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
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
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dest =
    role === "vendor" ? `/${lang}/provider` : next.startsWith("/") ? next : `/${lang}/account`;
  const complete = `/${lang}/login/sso-complete?role=${role}&next=${encodeURIComponent(dest)}`;

  async function start(strategy: "oauth_google" | "oauth_apple") {
    if (!isLoaded || !signIn) return;
    if (isSignedIn) {
      window.location.assign(complete);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `/${lang}/login/sso-callback?next=${encodeURIComponent(complete)}`,
        redirectUrlComplete: complete,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start OAuth.";
      if (/already signed in/i.test(message)) {
        window.location.assign(complete);
        return;
      }
      setError(message);
      setBusy(false);
    }
  }

  if (isLoaded && isSignedIn) {
    return (
      <div className="clerk-oauth">
        <p className="empty" style={{ fontSize: ".9rem" }}>
          You&apos;re already signed in with Google. Continue to open your {role === "vendor" ? "provider" : "traveler"} account, or use a different account.
        </p>
        <a className="btn btn-primary authsubmit" href={complete}>
          Continue
        </a>
        <button
          type="button"
          className="googlebtn"
          onClick={() => void signOut({ redirectUrl: `/${lang}/login` })}
        >
          Use a different account
        </button>
      </div>
    );
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
