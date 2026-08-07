import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { deliveryChannels } from "@/lib/auth/delivery";
import { uploadsConfigured } from "@/lib/uploads/store";
import { getSetting } from "@/lib/repositories/settings";

export const dynamic = "force-dynamic";

/**
 * Liveness plus a real database round-trip. Used by the container healthcheck
 * and by uptime monitoring, so it must stay cheap and must never be cached.
 *
 * It also reports the two configuration facts that silently break the product
 * without breaking the site: whether a sign-in code can actually be delivered,
 * and whether the contact details are real. Both were wrong in production for
 * weeks precisely because nothing surfaced them.
 */
export async function GET() {
  const started = Date.now();
  let database: "connected" | "unreachable" = "unreachable";

  try {
    const { db } = await import("@/lib/db");
    await db.execute(sql`select 1`);
    database = "connected";
  } catch (err) {
    console.error("health: database check failed", err);
  }

  const otpDelivery = await deliveryChannels();
  const ok = database === "connected";

  const [whatsapp, email, razorpayKeyId, stripeKey, blobToken] = await Promise.all([
    getSetting("contact.whatsapp_number"),
    getSetting("contact.email"),
    getSetting("razorpay.key_id"),
    Promise.resolve(process.env.STRIPE_SECRET_KEY?.trim() || null),
    getSetting("blob.read_write_token"),
  ]);

  const paymentProvider = razorpayKeyId ? "razorpay" : stripeKey ? "stripe" : null;

  const uploadsReady = await uploadsConfigured();
  const uploads = uploadsReady ? (blobToken ? "vercel_blob" : "local") : "none";

  const PLACEHOLDER_WHATSAPP = "6281200000000";
  const PLACEHOLDER_EMAIL = "hello@only2bali.com";
  const waOk =
    Boolean(whatsapp) &&
    whatsapp!.replace(/\D/g, "").length >= 8 &&
    whatsapp!.replace(/\D/g, "") !== PLACEHOLDER_WHATSAPP;
  const emailOk =
    Boolean(email) &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email!) &&
    email!.toLowerCase() !== PLACEHOLDER_EMAIL;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      database,
      otpDelivery: otpDelivery.length ? otpDelivery : ["none"],
      contact: { whatsapp: waOk, email: emailOk },
      payments: { provider: paymentProvider, configured: paymentProvider !== null },
      uploads,
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - started,
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
