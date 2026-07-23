import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { deliveryChannels } from "@/lib/auth/delivery";
import { CFG } from "@/lib/config";

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

  const otpDelivery = deliveryChannels();
  const ok = database === "connected";

  // No gateway is wired up yet — the schema (`payment`, `payment_event`) is
  // ready and the booking flow already produces a server-computed amount for
  // one to attach to, but nothing here should claim payments work until a
  // provider key is actually set. Same pattern as otpDelivery: report the
  // fact plainly rather than let a booking silently have nowhere to pay.
  const paymentProvider = process.env.RAZORPAY_KEY_ID
    ? "razorpay"
    : process.env.STRIPE_SECRET_KEY
      ? "stripe"
      : null;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      database,
      // Not part of the pass/fail verdict: the site serves its catalogue
      // perfectly well without either. They are here to be monitored.
      otpDelivery: otpDelivery.length ? otpDelivery : ["none"],
      contact: { whatsapp: Boolean(CFG.whatsapp), email: Boolean(CFG.email) },
      payments: { provider: paymentProvider, configured: paymentProvider !== null },
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - started,
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
