import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { deliveryChannels } from "@/lib/auth/delivery";
import { CFG } from "@/lib/config";
import { emptySchemaStatus, readSchemaStatus } from "@/lib/db/schema-status";
import { uploadBackend } from "@/lib/uploads/store";
import { readPlacement } from "@/lib/db/placement";
import { razorpayConfig, stripeConfig } from "@/lib/payments/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  let schema = emptySchemaStatus();

  try {
    const { db } = await import("@/lib/db");
    await db.execute(sql`select 1`);
    database = "connected";
    try {
      schema = await readSchemaStatus(db);
      if (!schema.current) {
        const { catchUpProductionSchema } = await import("@/lib/db/apply-pending-migrations");
        schema = await catchUpProductionSchema();
      }
    } catch (err) {
      console.error("health: schema probe failed", err);
    }
  } catch (err) {
    console.error("health: database check failed", err);
  }

  const otpDelivery = deliveryChannels();
  const ok = database === "connected";

  const razorpay = razorpayConfig();
  const stripe = stripeConfig();
  const paymentProvider =
    razorpay.checkoutConfigured && stripe.checkoutConfigured
      ? "both"
      : razorpay.checkoutConfigured
        ? "razorpay"
        : stripe.checkoutConfigured
          ? "stripe"
          : null;

  const uploads = {
    media: uploadBackend("media"),
    documents: uploadBackend("documents"),
  };

  const { clerkConfigured } = await import("@/lib/auth/clerk");

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      database,
      // Not part of the pass/fail verdict: the site serves its catalogue
      // perfectly well without either. They are here to be monitored.
      otpDelivery: otpDelivery.length ? otpDelivery : ["none"],
      schema,
      contact: { whatsapp: Boolean(CFG.whatsapp), email: Boolean(CFG.email) },
      payments: {
        provider: paymentProvider,
        mode: razorpay.mode,
        checkoutConfigured: razorpay.checkoutConfigured,
        webhookConfigured: razorpay.webhookConfigured,
        webhookBlocker: razorpay.webhookBlocker,
        acceptingPayments: razorpay.acceptingPayments || stripe.acceptingPayments,
        razorpay: {
          mode: razorpay.mode,
          checkoutConfigured: razorpay.checkoutConfigured,
          webhookConfigured: razorpay.webhookConfigured,
          webhookBlocker: razorpay.webhookBlocker,
          acceptingPayments: razorpay.acceptingPayments,
        },
        stripe: {
          mode: stripe.mode,
          checkoutConfigured: stripe.checkoutConfigured,
          webhookConfigured: stripe.webhookConfigured,
          webhookBlocker: stripe.webhookBlocker,
          acceptingPayments: stripe.acceptingPayments,
        },
      },
      uploads,
      clerk: clerkConfigured(),
      uptimeSeconds: Math.round(process.uptime()),
      // Where the database is versus where this function runs. A mismatch here
      // is worth several hundred milliseconds on every query and is invisible
      // from both the code and the Vercel dashboard.
      placement: readPlacement(),
      latencyMs: Date.now() - started,
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
