import { describe, expect, it } from "vitest";
import {
  RAZORPAY_WEBHOOK_SECRET_PLACEHOLDER,
  razorpayConfig,
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
      acceptingPayments: false,
    });
  });

  it("rejects a URL because a webhook endpoint is not a webhook secret", () => {
    const status = razorpayConfig({
      ...liveKeys,
      RAZORPAY_WEBHOOK_SECRET: "https://example.com/api/payments/webhook",
    });

    expect(status.webhookConfigured).toBe(false);
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
      acceptingPayments: true,
    });
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
