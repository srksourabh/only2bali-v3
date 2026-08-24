import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  account,
  availability,
  booking,
  bookingListing,
  departure,
  payment,
  paymentEvent,
  pkg,
  seatHold,
  serviceListing,
  traveller,
  tripRequest,
} from "@/lib/db/schema";
import {
  razorpayEventId,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments/razorpay";
import { razorpayConfig, stripeConfig } from "@/lib/payments/config";
import { stripeEventId, stripeWebhookEvent } from "@/lib/payments/stripe";
import type { PaymentIntentInput, RazorpayVerifyInput, StripeConfirmInput } from "@/lib/validators/payments";
import { createHeldDisbursementForBooking } from "@/lib/repositories/disbursements";
import Stripe from "stripe";

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
  provider: "cashfree" | "razorpay" | "stripe" | "manual_bank_transfer";
  providerOrderId: string | null;
  amount: number;
  currency: "INR";
  checkout: {
    mode: "cashfree" | "razorpay" | "stripe" | "manual";
    paymentSessionId?: string;
    orderId?: string;
    keyId?: string;
    url?: string;
    publishableKey?: string;
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
  const config = razorpayConfig();
  if (!config.acceptingPayments || !config.keyId || !config.keySecret) {
    throw new PaymentSetupError(
      "Razorpay checkout is paused until the separate dashboard webhook secret is configured."
    );
  }

  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
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

  return { providerOrderId: String(json.id), keyId: config.keyId };
}

function stripeSdk(secretKey: string): Stripe {
  return new Stripe(secretKey);
}

async function createStripeCheckoutSession(args: {
  paymentId: string;
  bookingId: string;
  reference: string;
  amount: number;
  currency: string;
  origin: string;
  returnTo: string;
}) {
  const config = stripeConfig();
  if (!config.acceptingPayments || !config.secretKey) {
    throw new PaymentSetupError(config.unavailableReason ?? "Stripe is not configured.");
  }

  const returnPath = args.returnTo.startsWith("/") ? args.returnTo : "/en/account";
  const joiner = returnPath.includes("?") ? "&" : "?";
  const session = await stripeSdk(config.secretKey).checkout.sessions.create({
    mode: "payment",
    success_url: `${args.origin}${returnPath}${joiner}session_id={CHECKOUT_SESSION_ID}&booking=${args.bookingId}`,
    cancel_url: `${args.origin}${returnPath}`,
    client_reference_id: args.bookingId,
    metadata: {
      bookingId: args.bookingId,
      paymentId: args.paymentId,
      reference: args.reference,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: args.currency.toLowerCase(),
          unit_amount: args.amount,
          product_data: { name: `Only2Bali booking ${args.reference}` },
        },
      },
    ],
  });

  if (!session.id || !session.url) {
    throw new Error("Stripe did not return a checkout session URL.");
  }
  return { providerOrderId: session.id, url: session.url, publishableKey: config.publishableKey };
}

