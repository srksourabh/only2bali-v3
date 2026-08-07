import { redirect } from "next/navigation";
import { clerkConfigured } from "@/lib/auth/clerk";
import SsoCallbackClient from "./SsoCallbackClient";

export const dynamic = "force-dynamic";

export default async function SsoCallbackPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!clerkConfigured()) redirect(`/${lang}/login`);
  return <SsoCallbackClient />;
}
