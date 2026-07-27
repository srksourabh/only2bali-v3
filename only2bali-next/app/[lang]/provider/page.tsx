import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/config";
import ProviderDashboard from "./ProviderDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Provider dashboard - Only2Bali",
  robots: { index: false, follow: false },
};

export default async function ProviderPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;
  const user = await getSessionUser();
  if (!user) redirect(`/${lang}/login?next=/${lang}/provider`);
  if (user.role !== "vendor") redirect(`/${lang}/account`);

  return <ProviderDashboard />;
}