export async function createPaymentIntent(
  accountId: string,
  input: PaymentIntentInput,
  opts?: { origin?: string }
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
  if (input.provider === "razorpay" && !razorpayConfig().acceptingPayments) {
    throw new PaymentSetupError(
      razorpayConfig().unavailableReason ??
        "Razorpay checkout is paused until the separate dashboard webhook secret is configured."
    );
  }
  if (input.provider === "stripe" && !stripeConfig().acceptingPayments) {
    throw new PaymentSetupError(stripeConfig().unavailableReason ?? "Stripe is not configured.");
  }

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
    let stripeUrl: string | undefined;
    if (input.provider === "stripe") {
      const secret = stripeConfig().secretKey;
      if (secret) {
        const existing = await stripeSdk(secret).checkout.sessions.retrieve(created.providerOrderId);
        stripeUrl = existing.url ?? undefined;
      }
    }
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
          : input.provider === "stripe"
            ? {
                mode: "stripe",
                orderId: created.providerOrderId,
                url: stripeUrl,
                publishableKey: stripeConfig().publishableKey ?? undefined,
              }
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

  if (input.provider === "stripe") {
    const origin = opts?.origin ?? "https://only2bali.vercel.app";
    const gateway = await createStripeCheckoutSession({
      paymentId: created.id,
      bookingId: input.bookingId,
      reference: row.reference,
      amount: created.amount,
      currency: created.currency,
      origin,
      returnTo: input.returnTo ?? "/en/account",
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
        mode: "stripe",
        orderId: gateway.providerOrderId,
        url: gateway.url,
        publishableKey: gateway.publishableKey ?? undefined,
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

export class PaymentSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentSignatureError";
  }
}

export type CaptureResult = {
  paymentId: string;
  bookingId: string;
  bookingReference: string;
  status: "captured" | "already_captured";
};

/**
 * Move seats from held → booked and mark the booking confirmed.
 * Idempotent: a second call on an already-confirmed booking is a no-op.
 */
async function confirmBookingFromPayment(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  args: { bookingId: string; paymentId: string; providerPaymentId: string }
): Promise<CaptureResult> {
  const [pay] = await tx
    .select({
      paymentId: payment.id,
      bookingId: payment.bookingId,
      paymentStatus: payment.status,
    })
    .from(payment)
    .where(eq(payment.id, args.paymentId))
    .limit(1)
    .for("update");

  if (!pay || pay.bookingId !== args.bookingId) {
    throw new PaymentContactError("Payment does not belong to this booking.");
  }

  const [book] = await tx
    .select({
      bookingId: booking.id,
      reference: booking.reference,
      status: booking.status,
      pax: booking.pax,
      departureId: booking.departureId,
      tripRequestId: booking.tripRequestId,
      vendorId: booking.vendorId,
      grossAmount: booking.grossAmount,
      commissionAmount: booking.commissionAmount,
      netAmount: booking.netAmount,
      currency: booking.currency,
    })
    .from(booking)
    .where(eq(booking.id, args.bookingId))
    .limit(1)
    .for("update");

  if (!book) throw new PaymentContactError("Booking not found.");

  if (pay.paymentStatus === "captured" && book.status === "confirmed") {
    return {
      paymentId: pay.paymentId,
      bookingId: book.bookingId,
      bookingReference: book.reference,
      status: "already_captured",
    };
  }

  const now = new Date();
  await tx
    .update(payment)
    .set({
      status: "captured",
      providerPaymentId: args.providerPaymentId,
      capturedAt: now,
      updatedAt: now,
      failureCode: null,
      failureMessage: null,
    })
    .where(eq(payment.id, args.paymentId));

  if (book.status === "pending_payment") {
    await tx
      .update(booking)
      .set({ status: "confirmed", confirmedAt: now, updatedAt: now })
      .where(eq(booking.id, args.bookingId));

    if (book.departureId) {
      const holds = await tx
        .delete(seatHold)
        .where(
          and(eq(seatHold.departureId, book.departureId), eq(seatHold.tripRequestId, book.tripRequestId))
        )
        .returning({ seats: seatHold.seats });
      const released = holds.reduce((sum, h) => sum + h.seats, 0);
      const seats = released > 0 ? released : book.pax;
      await tx
        .update(departure)
        .set({
          seatsHeld: sql`GREATEST(${departure.seatsHeld} - ${seats}, 0)`,
          seatsBooked: sql`${departure.seatsBooked} + ${seats}`,
        })
        .where(eq(departure.id, book.departureId));
    } else {
      // Listing booking: convert the date hold into a booked slot.
      const [link] = await tx
        .select({
          listingId: bookingListing.listingId,
          fromDate: tripRequest.fromDate,
        })
        .from(bookingListing)
        .innerJoin(booking, eq(bookingListing.bookingId, booking.id))
        .innerJoin(tripRequest, eq(booking.tripRequestId, tripRequest.id))
        .where(eq(bookingListing.bookingId, args.bookingId))
        .limit(1);
      if (link?.listingId && link.fromDate) {
        await tx
          .update(availability)
          .set({ status: "booked", holdExpiresAt: null })
          .where(
            and(eq(availability.listingId, link.listingId), eq(availability.date, link.fromDate))
          );
      }
    }
  }

  // Escrow: hold vendor payout until trip start / voucher (admin releases).
  if (book.vendorId && book.netAmount != null && book.netAmount > 0) {
    await createHeldDisbursementForBooking(tx, {
      bookingId: book.bookingId,
      paymentId: args.paymentId,
      vendorId: book.vendorId,
      grossAmount: book.grossAmount,
      commissionAmount: book.commissionAmount ?? Math.max(book.grossAmount - book.netAmount, 0),
      netAmount: book.netAmount,
      travellerCurrency: book.currency,
    });
  }

  return {
    paymentId: pay.paymentId,
    bookingId: book.bookingId,
    bookingReference: book.reference,
    status: "captured",
  };
}

/**
 * Checkout.js success path. Signature must match before any money state moves.
 */
export async function verifyRazorpayCheckout(
  accountId: string,
  input: RazorpayVerifyInput
): Promise<CaptureResult> {
  const { keySecret, checkoutConfigured } = razorpayConfig();
  if (!checkoutConfigured || !keySecret) {
    throw new PaymentSetupError("Razorpay is not configured. Set RAZORPAY_KEY_SECRET.");
  }

  const ok = verifyRazorpayPaymentSignature({
    orderId: input.razorpay_order_id,
    paymentId: input.razorpay_payment_id,
    signature: input.razorpay_signature,
    keySecret,
  });
  if (!ok) throw new PaymentSignatureError("Razorpay payment signature is invalid.");

  const [row] = await db
    .select({
      paymentId: payment.id,
      bookingId: booking.id,
      travellerAccountId: traveller.accountId,
      providerOrderId: payment.providerOrderId,
      provider: payment.provider,
    })
    .from(payment)
    .innerJoin(booking, eq(payment.bookingId, booking.id))
    .innerJoin(traveller, eq(booking.travellerId, traveller.id))
    .where(
      and(
        eq(booking.id, input.bookingId),
        eq(payment.provider, "razorpay"),
        eq(payment.providerOrderId, input.razorpay_order_id)
      )
    )
    .limit(1);

  if (!row || row.travellerAccountId !== accountId) {
    throw new PaymentContactError("Payment not found for this account.");
  }

  return db.transaction((tx) =>
    confirmBookingFromPayment(tx, {
      bookingId: row.bookingId,
      paymentId: row.paymentId,
      providerPaymentId: input.razorpay_payment_id,
    })
  );
}

type RazorpayWebhookPayload = {
  event?: string;
  created_at?: number;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        amount?: number;
        currency?: string;
        error_code?: string | null;
        error_description?: string | null;
      };
    };
  };
};

