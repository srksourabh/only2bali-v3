/**
 * Sending an email, without picking a vendor for the operator.
 *
 * The sign-in code path used to speak Resend and nothing else, so "let people
 * log in" meant "open an account with one specific company". SMTP is the open
 * standard every mail provider already speaks, and every one of these has a
 * free tier that covers a launch:
 *
 *   Brevo         300/day forever      smtp-relay.brevo.com:587
 *   Resend        3,000/month          smtp.resend.com:465   (or RESEND_API_KEY)
 *   Zoho Mail     free custom domain   smtp.zoho.in:465
 *   Gmail         ~500/day             smtp.gmail.com:465    (app password)
 *   Mailtrap      1,000/month          live.smtp.mailtrap.io:587
 *
 * Resend stays supported through its own API because it is already configured
 * and needs no extra dependency. SMTP is the fallback, and either is enough.
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type EmailEnv = {
  RESEND_API_KEY?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  EMAIL_FROM?: string;
};

export const DEFAULT_FROM = "Only2Bali <hello@only2bali.com>";

export type EmailBackend = "resend" | "smtp" | "none";

/**
 * Which path a message would take. Resend first only because it needs no
 * connection setup; if both are configured either would work.
 */
export function emailBackend(env: EmailEnv = process.env as EmailEnv): EmailBackend {
  if (env.RESEND_API_KEY?.trim()) return "resend";
  if (env.SMTP_HOST?.trim() && env.SMTP_USER?.trim() && env.SMTP_PASSWORD?.trim()) return "smtp";
  return "none";
}

export function emailConfigured(env: EmailEnv = process.env as EmailEnv): boolean {
  return emailBackend(env) !== "none";
}

/**
 * Port 465 is implicit TLS; 587 and 25 upgrade with STARTTLS. Getting this
 * wrong is the single most common SMTP misconfiguration and it fails with a
 * timeout rather than a useful message, so derive it rather than asking.
 */
export function smtpSecureForPort(port: number): boolean {
  return port === 465;
}

/**
 * One transporter per process, for the same reason the database keeps one
 * pool: a new SMTP connection per message means a TCP and TLS handshake per
 * message, against a server that is usually further away than the database.
 */
const globalForMail = globalThis as unknown as { __o2bMail?: Transporter };

function transporter(env: EmailEnv): Transporter {
  if (globalForMail.__o2bMail) return globalForMail.__o2bMail;

  const port = Number(env.SMTP_PORT ?? 587);
  const created = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: smtpSecureForPort(port),
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });

  globalForMail.__o2bMail = created;
  return created;
}

export type SendResult = { delivered: boolean; backend: EmailBackend };

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  env: EmailEnv = process.env as EmailEnv
): Promise<SendResult> {
  const backend = emailBackend(env);
  const from = env.EMAIL_FROM?.trim() || DEFAULT_FROM;

  if (backend === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // Never surface provider detail to the caller; it leaks account existence.
      console.error("[auth] resend delivery failed", res.status, await res.text().catch(() => ""));
      return { delivered: false, backend };
    }
    return { delivered: true, backend };
  }

  if (backend === "smtp") {
    try {
      await transporter(env).sendMail({ from, to, subject, text });
      return { delivered: true, backend };
    } catch (err) {
      console.error("[auth] smtp delivery failed", err instanceof Error ? err.message : err);
      return { delivered: false, backend };
    }
  }

  return { delivered: false, backend: "none" };
}
