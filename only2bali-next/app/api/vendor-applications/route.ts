import { NextResponse } from "next/server";
import { vendorApplicationSchema } from "@/lib/validators/leads";
import { createVendorApplication } from "@/lib/repositories/leads";
import { consumeVendorApplicationEmailCode } from "@/lib/auth/service";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitShared } from "@/lib/rate-limit-db";

export const dynamic = "force-dynamic";

const PER_IP = { limit: 5, windowMs: 60 * 60_000 };
const MAX_BODY_BYTES = 8192;

function emailCodeError(reason: "no_code" | "expired" | "locked" | "invalid"): string {
  if (reason === "locked") return "Too many incorrect attempts. Request a new code.";
  if (reason === "expired") return "That code has expired. Request a new one.";
  if (reason === "no_code") return "Request a verification code for this email first.";
  return "That email verification code is not valid.";
}

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

    const parsed = vendorApplicationSchema.safeParse(json);
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

    const ip = clientKey(req);
    const limit = await rateLimitShared(`vendor-app:ip:${ip}`, PER_IP.limit, PER_IP.windowMs);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many applications from this connection. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const verified = await consumeVendorApplicationEmailCode(parsed.data.email, parsed.data.emailCode);
    if (!verified.ok) {
      return NextResponse.json(
        { success: false, error: emailCodeError(verified.reason), reason: verified.reason },
        { status: 400 }
      );
    }

    const { id } = await createVendorApplication(parsed.data, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ success: true, data: { id } }, { status: 201 });
  } catch (err) {
    console.error("[vendor-applications] could not store application", err);
    return NextResponse.json(
      { success: false, error: "We could not save that just now. Please try WhatsApp, or try again." },
      { status: 500 }
    );
  }
}
