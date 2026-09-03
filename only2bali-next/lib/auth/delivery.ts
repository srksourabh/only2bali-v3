/**
 * OTP delivery.
 *
 * No provider is wired yet — the SpringEdge key is being rotated and no email
 * sender has been chosen. Rather than pretend, this logs the code in
 * development and refuses loudly in production, so nobody ships a login screen
 * that silently sends nothing.
 */

import { emailConfigured, sendEmail as sendEmailVia } from "./email-transport";

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
export function deliveryChannels(): Array<"email" | "sms" | "console"> {
  if (process.env.NODE_ENV !== "production") return ["console"];
  const channels: Array<"email" | "sms"> = [];
  // Any configured mail path counts, not one named vendor.
  if (emailConfigured()) channels.push("email");
  if (process.env.SPRINGEDGE_API_KEY) channels.push("sms");
  return channels;
}

export function canDeliver(channel: "email" | "sms"): boolean {
  const available = deliveryChannels();
  return available.includes("console") || available.includes(channel);
}

/** Login UI should not offer OTP when no channel can reach a person. */
export function otpOffered(): boolean {
  return deliveryChannels().length > 0;
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

  if (channel === "sms" && process.env.SPRINGEDGE_API_KEY) {
    return sendSms(identifier.mobile!, code);
  }

  if (channel === "email" && emailConfigured()) {
    return sendEmail(identifier.email!, code);
  }

  throw new DeliveryNotConfiguredError(channel);
}

async function sendSms(mobileNumber: string, code: string): Promise<DeliveryResult> {
  const url = new URL("https://instantalerts.co/api/web/send");
  url.searchParams.set("apikey", process.env.SPRINGEDGE_API_KEY!);
  url.searchParams.set("sender", process.env.SPRINGEDGE_SENDER_ID ?? "STRPAT");
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

async function sendEmail(address: string, code: string): Promise<DeliveryResult> {
  const { delivered } = await sendEmailVia(
    address,
    `${code} is your Only2Bali code`,
    `Your Only2Bali sign-in code is ${code}.

It expires in 10 minutes and can be used once.
If you did not request it, you can ignore this email.`
  );
  return { delivered, channel: "email" };
}

