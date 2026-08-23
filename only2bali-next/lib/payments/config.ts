export const RAZORPAY_WEBHOOK_SECRET_PLACEHOLDER =
  "replace-with-razorpay-dashboard-webhook-secret";

export type RazorpayMode = "live" | "test" | "unknown";

export type RazorpayConfigStatus = {
  mode: RazorpayMode;
  keyId: string | null;
  keySecret: string | null;
  webhookSecret: string | null;
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
  acceptingPayments: boolean;
};

type RazorpayEnv = {
  [key: string]: string | undefined;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function webhookSecretIsUsable(value: string | null): value is string {
  if (!value || value === RAZORPAY_WEBHOOK_SECRET_PLACEHOLDER) return false;
  if (/^https?:\/\//i.test(value)) return false;
  return value.length >= 32;
}

/**
 * One fail-closed view of Razorpay readiness. A live key pair by itself is not
 * enough to accept money: the webhook secret must also be ready so an
 * interrupted browser cannot leave a paid booking unconfirmed.
 */
export function razorpayConfig(env: RazorpayEnv = process.env): RazorpayConfigStatus {
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

  return {
    mode,
    keyId,
    keySecret,
    webhookSecret,
    checkoutConfigured,
    webhookConfigured,
    acceptingPayments: checkoutConfigured && webhookConfigured,
  };
}
