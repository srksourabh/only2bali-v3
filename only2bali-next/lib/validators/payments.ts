import { z } from "zod";

export const paymentIntentSchema = z.object({
  bookingId: z.uuid(),
  /** Traveller picks Stripe or Razorpay. Cashfree remains available when configured. */
  provider: z.enum(["cashfree", "razorpay", "stripe", "manual_bank_transfer"]).default("razorpay"),
  purpose: z.enum(["deposit", "balance", "full", "addon"]).default("full"),
  idempotencyKey: z.string().trim().min(12).max(160).optional(),
  /** Same-origin path to return to after Stripe Checkout. */
  returnTo: z
    .string()
    .trim()
    .regex(/^\/[A-Za-z0-9/_-]*$/, "Return path must be a relative site path.")
    .max(200)
    .optional(),
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

export const stripeConfirmSchema = z.object({
  bookingId: z.uuid(),
  sessionId: z.string().trim().min(8).max(128),
});

export type StripeConfirmInput = z.infer<typeof stripeConfirmSchema>;
