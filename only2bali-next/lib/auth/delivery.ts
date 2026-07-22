/**
 * OTP delivery.
 *
 * No provider is wired yet — the SpringEdge key is being rotated and no email
 * sender has been chosen. Rather than pretend, this logs the code in
 * development and refuses loudly in production, so nobody ships a login screen
 * that silently sends nothing.
 */

export interface DeliveryResult {
  delivered: boolean;
  channel: "email" | "sms" | "console";
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

  if (channel === "email" && process.env.RESEND_API_KEY) {
    return sendEmail(identifier.email!, code);
  }

  throw new Error(
    `No ${channel} provider configured. Set ${
      channel === "sms" ? "SPRINGEDGE_API_KEY" : "RESEND_API_KEY"
    } before enabling login in production.`
  );
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
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Only2Bali <hello@only2bali.com>",
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
