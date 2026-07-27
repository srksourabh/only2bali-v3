import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { safeNextPath } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "o2b_google_state";

export function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ success: false, error: "Google login is not configured." }, { status: 503 });
  }

  const role = req.nextUrl.searchParams.get("role");
  if (role !== "traveller" && role !== "vendor") {
    return NextResponse.json({ success: false, error: "Google login is only for travelers and providers." }, { status: 400 });
  }

  const state = randomBytes(24).toString("base64url");
  const nextParam = req.nextUrl.searchParams.get("next") ?? undefined;
  const next = safeNextPath(nextParam, role === "vendor" ? "/en/provider" : "/en/account");
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("state", state);
  auth.searchParams.set("access_type", "online");
  auth.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(auth);
  res.cookies.set(
    STATE_COOKIE,
    Buffer.from(JSON.stringify({ state, role, next, redirectUri })).toString("base64url"),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    }
  );
  return res;
}
