/**
 * Admin-managed integration settings.
 *
 * Secrets are encrypted at rest. Env vars remain the fallback when a key is
 * unset in the database — so Vercel-injected values keep working until an
 * admin pastes a replacement here.
 *
 * Zoho CRM was deleted from the product; those keys are stored only for a
 * future connector and do not enable any live call path.
 */

export type SettingKind = "secret" | "plain";

export type SettingDef = {
  key: string;
  label: string;
  kind: SettingKind;
  group: "otp" | "payments" | "ai" | "uploads" | "contact" | "crm";
  envFallback?: string;
  help?: string;
  /** When true, the value is never returned even masked beyond configured:true. */
  secret: boolean;
};

export const SETTING_DEFS: SettingDef[] = [
  {
    key: "resend.api_key",
    label: "Resend API key",
    kind: "secret",
    group: "otp",
    envFallback: "RESEND_API_KEY",
    secret: true,
    help: "Sends login OTP emails.",
  },
  {
    key: "email.from",
    label: "Email from address",
    kind: "plain",
    group: "otp",
    envFallback: "EMAIL_FROM",
    secret: false,
    help: 'e.g. Only2Bali <hello@yourdomain.com>',
  },
  {
    key: "springedge.api_key",
    label: "SpringEdge SMS API key",
    kind: "secret",
    group: "otp",
    envFallback: "SPRINGEDGE_API_KEY",
    secret: true,
  },
  {
    key: "springedge.sender_id",
    label: "SpringEdge sender ID",
    kind: "plain",
    group: "otp",
    envFallback: "SPRINGEDGE_SENDER_ID",
    secret: false,
  },
  {
    key: "gemini.api_key",
    label: "Gemini API key (LLM planner)",
    kind: "secret",
    group: "ai",
    envFallback: "GEMINI_API_KEY",
    secret: true,
  },
  {
    key: "razorpay.key_id",
    label: "Razorpay key id",
    kind: "plain",
    group: "payments",
    envFallback: "RAZORPAY_KEY_ID",
    secret: false,
  },
  {
    key: "razorpay.key_secret",
    label: "Razorpay key secret",
    kind: "secret",
    group: "payments",
    envFallback: "RAZORPAY_KEY_SECRET",
    secret: true,
  },
  {
    key: "razorpay.webhook_secret",
    label: "Razorpay webhook secret",
    kind: "secret",
    group: "payments",
    envFallback: "RAZORPAY_WEBHOOK_SECRET",
    secret: true,
  },
  {
    key: "blob.read_write_token",
    label: "Vercel Blob read/write token",
    kind: "secret",
    group: "uploads",
    envFallback: "BLOB_READ_WRITE_TOKEN",
    secret: true,
  },
  {
    key: "contact.whatsapp_number",
    label: "WhatsApp number",
    kind: "plain",
    group: "contact",
    envFallback: "NEXT_PUBLIC_WHATSAPP_NUMBER",
    secret: false,
    help: "Digits only, country code included, no +.",
  },
  {
    key: "contact.email",
    label: "Public contact email",
    kind: "plain",
    group: "contact",
    envFallback: "NEXT_PUBLIC_CONTACT_EMAIL",
    secret: false,
  },
  {
    key: "zoho.client_id",
    label: "Zoho client id",
    kind: "secret",
    group: "crm",
    secret: true,
    help: "Not wired — Zoho CRM was removed. Stored encrypted for a future connector only.",
  },
  {
    key: "zoho.client_secret",
    label: "Zoho client secret",
    kind: "secret",
    group: "crm",
    secret: true,
    help: "Not wired — Zoho CRM was removed.",
  },
  {
    key: "zoho.refresh_token",
    label: "Zoho refresh token",
    kind: "secret",
    group: "crm",
    secret: true,
    help: "Not wired — Zoho CRM was removed. Prefer rotating at Zoho; tokens in git history are compromised.",
  },
];

export const SETTING_KEYS = SETTING_DEFS.map((d) => d.key);

export const SETTING_BY_KEY = Object.fromEntries(SETTING_DEFS.map((d) => [d.key, d])) as Record<
  string,
  SettingDef
>;

export const GROUP_LABELS: Record<SettingDef["group"], string> = {
  otp: "Login OTP delivery",
  payments: "Payments (Razorpay)",
  ai: "AI / LLM",
  uploads: "File uploads",
  contact: "Public contact",
  crm: "CRM (stored only)",
};
