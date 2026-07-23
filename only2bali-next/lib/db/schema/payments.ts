/**
 * Money in, and the record of who said so.
 *
 * No gateway is integrated yet and none is named here beyond an enum value. What
 * this file provides is the shape a gateway plugs into, so that choosing one is
 * a commercial decision rather than a rewrite.
 *
 * Three rules the tables enforce rather than document:
 *
 *   1. `idempotency_key` is unique. A retried checkout — double-clicked button,
 *      flaky mobile network, a client that retries on timeout — cannot create a
 *      second charge for the same intent.
 *   2. `(provider, provider_event_id)` is unique on the event ledger. Every
 *      gateway redelivers webhooks, several of them more than once, and a
 *      redelivered "payment captured" must not confirm a booking twice.
 *   3. Amounts are integer minor units and must be positive, and a refund can
 *      never exceed what was captured. Both are check constraints.
 *
 * What is deliberately absent: card numbers, UPI handles, bank accounts. Only
 * the gateway's own opaque identifiers are stored, which is what keeps this
 * system outside PCI scope.
 */
import {
  pgTable, uuid, text, bigint, integer, boolean, timestamp, index, jsonb, uniqueIndex, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { booking } from "./marketplace";
import { account } from "./identity";
import { paymentProvider, paymentStatus, paymentPurpose } from "./enums";

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * restrict, not cascade. A booking with money against it must not be
     * deletable — cancel it, refund it, but the payment record outlives it.
     */
    bookingId: uuid("booking_id").notNull().references(() => booking.id, { onDelete: "restrict" }),

    provider: paymentProvider("provider").notNull(),
    /** The gateway's order / payment-intent id, created before the traveller pays. */
    providerOrderId: text("provider_order_id"),
    /** Set once the gateway reports an actual payment against that order. */
    providerPaymentId: text("provider_payment_id"),
    /** Gateway-side refund handle, when one exists. */
    providerRefundId: text("provider_refund_id"),

    /**
     * Always recomputed server-side from the booking. The client never sends an
     * amount, and this column is never derived from anything the browser posted.
     */
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("INR"),
    refundedAmount: bigint("refunded_amount", { mode: "number" }).notNull().default(0),

    purpose: paymentPurpose("purpose").notNull().default("full"),
    status: paymentStatus("status").notNull().default("created"),

    /**
     * Supplied by the checkout caller, or generated server-side when absent.
     * Unique, which is the whole point: this is what makes "create a payment"
     * safe to retry.
     */
    idempotencyKey: text("idempotency_key").notNull().unique(),
    attempt: integer("attempt").notNull().default(1),

    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),

    authorizedAt: timestamp("authorized_at", { withTimezone: true }),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),

    /** Whoever triggered it: the traveller, or an admin taking a bank transfer. */
    initiatedBy: uuid("initiated_by").references(() => account.id, { onDelete: "set null" }),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payment_booking_status_idx").on(t.bookingId, t.status),
    index("payment_status_created_idx").on(t.status, t.createdAt),
    // Two rows claiming the same gateway order would mean two bookings believe
    // they own one payment. Partial, because the id is null until the order is
    // actually opened at the gateway.
    uniqueIndex("payment_provider_order_uq")
      .on(t.provider, t.providerOrderId)
      .where(sql`${t.providerOrderId} IS NOT NULL`),
    uniqueIndex("payment_provider_payment_uq")
      .on(t.provider, t.providerPaymentId)
      .where(sql`${t.providerPaymentId} IS NOT NULL`),
    check("payment_amount_positive", sql`${t.amount} > 0`),
    check("payment_refund_within_amount",
      sql`${t.refundedAmount} >= 0 AND ${t.refundedAmount} <= ${t.amount}`),
  ]
);

/**
 * Every webhook the gateway sends, stored before it is acted on.
 *
 * This is the audit trail for money, so it is append-only and keeps the raw
 * payload verbatim — when a traveller says they paid and the booking says
 * otherwise, the answer is in here rather than in someone's memory.
 *
 * `signature_verified` is a column and not an assumption. An unverified webhook
 * is still recorded, because an attacker probing the endpoint is exactly the
 * thing you want a record of, but it must never move a booking.
 */
export const paymentEvent = pgTable(
  "payment_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: paymentProvider("provider").notNull(),
    /** The gateway's own event id. Unique per provider — this is the replay guard. */
    providerEventId: text("provider_event_id").notNull(),
    paymentId: uuid("payment_id").references(() => payment.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    signatureVerified: boolean("signature_verified").notNull().default(false),
    payload: jsonb("payload").notNull(),
    /** Null until the handler has finished with it, so a crash mid-handler is visible. */
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processingError: text("processing_error"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payment_event_provider_event_uq").on(t.provider, t.providerEventId),
    index("payment_event_unprocessed_idx").on(t.processedAt, t.receivedAt),
  ]
);
