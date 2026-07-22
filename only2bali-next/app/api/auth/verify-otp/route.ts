import { NextResponse } from "next/server";
import { verifyOtpSchema, toIdentifier } from "@/lib/validators/auth";
import { verifyOtp } from "@/lib/auth/service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Attempts are also counted on the stored code, which is the real guard. This
 * limit exists so an attacker cannot cheaply cycle identifiers looking for one
 * with an outstanding code.
 */
const PER_IP = { limit: 30, windowMs: 15 * 60_000 };
const MAX_BODY_BYTES = 2048;

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: "Request too large." }, { status: 413 });
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
    }

    const parsed = verifyOtpSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Enter the six-digit code." },
        { status: 400 }
      );
    }

    const ip = clientKey(req);
    const limit = rateLimit(`verify:ip:${ip}`, PER_IP.limit, PER_IP.windowMs);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Please wait." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const { code, ...identifier } = parsed.data;
    const result = await verifyOtp(identifier, code, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    if (!result.ok) {
      // "no_code" and "expired" are reported identically so the response does
      // not confirm that a code was ever issued for this identifier.
      const message =
        result.reason === "locked"
          ? "Too many incorrect attempts. Request a new code."
          : result.reason === "invalid"
            ? "That code is not correct."
            : "That code has expired. Request a new one.";

      return NextResponse.json(
        { success: false, error: message, reason: result.reason },
        { status: result.reason === "locked" ? 429 : 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      data: { accountId: result.accountId, isNewAccount: result.isNewAccount },
    });

    res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(result.expiresAt));
    return res;
  } catch (err) {
    console.error("[auth] verify-otp failed", err);
    return NextResponse.json(
      { success: false, error: "Could not sign you in right now. Please try again." },
      { status: 500 }
    );
  }
}
