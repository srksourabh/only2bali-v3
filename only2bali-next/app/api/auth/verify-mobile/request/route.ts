import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { verifyMobileRequestSchema } from "@/lib/validators/auth";
import { requestMobileVerification } from "@/lib/auth/service";
import { canDeliver } from "@/lib/auth/delivery";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitShared } from "@/lib/rate-limit-db";

export const dynamic = "force-dynamic";

const PER_ACCOUNT = { limit: 5, windowMs: 15 * 60_000 };

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = verifyMobileRequestSchema.safeParse(await readJson(req, 2048));
    if (!parsed.success) return validationError(parsed.error);

    if (!canDeliver("sms")) {
      return NextResponse.json(
        {
          success: false,
          error: "SMS verification is not available yet. Please contact us instead.",
          reason: "delivery_not_configured",
        },
        { status: 503 }
      );
    }

    const ip = clientKey(req);
    const limit = await rateLimitShared(
      `verify-mobile:${user.accountId}:${ip}`,
      PER_ACCOUNT.limit,
      PER_ACCOUNT.windowMs
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    await requestMobileVerification(user.accountId, parsed.data.mobile, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      success: true,
      data: { message: "If that number is valid, a six-digit code is on its way." },
    });
  } catch (err) {
    return apiError(err, "Could not send a verification code.");
  }
}