export type WebhookIngestResult = {
  accepted: boolean;
  duplicate: boolean;
  processed: boolean;
  signatureVerified: boolean;
  eventId: string;
  eventType: string;
};

/**
 * Persist every webhook first, then act only when the signature is valid.
 * Replay is safe: (provider, provider_event_id) is unique.
 */
export async function ingestRazorpayWebhook(args: {
  rawBody: string;
  signatureHeader: string | null;
  eventIdHeader: string | null;
}): Promise<WebhookIngestResult> {
  const { webhookSecret, webhookConfigured } = razorpayConfig();
  if (!webhookConfigured || !webhookSecret) {
    throw new PaymentSetupError(
      "Razorpay webhooks are paused until a separate dashboard webhook secret is configured."
    );
  }

  const signatureVerified = Boolean(
    args.signatureHeader &&
      verifyRazorpayWebhookSignature({
        rawBody: args.rawBody,
        signature: args.signatureHeader,
        webhookSecret,
      })
  );

  let parsed: RazorpayWebhookPayload;
  try {
    parsed = JSON.parse(args.rawBody) as RazorpayWebhookPayload;
  } catch {
    throw Object.assign(new Error("Invalid JSON webhook body."), { status: 400 });
  }

  const eventType = parsed.event ?? "unknown";
  const entity = parsed.payload?.payment?.entity;
  const providerPaymentId = entity?.id ?? null;
  const providerOrderId = entity?.order_id ?? null;
  const eventId = razorpayEventId({
    headerEventId: args.eventIdHeader,
    event: eventType,
    paymentId: providerPaymentId,
    createdAt: typeof parsed.created_at === "number" ? parsed.created_at : null,
  });

  const [existing] = await db
    .select({
      id: paymentEvent.id,
      processedAt: paymentEvent.processedAt,
      signatureVerified: paymentEvent.signatureVerified,
    })
    .from(paymentEvent)
    .where(and(eq(paymentEvent.provider, "razorpay"), eq(paymentEvent.providerEventId, eventId)))
    .limit(1);

  if (existing?.processedAt) {
    return {
      accepted: true,
      duplicate: true,
      processed: true,
      signatureVerified: existing.signatureVerified,
      eventId,
      eventType,
    };
  }

  let paymentId: string | null = null;
  if (providerOrderId) {
    const [pay] = await db
      .select({ id: payment.id })
      .from(payment)
      .where(and(eq(payment.provider, "razorpay"), eq(payment.providerOrderId, providerOrderId)))
      .limit(1);
    paymentId = pay?.id ?? null;
  }

  let eventRowId = existing?.id;
  if (!eventRowId) {
    try {
      const [inserted] = await db
        .insert(paymentEvent)
        .values({
          provider: "razorpay",
          providerEventId: eventId,
          paymentId,
          type: eventType,
          signatureVerified,
          payload: parsed,
        })
        .returning({ id: paymentEvent.id });
      eventRowId = inserted.id;
    } catch {
      // Lost the race to another delivery of the same event.
      const [again] = await db
        .select({
          id: paymentEvent.id,
          processedAt: paymentEvent.processedAt,
          signatureVerified: paymentEvent.signatureVerified,
        })
        .from(paymentEvent)
        .where(and(eq(paymentEvent.provider, "razorpay"), eq(paymentEvent.providerEventId, eventId)))
        .limit(1);
      if (again?.processedAt) {
        return {
          accepted: true,
          duplicate: true,
          processed: true,
          signatureVerified: again.signatureVerified,
          eventId,
          eventType,
        };
      }
      eventRowId = again?.id;
    }
  } else if (signatureVerified && !existing?.signatureVerified) {
    await db
      .update(paymentEvent)
      .set({ signatureVerified: true, paymentId: paymentId ?? undefined })
      .where(eq(paymentEvent.id, existing.id));
  }

  if (!signatureVerified) {
    if (eventRowId) {
      await db
        .update(paymentEvent)
        .set({ processingError: "signature_invalid" })
        .where(eq(paymentEvent.id, eventRowId));
    }
    throw new PaymentSignatureError("Razorpay webhook signature is invalid.");
  }

  if (!eventRowId) {
    throw new Error("Could not record payment event.");
  }

  let processed = false;
  let processingError: string | null = null;

  try {
    if (
      (eventType === "payment.captured" || eventType === "payment.authorized") &&
      paymentId &&
      providerPaymentId &&
      providerOrderId
    ) {
      const [pay] = await db
        .select({ bookingId: payment.bookingId })
        .from(payment)
        .where(eq(payment.id, paymentId))
        .limit(1);
      if (pay) {
        await db.transaction((tx) =>
          confirmBookingFromPayment(tx, {
            bookingId: pay.bookingId,
            paymentId,
            providerPaymentId,
          })
        );
        processed = true;
      } else {
        processingError = "payment_row_missing";
      }
    } else if (eventType === "payment.failed" && paymentId) {
      await db
        .update(payment)
        .set({
          status: "failed",
          failureCode: entity?.error_code ?? "payment_failed",
          failureMessage: entity?.error_description ?? "Razorpay reported payment.failed",
          updatedAt: new Date(),
        })
        .where(and(eq(payment.id, paymentId), eq(payment.status, "created")));
      processed = true;
    } else {
      // Acknowledged and stored; nothing to apply to booking state.
      processed = true;
    }
  } catch (err) {
    processingError = err instanceof Error ? err.message : "processing_failed";
  }

  await db
    .update(paymentEvent)
    .set({
      processedAt: processed ? new Date() : null,
      processingError,
      paymentId: paymentId ?? undefined,
    })
    .where(eq(paymentEvent.id, eventRowId));

  if (processingError && !processed) {
    throw new Error(processingError);
  }

  return {
    accepted: true,
    duplicate: Boolean(existing),
    processed,
    signatureVerified: true,
    eventId,
    eventType,
  };
}

