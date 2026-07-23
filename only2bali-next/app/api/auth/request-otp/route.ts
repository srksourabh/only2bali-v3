import { NextResponse } from "next/server";
import { requestOtpSchema, toIdentifier } from "@/lib/validators/auth";
import { requestOtp } from "@/lib/auth/service";
import { canDeliver } from "@/lib/auth/delivery";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitShared } from "@/lib/rate-limit-db";

export const dynamic = "force-dynamic";

/** Per identifier: stops one number being flooded. Each send costs real money. */
const PER_IDENTIFIER = { limit: 5, windowMs: 15 * 60_000 };
/** Per IP: stops one attacker cycling through many numbers. */
const PER_IP = { limit: 20, windowMs: 15 * 60_000 };

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

    const parsed = requestOtpSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Check the details and try again.",
          fields: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        { status: 400 }
      );
    }

    // Say so before spending a rate-limit slot and writing a code nobody can
    // read. The alternative — a generic 500 after the visitor has waited — is
    // how "login is quietly broken" goes unnoticed for a week.
    const channel = parsed.data.email ? "email" : "sms";
    if (!canDeliver(channel)) {
      return NextResponse.json(
        {
          success: false,
          error:
            channel === "email"
              ? "Email sign-in is not available yet. Please contact us instead."
              : "SMS sign-in is not available yet. Please contact us instead.",
          reason: "delivery_not_configured",
        },
        { status: 503 }
      );
    }

    const ip = clientKey(req);
    const identifier = toIdentifier(parsed.data);

    const byIp = await rateLimitShared(`otp:ip:${ip}`, PER_IP.limit, PER_IP.windowMs);
    if (!byIp.allowed) return throttled(byIp.retryAfterSeconds);

    const byId = await rateLimitShared(`otp:id:${identifier}`, PER_IDENTIFIER.limit, PER_IDENTIFIER.windowMs);
    if (!byId.allowed) return throttled(byId.retryAfterSeconds);

    await requestOtp(parsed.data, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    // Deliberately identical whether or not an account exists. Varying this
    // turns the endpoint into an account-enumeration oracle.
    return NextResponse.json({
      success: true,
      data: { message: "If that contact is valid, a six-digit code is on its way." },
    });
  } catch (err) {
    console.error("[auth] request-otp failed", err);
    return NextResponse.json(
      { success: false, error: "Could not send a code right now. Please try again." },
      { status: 500 }
    );
  }
}

function throttled(retryAfterSeconds: number) {
  return NextResponse.json(
    { success: false, error: "Too many requests. Please wait before trying again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
