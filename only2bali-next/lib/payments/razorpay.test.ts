import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import {
  razorpayEventId,
  razorpayPaymentSignature,
  razorpayWebhookSignature,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "./razorpay";

describe("razorpayPaymentSignature", () => {
  it("matches Razorpay's order_id|payment_id HMAC", () => {
    const secret = "test_key_secret";
    const orderId = "order_ABC";
    const paymentId = "pay_XYZ";
    const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    expect(razorpayPaymentSignature(orderId, paymentId, secret)).toBe(expected);
    expect(
      verifyRazorpayPaymentSignature({
        orderId,
        paymentId,
        signature: expected,
        keySecret: secret,
      })
    ).toBe(true);
  });

  it("rejects a tampered signature", () => {
    expect(
      verifyRazorpayPaymentSignature({
        orderId: "order_ABC",
        paymentId: "pay_XYZ",
        signature: "0".repeat(64),
        keySecret: "test_key_secret",
      })
    ).toBe(false);
  });

  it("rejects a signature for a different payment id", () => {
    const secret = "test_key_secret";
    const signature = razorpayPaymentSignature("order_ABC", "pay_OTHER", secret);
    expect(
      verifyRazorpayPaymentSignature({
        orderId: "order_ABC",
        paymentId: "pay_XYZ",
        signature,
        keySecret: secret,
      })
    ).toBe(false);
  });
});

describe("razorpayWebhookSignature", () => {
  it("HMAC-SHA256s the raw body with the webhook secret", () => {
    const secret = "whsec_test";
    const body = '{"event":"payment.captured"}';
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    expect(razorpayWebhookSignature(body, secret)).toBe(expected);
    expect(
      verifyRazorpayWebhookSignature({ rawBody: body, signature: expected, webhookSecret: secret })
    ).toBe(true);
  });

  it("rejects a body that was altered after signing", () => {
    const secret = "whsec_test";
    const signature = razorpayWebhookSignature('{"event":"payment.captured"}', secret);
    expect(
      verifyRazorpayWebhookSignature({
        rawBody: '{"event":"payment.failed"}',
        signature,
        webhookSecret: secret,
      })
    ).toBe(false);
  });
});

describe("razorpayEventId", () => {
  it("prefers the gateway event header", () => {
    expect(
      razorpayEventId({
        headerEventId: "evt_123",
        event: "payment.captured",
        paymentId: "pay_1",
        createdAt: 1,
      })
    ).toBe("evt_123");
  });

  it("falls back to a stable composite when the header is missing", () => {
    expect(
      razorpayEventId({
        headerEventId: null,
        event: "payment.captured",
        paymentId: "pay_1",
        createdAt: 99,
      })
    ).toBe("payment.captured:pay_1:99");
  });
});
