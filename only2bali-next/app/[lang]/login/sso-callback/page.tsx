import { redirect } from "next/navigation";
import { clerkConfigured } from "@/lib/auth/clerk";
import SsoCallbackClient from "./SsoCallbackClient";

export const dynamic = "force-dynamic";

export default async function SsoCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { lang } = await params;
  const { next } = await searchParams;
  if (!clerkConfigured()) redirect(`/${lang}/login`);
  const complete =
    next && next.startsWith(`/${lang}/login/sso-complete`)
      ? next
      : `/${lang}/login/sso-complete`;
  return <SsoCallbackClient lang={lang} complete={complete} />;
}
