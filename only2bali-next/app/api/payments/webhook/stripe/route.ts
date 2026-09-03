import { NextResponse } from "next/server";
import {
  ingestStripeWebhook,
  PaymentSetupError,
  PaymentSignatureError,
} from "@/lib/repositories/payments";

export const dynamic = "force-dynamic";

/**
 * Stripe → Only2Bali. Dashboard URL:
 *   POST /api/payments/webhook/stripe
 * Subscribe to checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (rawBody.length > 256_000) {
      return NextResponse.json({ success: false, error: "Payload too large." }, { status: 413 });
    }

    const result = await ingestStripeWebhook({
      rawBody,
      signatureHeader: req.headers.get("stripe-signature"),
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
    console.error("[payments/webhook/stripe]", err);
    return NextResponse.json({ success: false, error: "Webhook processing failed." }, { status: 500 });
  }
}
