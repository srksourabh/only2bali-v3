import { NextResponse } from "next/server";
import { passwordSignUpSchema } from "@/lib/validators/auth";
import { signUpWithPassword } from "@/lib/auth/service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitShared } from "@/lib/rate-limit-db";

export const dynamic = "force-dynamic";

const PER_IP = { limit: 12, windowMs: 60 * 60_000 };

export async function POST(req: Request) {
  try {
    const parsed = passwordSignUpSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const ip = clientKey(req);
    const limit = await rateLimitShared(`password-signup:ip:${ip}`, PER_IP.limit, PER_IP.windowMs);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const result = await signUpWithPassword(parsed.data, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: "That username is already taken." }, { status: 409 });
    }

    const res = NextResponse.json({ success: true, data: { accountId: result.accountId } }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(result.expiresAt));
    return res;
  } catch (err) {
    return apiError(err, "Could not create account.");
  }
}
