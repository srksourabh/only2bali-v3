import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { signInWithGoogleProfile } from "@/lib/auth/service";
import { clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "o2b_google_state";

type GoogleState = {
  state: string;
  role: "traveller" | "vendor";
  next: string;
  redirectUri: string;
};

function readState(value: string | undefined): GoogleState | null {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const state = readState(req.cookies.get(STATE_COOKIE)?.value);
  const code = req.nextUrl.searchParams.get("code");
  const returnedState = req.nextUrl.searchParams.get("state");

  const failure = NextResponse.redirect(new URL("/en/login?error=google", req.nextUrl.origin));
  failure.cookies.delete(STATE_COOKIE);

  if (!clientId || !clientSecret || !state || !code || state.state !== returnedState) {
    return failure;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: state.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const token = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok || !token?.access_token) return failure;

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  const profile = await profileRes.json().catch(() => null);
  if (!profileRes.ok || !profile?.sub || !profile?.email || profile.email_verified === false) return failure;

  const result = await signInWithGoogleProfile(
    {
      providerAccountId: String(profile.sub),
      email: String(profile.email).toLowerCase(),
      name: profile.name ? String(profile.name) : null,
    },
    state.role,
    { ip: clientKey(req), userAgent: req.headers.get("user-agent") ?? undefined }
  );
  if (!result.ok) return failure;

  const res = NextResponse.redirect(new URL(state.next, req.nextUrl.origin));
  res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(result.expiresAt));
  res.cookies.delete(STATE_COOKIE);
  return res;
}
