import { describe, expect, it } from "vitest";
import { stripeEventId, stripeTestWebhookHeader, verifyStripeWebhookSignature } from "./stripe";

const secret = "whsec_test_only2bali_signature_secret";

describe("verifyStripeWebhookSignature", () => {
  it("accepts a header produced by the official Stripe test helper", () => {
    const rawBody = JSON.stringify({
      id: "evt_test_1",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_1" } },
    });
    const signature = stripeTestWebhookHeader(rawBody, secret);
    expect(verifyStripeWebhookSignature({ rawBody, signature, webhookSecret: secret })).toBe(true);
  });

  it("rejects a tampered body without calling Stripe", () => {
    const rawBody = JSON.stringify({ id: "evt_test_2", object: "event", type: "checkout.session.completed" });
    const signature = stripeTestWebhookHeader(rawBody, secret);
    expect(
      verifyStripeWebhookSignature({
        rawBody: rawBody.replace("evt_test_2", "evt_forged"),
        signature,
        webhookSecret: secret,
      })
    ).toBe(false);
  });
});

describe("stripeEventId", () => {
  it("prefers Stripe's event id", () => {
    expect(stripeEventId({ id: "evt_abc", type: "checkout.session.completed", created: 1 })).toBe("evt_abc");
    expect(stripeEventId({ type: "checkout.session.completed", created: 9 })).toBe(
      "checkout.session.completed:9"
    );
  });
});
