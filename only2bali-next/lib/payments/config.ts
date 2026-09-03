export const RAZORPAY_WEBHOOK_SECRET_PLACEHOLDER =
  "replace-with-razorpay-dashboard-webhook-secret";

export type RazorpayMode = "live" | "test" | "unknown";
export type StripeMode = "live" | "test" | "unknown";

export type WebhookBlocker = "missing" | "placeholder" | "url" | "too_short" | "malformed" | null;

export type RazorpayConfigStatus = {
  mode: RazorpayMode;
  keyId: string | null;
  keySecret: string | null;
  webhookSecret: string | null;
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
  webhookBlocker: WebhookBlocker;
  acceptingPayments: boolean;
  unavailableReason: string | null;
};

export type StripeConfigStatus = {
  mode: StripeMode;
  secretKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
  webhookBlocker: WebhookBlocker;
  acceptingPayments: boolean;
  unavailableReason: string | null;
};

export type GatewayChoice = {
  id: "stripe" | "razorpay";
  label: string;
  available: boolean;
  reason: string | null;
  publishableKey?: string | null;
};

type PaymentEnv = {
  [key: string]: string | undefined;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function webhookBlocker(value: string | null): WebhookBlocker {
  if (!value) return "missing";
  if (value === RAZORPAY_WEBHOOK_SECRET_PLACEHOLDER) return "placeholder";
  if (/^https?:\/\//i.test(value)) return "url";
  if (value.length < 32) return "too_short";
  return null;
}

function webhookSecretIsUsable(value: string | null): value is string {
  return webhookBlocker(value) === null;
}

function razorpayUnavailableReason(status: Omit<RazorpayConfigStatus, "unavailableReason">): string | null {
  if (status.acceptingPayments) return null;
  if (status.mode === "unknown" || !status.keyId || !status.keySecret) {
    return "Razorpay API keys are not configured.";
  }
  switch (status.webhookBlocker) {
    case "missing":
      return "Razorpay webhook secret is missing.";
    case "placeholder":
      return "Razorpay webhook secret is still the placeholder.";
    case "url":
      return "Razorpay webhook secret looks like a URL, not a secret.";
    case "too_short":
      return "Razorpay webhook secret is too short.";
    default:
      return "Razorpay checkout is paused.";
  }
}

/**
 * One fail-closed view of Razorpay readiness. A live key pair by itself is not
 * enough to accept money: the webhook secret must also be ready so an
 * interrupted browser cannot leave a paid booking unconfirmed.
 */
export function razorpayConfig(env: PaymentEnv = process.env): RazorpayConfigStatus {
  const keyId = clean(env.RAZORPAY_KEY_ID);
  const keySecret = clean(env.RAZORPAY_KEY_SECRET);
  const webhookSecret = clean(env.RAZORPAY_WEBHOOK_SECRET);
  const mode: RazorpayMode = keyId?.startsWith("rzp_live_")
    ? "live"
    : keyId?.startsWith("rzp_test_")
      ? "test"
      : "unknown";
  const checkoutConfigured = mode !== "unknown" && Boolean(keySecret);
  const webhookConfigured = webhookSecretIsUsable(webhookSecret);
  const status = {
    mode,
    keyId,
    keySecret,
    webhookSecret,
    checkoutConfigured,
    webhookConfigured,
    webhookBlocker: webhookBlocker(webhookSecret),
    acceptingPayments: checkoutConfigured && webhookConfigured,
  };
  return { ...status, unavailableReason: razorpayUnavailableReason(status) };
}

function stripeWebhookBlocker(value: string | null): WebhookBlocker {
  if (!value) return "missing";
  if (value === RAZORPAY_WEBHOOK_SECRET_PLACEHOLDER) return "placeholder";
  if (/^https?:\/\//i.test(value)) return "url";
  if (!value.startsWith("whsec_")) return "malformed";
  if (value.length < 20) return "too_short";
  return null;
}

function stripeUnavailableReason(status: Omit<StripeConfigStatus, "unavailableReason">): string | null {
  if (status.acceptingPayments) return null;
  if (status.mode === "unknown" || !status.secretKey) {
    return "Stripe secret key is not configured.";
  }
  if (!status.publishableKey) {
    return "Stripe publishable key is not configured.";
  }
  switch (status.webhookBlocker) {
    case "missing":
      return "Stripe webhook secret is missing.";
    case "placeholder":
      return "Stripe webhook secret is still the placeholder.";
    case "url":
      return "Stripe webhook secret looks like a URL, not a secret.";
    case "malformed":
      return "Stripe webhook secret must start with whsec_.";
    case "too_short":
      return "Stripe webhook secret is too short.";
    default:
      return "Stripe checkout is paused.";
  }
}

/**
 * Stripe is ready only when the secret, publishable key, and webhook signing
 * secret are all present. Checkout Session create stays server-side.
 */
export function stripeConfig(env: PaymentEnv = process.env): StripeConfigStatus {
  const secretKey = clean(env.STRIPE_SECRET_KEY);
  const publishableKey = clean(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const webhookSecret = clean(env.STRIPE_WEBHOOK_SECRET);
  const mode: StripeMode = secretKey?.startsWith("sk_live_")
    ? "live"
    : secretKey?.startsWith("sk_test_")
      ? "test"
      : "unknown";
  const publishableOk = Boolean(
    publishableKey && (publishableKey.startsWith("pk_live_") || publishableKey.startsWith("pk_test_"))
  );
  const checkoutConfigured = mode !== "unknown" && publishableOk;
  const webhookBlocker = stripeWebhookBlocker(webhookSecret);
  const webhookConfigured = webhookBlocker === null;
  const status = {
    mode,
    secretKey,
    publishableKey,
    webhookSecret,
    checkoutConfigured,
    webhookConfigured,
    webhookBlocker,
    acceptingPayments: checkoutConfigured && webhookConfigured,
  };
  return { ...status, unavailableReason: stripeUnavailableReason(status) };
}

/** Traveller UI always lists both; `available` is false when keys are missing. */
export function paymentGatewayOptions(env: PaymentEnv = process.env): {
  stripe: GatewayChoice;
  razorpay: GatewayChoice;
} {
  const stripe = stripeConfig(env);
  const razorpay = razorpayConfig(env);
  return {
    stripe: {
      id: "stripe",
      label: "Stripe",
      available: stripe.acceptingPayments,
      reason: stripe.unavailableReason,
      publishableKey: stripe.publishableKey,
    },
    razorpay: {
      id: "razorpay",
      label: "Razorpay",
      available: razorpay.acceptingPayments,
      reason: razorpay.unavailableReason,
    },
  };
}
