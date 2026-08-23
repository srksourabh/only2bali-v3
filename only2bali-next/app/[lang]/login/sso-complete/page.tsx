import { redirect } from "next/navigation";
import { Suspense } from "react";
import { clerkConfigured } from "@/lib/auth/clerk";
import SsoCompleteClient from "./SsoCompleteClient";

export const dynamic = "force-dynamic";

export default async function SsoCompletePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!clerkConfigured()) redirect(`/${lang}/login`);
  return (
    <main className="authpage">
      <div className="o2b-wrap" style={{ padding: "3rem 1rem", textAlign: "center" }}>
        <Suspense fallback={<p className="empty">Finishing sign-in…</p>}>
          <SsoCompleteClient />
        </Suspense>
      </div>
    </main>
  );
}
