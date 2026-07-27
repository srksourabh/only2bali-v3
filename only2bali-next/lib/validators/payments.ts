import { z } from "zod";

export const paymentIntentSchema = z.object({
  bookingId: z.uuid(),
  provider: z.enum(["cashfree", "razorpay", "manual_bank_transfer"]).default("cashfree"),
  purpose: z.enum(["deposit", "balance", "full", "addon"]).default("full"),
  idempotencyKey: z.string().trim().min(12).max(160).optional(),
});

export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
