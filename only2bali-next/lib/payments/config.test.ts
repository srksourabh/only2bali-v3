import { describe, expect, it } from "vitest";
import {
  RAZORPAY_WEBHOOK_SECRET_PLACEHOLDER,
  paymentGatewayOptions,
  razorpayConfig,
  stripeConfig,
} from "./config";

const liveKeys = {
  RAZORPAY_KEY_ID: "rzp_live_example",
  RAZORPAY_KEY_SECRET: "key-secret",
};

describe("razorpayConfig", () => {
  it("keeps live checkout paused when the webhook uses the documented placeholder", () => {
    const status = razorpayConfig({
      ...liveKeys,
      RAZORPAY_WEBHOOK_SECRET: RAZORPAY_WEBHOOK_SECRET_PLACEHOLDER,
    });

    expect(status).toMatchObject({
      mode: "live",
      checkoutConfigured: true,
      webhookConfigured: false,
      webhookBlocker: "placeholder",
      acceptingPayments: false,
    });
  });

  it("rejects a URL because a webhook endpoint is not a webhook secret", () => {
    const status = razorpayConfig({
      ...liveKeys,
      RAZORPAY_WEBHOOK_SECRET: "https://example.com/api/payments/webhook",
    });

    expect(status.webhookConfigured).toBe(false);
    expect(status.webhookBlocker).toBe("url");
    expect(status.acceptingPayments).toBe(false);
  });

  it("accepts a complete key pair and strong separate webhook secret", () => {
    const status = razorpayConfig({
      ...liveKeys,
      RAZORPAY_WEBHOOK_SECRET: "a-strong-separate-webhook-secret-value-123",
    });

    expect(status).toMatchObject({
      mode: "live",
      checkoutConfigured: true,
      webhookConfigured: true,
      webhookBlocker: null,
      acceptingPayments: true,
    });
  });

  it("classifies a short secret without exposing it", () => {
    const status = razorpayConfig({
      ...liveKeys,
      RAZORPAY_WEBHOOK_SECRET: "only-31-chars-not-long-enough!",
    });
    expect(status.webhookBlocker).toBe("too_short");
    expect(status.webhookConfigured).toBe(false);
  });

  it("rejects malformed key ids even when both secrets exist", () => {
    const status = razorpayConfig({
      RAZORPAY_KEY_ID: "example",
      RAZORPAY_KEY_SECRET: "key-secret",
      RAZORPAY_WEBHOOK_SECRET: "a-strong-separate-webhook-secret-value-123",
    });

    expect(status.mode).toBe("unknown");
    expect(status.checkoutConfigured).toBe(false);
    expect(status.acceptingPayments).toBe(false);
  });
});

const stripeKeys = {
  STRIPE_SECRET_KEY: "sk_test_example",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_example",
  STRIPE_WEBHOOK_SECRET: "whsec_test_only2bali_signature_secret",
};

describe("stripeConfig", () => {
  it("pauses checkout until the webhook signing secret is present", () => {
    const status = stripeConfig({
      STRIPE_SECRET_KEY: stripeKeys.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripeKeys.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
    expect(status.acceptingPayments).toBe(false);
    expect(status.unavailableReason).toMatch(/webhook secret is missing/i);
  });

  it("rejects a webhook secret that is not a Stripe signing secret", () => {
    const status = stripeConfig({
      ...stripeKeys,
      STRIPE_WEBHOOK_SECRET: "not-a-stripe-secret",
    });
    expect(status.webhookBlocker).toBe("malformed");
    expect(status.acceptingPayments).toBe(false);
  });

  it("accepts a complete Stripe key set", () => {
    const status = stripeConfig(stripeKeys);
    expect(status).toMatchObject({
      mode: "test",
      checkoutConfigured: true,
      webhookConfigured: true,
      acceptingPayments: true,
      unavailableReason: null,
    });
  });
});

describe("paymentGatewayOptions", () => {
  it("always returns both gateways and explains when one is unavailable", () => {
    const options = paymentGatewayOptions({
      ...liveKeys,
      RAZORPAY_WEBHOOK_SECRET: "a-strong-separate-webhook-secret-value-123",
    });
    expect(options.stripe.available).toBe(false);
    expect(options.stripe.reason).toMatch(/Stripe/i);
    expect(options.razorpay.available).toBe(true);
    expect(options.razorpay.reason).toBeNull();
  });
});

