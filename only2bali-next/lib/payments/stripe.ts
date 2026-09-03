/**
 * Stripe webhook helpers. No network — tests construct a signed header locally.
 */
import Stripe from "stripe";

export function stripeWebhookEvent(args: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): Stripe.Event {
  return Stripe.webhooks.constructEvent(args.rawBody, args.signature, args.webhookSecret);
}

export function verifyStripeWebhookSignature(args: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  try {
    stripeWebhookEvent(args);
    return true;
  } catch {
    return false;
  }
}

export function stripeTestWebhookHeader(rawBody: string, webhookSecret: string): string {
  return Stripe.webhooks.generateTestHeaderString({
    payload: rawBody,
    secret: webhookSecret,
  });
}

export function stripeEventId(event: { id?: string | null; type?: string; created?: number }): string {
  if (event.id && event.id.trim()) return event.id.trim();
  return `${event.type ?? "unknown"}:${event.created ?? 0}`;
}
