"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackClient() {
  return (
    <main className="authpage">
      <div className="o2b-wrap" style={{ padding: "3rem 1rem", textAlign: "center" }}>
        <p className="empty">Finishing sign-in…</p>
        <AuthenticateWithRedirectCallback />
      </div>
    </main>
  );
}
