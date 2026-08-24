import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { stripeConfirmSchema } from "@/lib/validators/payments";
import {
  confirmStripeCheckout,
  PaymentContactError,
  PaymentSetupError,
} from "@/lib/repositories/payments";

export const dynamic = "force-dynamic";

/** Browser return from Stripe Checkout. Webhook remains the source of truth. */
export async function POST(req: Request) {
  try {
    const user = await requireRole("traveller", "admin");
    const parsed = stripeConfirmSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const result = await confirmStripeCheckout(user.accountId, parsed.data);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof PaymentSetupError) {
      return NextResponse.json(
        { success: false, error: err.message, reason: "payment_setup_required" },
        { status: 503 }
      );
    }
    if (err instanceof PaymentContactError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 409 });
    }
    return apiError(err, "Could not confirm Stripe payment.");
  }
}
