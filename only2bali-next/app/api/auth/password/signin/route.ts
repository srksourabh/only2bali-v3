import { NextResponse } from "next/server";
import { passwordSignInSchema } from "@/lib/validators/auth";
import { signInWithPassword } from "@/lib/auth/service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { apiError, readJson } from "@/lib/api";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitShared } from "@/lib/rate-limit-db";

export const dynamic = "force-dynamic";

const PER_IP = { limit: 30, windowMs: 15 * 60_000 };
const WRONG = "Username or password is incorrect.";

export async function POST(req: Request) {
  try {
    const parsed = passwordSignInSchema.safeParse(await readJson(req));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: WRONG }, { status: 401 });
    }

    const ip = clientKey(req);
    const limit = await rateLimitShared(`password-signin:ip:${ip}`, PER_IP.limit, PER_IP.windowMs);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please wait." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const result = await signInWithPassword(parsed.data, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    if (!result.ok) {
      const message =
        result.reason === "role_mismatch"
          ? "This account belongs to a different login type."
          : WRONG;
      return NextResponse.json({ success: false, error: message, reason: result.reason }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, data: { accountId: result.accountId } });
    res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(result.expiresAt));
    return res;
  } catch (err) {
    return apiError(err, "Could not sign in.");
  }
}
