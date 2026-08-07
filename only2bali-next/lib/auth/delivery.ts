/**
 * OTP delivery.
 *
 * Providers can be configured via Vercel env or Admin → Integration settings
 * (encrypted in Postgres). Database values win; env is the fallback.
 */

import { getSetting } from "@/lib/repositories/settings";

export interface DeliveryResult {
  delivered: boolean;
  channel: "email" | "sms" | "console";
}

export class DeliveryNotConfiguredError extends Error {
  constructor(public channel: "email" | "sms") {
    super(`No ${channel} provider configured.`);
    this.name = "DeliveryNotConfiguredError";
  }
}

/**
 * Which channels can actually reach a person right now.
 *
 * Read by `/api/health` and by the login endpoint, so "login is broken" is
 * visible from a monitoring check rather than discovered by a visitor who has
 * already typed their email and waited for a code that was never sent.
 */
export async function deliveryChannels(): Promise<Array<"email" | "sms" | "console">> {
  if (process.env.NODE_ENV !== "production") return ["console"];
  const channels: Array<"email" | "sms"> = [];
  if (await getSetting("resend.api_key")) channels.push("email");
  if (await getSetting("springedge.api_key")) channels.push("sms");
  return channels;
}

export async function canDeliver(channel: "email" | "sms"): Promise<boolean> {
  const available = await deliveryChannels();
  return available.includes("console") || available.includes(channel);
}

export async function deliverOtp(
  identifier: { email?: string; mobile?: string },
  code: string
): Promise<DeliveryResult> {
  const channel = identifier.email ? "email" : "sms";

  if (process.env.NODE_ENV !== "production") {
    // Never log a live code in production. This branch cannot be reached there.
    console.info(
      `[auth] OTP for ${identifier.email ?? identifier.mobile}: ${code} (dev only, expires in 10 minutes)`
    );
    return { delivered: true, channel: "console" };
  }

  const smsKey = await getSetting("springedge.api_key");
  if (channel === "sms" && smsKey) {
    return sendSms(identifier.mobile!, code, smsKey);
  }

  const emailKey = await getSetting("resend.api_key");
  if (channel === "email" && emailKey) {
    return sendEmail(identifier.email!, code, emailKey);
  }

  throw new DeliveryNotConfiguredError(channel);
}

async function sendSms(
  mobileNumber: string,
  code: string,
  apiKey: string
): Promise<DeliveryResult> {
  const sender = (await getSetting("springedge.sender_id")) ?? "STRPAT";
  const url = new URL("https://instantalerts.co/api/web/send");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("sender", sender);
  url.searchParams.set("to", mobileNumber);
  url.searchParams.set(
    "message",
    `Dear User, Your OTP is ${code} from Only2Bali. Valid for 10 minutes. Best regards, Straits Partners`
  );

  const res = await fetch(url, { method: "POST", signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    // Do not surface provider detail to the caller; it leaks account existence.
    console.error("[auth] SMS delivery failed", res.status, await res.text().catch(() => ""));
    return { delivered: false, channel: "sms" };
  }
  return { delivered: true, channel: "sms" };
}

async function sendEmail(
  address: string,
  code: string,
  apiKey: string
): Promise<DeliveryResult> {
  const from =
    (await getSetting("email.from")) ?? "Only2Bali <hello@only2bali.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: address,
      subject: `${code} is your Only2Bali code`,
      text: `Your Only2Bali sign-in code is ${code}.\n\nIt expires in 10 minutes and can be used once.\nIf you did not request it, you can ignore this email.`,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    console.error("[auth] email delivery failed", res.status, await res.text().catch(() => ""));
    return { delivered: false, channel: "email" };
  }
  return { delivered: true, channel: "email" };
}
