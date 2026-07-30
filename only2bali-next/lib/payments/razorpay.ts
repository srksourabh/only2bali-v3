/**
 * Razorpay crypto helpers. Pure functions so the signature rules can be tested
 * without a database or a live gateway.
 *
 * Payment verification (Checkout.js handler): HMAC-SHA256 of
 *   `${order_id}|${payment_id}`
 * keyed with RAZORPAY_KEY_SECRET, hex-encoded, compared to razorpay_signature.
 *
 * Webhook verification: HMAC-SHA256 of the raw request body keyed with
 * RAZORPAY_WEBHOOK_SECRET, hex-encoded, compared to X-Razorpay-Signature.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function hexEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) {
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export function razorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  keySecret: string
): string {
  return createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function verifyRazorpayPaymentSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expected = razorpayPaymentSignature(args.orderId, args.paymentId, args.keySecret);
  return hexEqual(expected, args.signature);
}

export function razorpayWebhookSignature(rawBody: string, webhookSecret: string): string {
  return createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
}

export function verifyRazorpayWebhookSignature(args: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  const expected = razorpayWebhookSignature(args.rawBody, args.webhookSecret);
  return hexEqual(expected, args.signature);
}

/** Stable id for the payment_event ledger when Razorpay omits x-razorpay-event-id. */
export function razorpayEventId(args: {
  headerEventId: string | null;
  event: string;
  paymentId: string | null;
  createdAt: number | null;
}): string {
  if (args.headerEventId && args.headerEventId.trim()) return args.headerEventId.trim();
  const payment = args.paymentId ?? "unknown";
  const at = args.createdAt ?? 0;
  return `${args.event}:${payment}:${at}`;
}
