import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { account, booking, payment, traveller } from "@/lib/db/schema";
import type { PaymentIntentInput } from "@/lib/validators/payments";

export class PaymentSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentSetupError";
  }
}

export class PaymentContactError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentContactError";
  }
}

export type PaymentIntentResult = {
  paymentId: string;
  bookingId: string;
  provider: "cashfree" | "razorpay" | "manual_bank_transfer";
  providerOrderId: string | null;
  amount: number;
  currency: "INR";
  checkout: {
    mode: "cashfree" | "razorpay" | "manual";
    paymentSessionId?: string;
    orderId?: string;
    keyId?: string;
    instructions?: string;
  };
};

function cashfreeBaseUrl() {
  return process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

async function createCashfreeOrder(args: {
  paymentId: string;
  reference: string;
  amount: number;
  currency: string;
  customer: { accountId: string; email: string | null; mobile: string | null };
}) {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new PaymentSetupError("Cashfree is not configured. Set CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET.");
  }
  if (!args.customer.email && !args.customer.mobile) {
    throw new PaymentContactError("Cashfree checkout needs a verified email or mobile number.");
  }

  const orderId = `o2b_${args.reference.replace(/[^a-z0-9]/gi, "").toLowerCase()}_${args.paymentId.slice(0, 8)}`;
  const res = await fetch(`${cashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-version": "2026-01-01",
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: Number((args.amount / 100).toFixed(2)),
      order_currency: args.currency,
      customer_details: {
        customer_id: args.customer.accountId,
        customer_email: args.customer.email ?? undefined,
        customer_phone: args.customer.mobile ?? undefined,
      },
      order_note: `Only2Bali booking ${args.reference}. Traveller pays INR; provider payout ledger tracks IDR.`,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message ?? "Cashfree order creation failed.");
  }

  return {
    providerOrderId: String(json.order_id ?? orderId),
    paymentSessionId: String(json.payment_session_id ?? ""),
  };
}

async function createRazorpayOrder(args: { reference: string; amount: number; currency: string }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new PaymentSetupError("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: args.amount,
      currency: args.currency,
      receipt: args.reference,
      notes: {
        platform: "Only2Bali",
        traveller_currency: "INR",
        vendor_display_currency: "IDR",
      },
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.description ?? "Razorpay order creation failed.");
  }

  return { providerOrderId: String(json.id), keyId };
}

export async function createPaymentIntent(
  accountId: string,
  input: PaymentIntentInput
): Promise<PaymentIntentResult> {
  const [row] = await db
    .select({
      bookingId: booking.id,
      reference: booking.reference,
      grossAmount: booking.grossAmount,
      currency: booking.currency,
      status: booking.status,
      travellerAccountId: traveller.accountId,
      email: account.email,
      mobile: account.mobile,
    })
    .from(booking)
    .innerJoin(traveller, eq(booking.travellerId, traveller.id))
    .innerJoin(account, eq(traveller.accountId, account.id))
    .where(and(eq(booking.id, input.bookingId), eq(traveller.accountId, accountId)))
    .limit(1);

  if (!row) throw new PaymentContactError("Booking not found for this account.");
  if (row.status !== "pending_payment") throw new PaymentContactError("This booking is not waiting for payment.");
  if (row.currency !== "INR") throw new PaymentSetupError("Only INR traveler checkout is enabled.");

  const idempotencyKey = input.idempotencyKey ?? `pay_${input.bookingId}_${input.purpose}_${randomUUID()}`;
  const [created] = await db
    .insert(payment)
    .values({
      bookingId: input.bookingId,
      provider: input.provider,
      amount: row.grossAmount,
      currency: "INR",
      purpose: input.purpose,
      idempotencyKey,
      notes: "Traveller checkout amount is INR. Provider disbursement may be tracked in IDR after capture.",
      initiatedBy: accountId,
    })
    .onConflictDoUpdate({
      target: payment.idempotencyKey,
      set: { updatedAt: new Date() },
    })
    .returning();

  if (created.providerOrderId) {
    return {
      paymentId: created.id,
      bookingId: input.bookingId,
      provider: input.provider,
      providerOrderId: created.providerOrderId,
      amount: created.amount,
      currency: "INR",
      checkout:
        input.provider === "razorpay"
          ? { mode: "razorpay", orderId: created.providerOrderId, keyId: process.env.RAZORPAY_KEY_ID }
          : { mode: "cashfree", orderId: created.providerOrderId },
    };
  }

  if (input.provider === "manual_bank_transfer") {
    return {
      paymentId: created.id,
      bookingId: input.bookingId,
      provider: input.provider,
      providerOrderId: null,
      amount: created.amount,
      currency: "INR",
      checkout: {
        mode: "manual",
        instructions: "Collect INR by approved bank transfer or UPI only after an admin confirms the booking.",
      },
    };
  }

  if (input.provider === "cashfree") {
    const gateway = await createCashfreeOrder({
      paymentId: created.id,
      reference: row.reference,
      amount: created.amount,
      currency: created.currency,
      customer: { accountId, email: row.email, mobile: row.mobile },
    });
    await db
      .update(payment)
      .set({ providerOrderId: gateway.providerOrderId, updatedAt: new Date() })
      .where(eq(payment.id, created.id));

    return {
      paymentId: created.id,
      bookingId: input.bookingId,
      provider: input.provider,
      providerOrderId: gateway.providerOrderId,
      amount: created.amount,
      currency: "INR",
      checkout: {
        mode: "cashfree",
        orderId: gateway.providerOrderId,
        paymentSessionId: gateway.paymentSessionId,
      },
    };
  }

  const gateway = await createRazorpayOrder({
    reference: row.reference,
    amount: created.amount,
    currency: created.currency,
  });
  await db
    .update(payment)
    .set({ providerOrderId: gateway.providerOrderId, updatedAt: new Date() })
    .where(eq(payment.id, created.id));

  return {
    paymentId: created.id,
    bookingId: input.bookingId,
    provider: input.provider,
    providerOrderId: gateway.providerOrderId,
    amount: created.amount,
    currency: "INR",
    checkout: {
      mode: "razorpay",
      orderId: gateway.providerOrderId,
      keyId: gateway.keyId,
    },
  };
}
