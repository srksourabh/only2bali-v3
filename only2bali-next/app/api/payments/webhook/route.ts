import { NextResponse } from "next/server";
import {
  ingestRazorpayWebhook,
  PaymentSetupError,
  PaymentSignatureError,
} from "@/lib/repositories/payments";

export const dynamic = "force-dynamic";

/**
 * Razorpay → Only2Bali. Signature is checked against the raw body. Every
 * delivery is written to payment_event before anything moves a booking; a
 * bad signature is still recorded, then refused.
 *
 * Configure the webhook URL in the Razorpay dashboard to:
 *   POST /api/payments/webhook
 * and subscribe at least to payment.captured and payment.failed.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (rawBody.length > 256_000) {
      return NextResponse.json({ success: false, error: "Payload too large." }, { status: 413 });
    }

    const result = await ingestRazorpayWebhook({
      rawBody,
      signatureHeader: req.headers.get("x-razorpay-signature"),
      eventIdHeader: req.headers.get("x-razorpay-event-id"),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof PaymentSignatureError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    if (err instanceof PaymentSetupError) {
      return NextResponse.json(
        { success: false, error: err.message, reason: "payment_setup_required" },
        { status: 503 }
      );
    }
    if (err instanceof Error && "status" in err && typeof (err as { status?: number }).status === "number") {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: (err as { status: number }).status }
      );
    }
    console.error("[payments/webhook]", err);
    return NextResponse.json({ success: false, error: "Webhook processing failed." }, { status: 500 });
  }
}
