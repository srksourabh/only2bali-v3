import { NextResponse } from "next/server";
import { vendorEmailVerifySchema } from "@/lib/validators/leads";
import { requestVendorApplicationEmailCode } from "@/lib/auth/service";
import { canDeliver } from "@/lib/auth/delivery";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitShared } from "@/lib/rate-limit-db";
import { apiError, readJson, validationError } from "@/lib/api";

export const dynamic = "force-dynamic";

const PER_IDENTIFIER = { limit: 5, windowMs: 15 * 60_000 };
const PER_IP = { limit: 20, windowMs: 15 * 60_000 };

export async function POST(req: Request) {
  try {
    const parsed = vendorEmailVerifySchema.safeParse(await readJson(req, 2048));
    if (!parsed.success) return validationError(parsed.error);

    if (!canDeliver("email")) {
      return NextResponse.json(
        {
          success: false,
          error: "Email verification is not available yet. Please try again later.",
          reason: "delivery_not_configured",
        },
        { status: 503 }
      );
    }

    const ip = clientKey(req);
    const email = parsed.data.email;

    const byIp = await rateLimitShared(`vendor-email:ip:${ip}`, PER_IP.limit, PER_IP.windowMs);
    if (!byIp.allowed) return throttled(byIp.retryAfterSeconds);

    const byId = await rateLimitShared(`vendor-email:id:${email}`, PER_IDENTIFIER.limit, PER_IDENTIFIER.windowMs);
    if (!byId.allowed) return throttled(byId.retryAfterSeconds);

    await requestVendorApplicationEmailCode(email, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      success: true,
      data: { message: "If that address is valid, a six-digit code is on its way." },
    });
  } catch (err) {
    return apiError(err, "Could not send a verification code.");
  }
}

function throttled(retryAfterSeconds: number) {
  return NextResponse.json(
    { success: false, error: "Too many requests. Please wait before trying again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
