import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/config";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin control - Only2Bali",
  robots: { index: false, follow: false },
};

export default async function AdminPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;
  const user = await getSessionUser();
  if (!user) redirect(`/${lang}/login?next=/${lang}/admin`);
  if (user.role !== "admin") redirect(`/${lang}/account`);

  return <AdminDashboard />;
}