export async function confirmStripeCheckout(
  accountId: string,
  input: StripeConfirmInput
): Promise<CaptureResult> {
  const { secretKey, checkoutConfigured } = stripeConfig();
  if (!checkoutConfigured || !secretKey) {
    throw new PaymentSetupError("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  const session = await stripeSdk(secretKey).checkout.sessions.retrieve(input.sessionId);
  const paid = session.payment_status === "paid";
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id;
  if (!paid) {
    throw new PaymentContactError("Stripe has not marked this session as paid yet.");
  }

  const [row] = await db
    .select({
      paymentId: payment.id,
      bookingId: booking.id,
      travellerAccountId: traveller.accountId,
    })
    .from(payment)
    .innerJoin(booking, eq(payment.bookingId, booking.id))
    .innerJoin(traveller, eq(booking.travellerId, traveller.id))
    .where(
      and(
        eq(booking.id, input.bookingId),
        eq(payment.provider, "stripe"),
        eq(payment.providerOrderId, input.sessionId)
      )
    )
    .limit(1);

  if (!row || row.travellerAccountId !== accountId) {
    throw new PaymentContactError("Payment not found for this account.");
  }

  return db.transaction((tx) =>
    confirmBookingFromPayment(tx, {
      bookingId: row.bookingId,
      paymentId: row.paymentId,
      providerPaymentId: paymentIntentId,
    })
  );
}

function stripeSessionFromEvent(event: Stripe.Event): Stripe.Checkout.Session | null {
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    return event.data.object as Stripe.Checkout.Session;
  }
  return null;
}

export async function ingestStripeWebhook(args: {
  rawBody: string;
  signatureHeader: string | null;
}): Promise<WebhookIngestResult> {
  const { webhookSecret, webhookConfigured } = stripeConfig();
  if (!webhookConfigured || !webhookSecret) {
    throw new PaymentSetupError("Stripe webhooks are paused until STRIPE_WEBHOOK_SECRET is configured.");
  }
  if (!args.signatureHeader) {
    throw new PaymentSignatureError("Stripe webhook signature is missing.");
  }

  let event: Stripe.Event;
  let signatureVerified = false;
  try {
    event = stripeWebhookEvent({
      rawBody: args.rawBody,
      signature: args.signatureHeader,
      webhookSecret,
    });
    signatureVerified = true;
  } catch {
    throw new PaymentSignatureError("Stripe webhook signature is invalid.");
  }

  const eventId = stripeEventId(event);
  const eventType = event.type;
  const session = stripeSessionFromEvent(event);
  const providerOrderId = session?.id ?? null;
  const providerPaymentId =
    typeof session?.payment_intent === "string"
      ? session.payment_intent
      : session?.payment_intent?.id ?? null;

  const [existing] = await db
    .select({
      id: paymentEvent.id,
      processedAt: paymentEvent.processedAt,
      signatureVerified: paymentEvent.signatureVerified,
    })
    .from(paymentEvent)
    .where(and(eq(paymentEvent.provider, "stripe"), eq(paymentEvent.providerEventId, eventId)))
    .limit(1);

  if (existing?.processedAt) {
    return {
      accepted: true,
      duplicate: true,
      processed: true,
      signatureVerified: existing.signatureVerified,
      eventId,
      eventType,
    };
  }

  let paymentId: string | null = null;
  if (providerOrderId) {
    const [pay] = await db
      .select({ id: payment.id })
      .from(payment)
      .where(and(eq(payment.provider, "stripe"), eq(payment.providerOrderId, providerOrderId)))
      .limit(1);
    paymentId = pay?.id ?? null;
  }

  let eventRowId = existing?.id;
  if (!eventRowId) {
    try {
      const [inserted] = await db
        .insert(paymentEvent)
        .values({
          provider: "stripe",
          providerEventId: eventId,
          paymentId,
          type: eventType,
          signatureVerified,
          payload: event as unknown as Record<string, unknown>,
        })
        .returning({ id: paymentEvent.id });
      eventRowId = inserted.id;
    } catch {
      const [again] = await db
        .select({
          id: paymentEvent.id,
          processedAt: paymentEvent.processedAt,
          signatureVerified: paymentEvent.signatureVerified,
        })
        .from(paymentEvent)
        .where(and(eq(paymentEvent.provider, "stripe"), eq(paymentEvent.providerEventId, eventId)))
        .limit(1);
      if (again?.processedAt) {
        return {
          accepted: true,
          duplicate: true,
          processed: true,
          signatureVerified: again.signatureVerified,
          eventId,
          eventType,
        };
      }
      eventRowId = again?.id;
    }
  }

  if (!eventRowId) {
    throw new Error("Could not record payment event.");
  }

  let processed = false;
  let processingError: string | null = null;

  try {
    const paid =
      (eventType === "checkout.session.completed" && session?.payment_status === "paid") ||
      eventType === "checkout.session.async_payment_succeeded";
    if (paid && paymentId && (providerPaymentId || providerOrderId)) {
      const [pay] = await db
        .select({ bookingId: payment.bookingId })
        .from(payment)
        .where(eq(payment.id, paymentId))
        .limit(1);
      if (pay) {
        await db.transaction((tx) =>
          confirmBookingFromPayment(tx, {
            bookingId: pay.bookingId,
            paymentId,
            providerPaymentId: providerPaymentId ?? providerOrderId!,
          })
        );
        processed = true;
      } else {
        processingError = "payment_row_missing";
      }
    } else if (
      (eventType === "checkout.session.async_payment_failed" || eventType === "checkout.session.expired") &&
      paymentId
    ) {
      await db
        .update(payment)
        .set({
          status: "failed",
          failureCode: eventType,
          failureMessage: `Stripe reported ${eventType}`,
          updatedAt: new Date(),
        })
        .where(and(eq(payment.id, paymentId), eq(payment.status, "created")));
      processed = true;
    } else {
      processed = true;
    }
  } catch (err) {
    processingError = err instanceof Error ? err.message : "processing_failed";
  }

  await db
    .update(paymentEvent)
    .set({
      processedAt: processed ? new Date() : null,
      processingError,
      paymentId: paymentId ?? undefined,
    })
    .where(eq(paymentEvent.id, eventRowId));

  if (processingError && !processed) {
    throw new Error(processingError);
  }

  return {
    accepted: true,
    duplicate: Boolean(existing),
    processed,
    signatureVerified: true,
    eventId,
    eventType,
  };
}

export type AccountBookingRow = {
  bookingId: string;
  reference: string;
  status: string;
  grossAmount: number;
  currency: string;
  pax: number;
  packageName: string | null;
  packageSlug: string | null;
  listingTitle: string | null;
  listingId: string | null;
  createdAt: Date;
  holdExpiresAt: Date | null;
};

/** Bookings the signed-in traveller owns, newest first. */
export async function listAccountBookings(accountId: string): Promise<AccountBookingRow[]> {
  const rows = await db
    .select({
      bookingId: booking.id,
      reference: booking.reference,
      status: booking.status,
      grossAmount: booking.grossAmount,
      currency: booking.currency,
      pax: booking.pax,
      packageName: pkg.name,
      packageSlug: pkg.slug,
      listingTitle: serviceListing.title,
      listingId: serviceListing.id,
      createdAt: booking.createdAt,
      tripRequestId: booking.tripRequestId,
      departureId: booking.departureId,
      serviceDate: tripRequest.fromDate,
    })
    .from(booking)
    .innerJoin(traveller, eq(booking.travellerId, traveller.id))
    .leftJoin(pkg, eq(booking.packageId, pkg.id))
    .leftJoin(bookingListing, eq(bookingListing.bookingId, booking.id))
    .leftJoin(serviceListing, eq(bookingListing.listingId, serviceListing.id))
    .leftJoin(tripRequest, eq(booking.tripRequestId, tripRequest.id))
    .where(eq(traveller.accountId, accountId))
    .orderBy(desc(booking.createdAt))
    .limit(50);

  const tripIds = [...new Set(rows.map((r) => r.tripRequestId))];
  const holds = tripIds.length
    ? await db
        .select({
          tripRequestId: seatHold.tripRequestId,
          departureId: seatHold.departureId,
          expiresAt: seatHold.expiresAt,
        })
        .from(seatHold)
        .where(inArray(seatHold.tripRequestId, tripIds))
    : [];

  const holdByTrip = new Map(
    holds.map((h) => [`${h.tripRequestId}:${h.departureId ?? ""}`, h.expiresAt] as const)
  );

  const listingIds = rows
    .filter((r) => r.listingId && r.serviceDate && r.status === "pending_payment")
    .map((r) => ({ listingId: r.listingId!, date: r.serviceDate! }));

  const listingHolds =
    listingIds.length > 0
      ? await db
          .select({
            listingId: availability.listingId,
            date: availability.date,
            holdExpiresAt: availability.holdExpiresAt,
            status: availability.status,
          })
          .from(availability)
          .where(
            and(
              inArray(
                availability.listingId,
                [...new Set(listingIds.map((l) => l.listingId))]
              ),
              eq(availability.status, "held")
            )
          )
      : [];

  const listingHoldMap = new Map(
    listingHolds.map((h) => [`${h.listingId}:${h.date}`, h.holdExpiresAt] as const)
  );

  return rows.map((r) => ({
    bookingId: r.bookingId,
    reference: r.reference,
    status: r.status,
    grossAmount: r.grossAmount,
    currency: r.currency,
    pax: r.pax,
    packageName: r.packageName,
    packageSlug: r.packageSlug,
    listingTitle: r.listingTitle,
    listingId: r.listingId,
    createdAt: r.createdAt,
    holdExpiresAt:
      r.status === "pending_payment"
        ? r.departureId
          ? holdByTrip.get(`${r.tripRequestId}:${r.departureId}`) ?? null
          : r.listingId && r.serviceDate
            ? listingHoldMap.get(`${r.listingId}:${r.serviceDate}`) ?? null
            : null
        : null,
  }));
}
