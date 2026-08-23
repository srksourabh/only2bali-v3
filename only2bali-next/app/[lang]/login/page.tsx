import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { getSessionUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/auth/redirect";
import Mark from "../components/Mark";
import LoginForm from "./LoginForm";
import { portalHomePath } from "@/lib/auth/portal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  // A login page has nothing to offer a search engine.
  return { title: `${dict.auth.signIn} — Only2Bali`, robots: { index: false, follow: false } };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const lang = (await params).lang as Locale;
  const dict = await getDictionary(lang);
  const { next } = await searchParams;

  const user = await getSessionUser();
  const fallback = user ? portalHomePath(user.role, lang) : `/${lang}/account`;
  const target = safeNextPath(next, fallback);

  if (user) redirect(target);

  return (
    <main className="authpage">
      <div className="authwrap">
        <div className="authmark" aria-hidden="true">
          <Mark size={44} />
        </div>
        <LoginForm dict={dict} lang={lang} next={target} />
      </div>
    </main>
  );
}
