import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { paymentIntentSchema } from "@/lib/validators/payments";
import { createPaymentIntent, PaymentContactError, PaymentSetupError } from "@/lib/repositories/payments";

export const dynamic = "force-dynamic";

function checkoutOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin && /^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin)) {
    return origin.replace(/\/$/, "");
  }
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .split(",")[0]
    .trim();
  const proto = (req.headers.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  if (host) return `${proto}://${host}`;
  return "https://only2bali.vercel.app";
}

export async function POST(req: Request) {
  try {
    const user = await requireRole("traveller", "admin");
    const parsed = paymentIntentSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const intent = await createPaymentIntent(user.accountId, parsed.data, {
      origin: checkoutOrigin(req),
    });
    return NextResponse.json({ success: true, data: intent }, { status: 201 });
  } catch (err) {
    if (err instanceof PaymentSetupError) {
      return NextResponse.json({ success: false, error: err.message, reason: "payment_setup_required" }, { status: 503 });
    }
    if (err instanceof PaymentContactError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 409 });
    }
    return apiError(err, "Could not start checkout.");
  }
}
