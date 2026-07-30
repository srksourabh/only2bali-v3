import { z } from "zod";

export const paymentIntentSchema = z.object({
  bookingId: z.uuid(),
  /** Razorpay is the INR default; Cashfree remains available when configured. */
  provider: z.enum(["cashfree", "razorpay", "manual_bank_transfer"]).default("razorpay"),
  purpose: z.enum(["deposit", "balance", "full", "addon"]).default("full"),
  idempotencyKey: z.string().trim().min(12).max(160).optional(),
});

export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;

/**
 * Body posted by the Checkout.js success handler. Amounts are never accepted
 * from the client — capture uses the server-stored payment row.
 */
export const razorpayVerifySchema = z.object({
  bookingId: z.uuid(),
  razorpay_order_id: z.string().trim().min(8).max(64),
  razorpay_payment_id: z.string().trim().min(8).max(64),
  razorpay_signature: z.string().trim().min(32).max(128),
});

export type RazorpayVerifyInput = z.infer<typeof razorpayVerifySchema>;
