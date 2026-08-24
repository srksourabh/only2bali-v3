"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackClient({
  lang,
  complete,
}: {
  lang: string;
  complete: string;
}) {
  const fallback = complete || `/${lang}/login/sso-complete`;
  return (
    <main className="authpage">
      <div className="o2b-wrap" style={{ padding: "3rem 1rem", textAlign: "center" }}>
        <p className="empty">Finishing sign-in…</p>
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl={fallback}
          signUpFallbackRedirectUrl={fallback}
        />
      </div>
    </main>
  );
}
