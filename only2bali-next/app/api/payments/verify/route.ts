import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { razorpayVerifySchema } from "@/lib/validators/payments";
import {
  PaymentContactError,
  PaymentSetupError,
  PaymentSignatureError,
  verifyRazorpayCheckout,
} from "@/lib/repositories/payments";

export const dynamic = "force-dynamic";

/**
 * Checkout.js success handler. Confirms the booking only after the HMAC over
 * order_id|payment_id matches RAZORPAY_KEY_SECRET. Amounts are never taken
 * from the client — the server payment row is the source of truth.
 */
export async function POST(req: Request) {
  try {
    // Travellers pay; admins may verify a capture while supporting a booking.
    const user = await requireRole("traveller", "admin");
    const parsed = razorpayVerifySchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const result = await verifyRazorpayCheckout(user.accountId, parsed.data);
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
    if (err instanceof PaymentContactError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 409 });
    }
    return apiError(err, "Could not verify payment.");
  }
}
