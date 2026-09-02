/**
 * Vendor payout queue and escrow policy.
 *
 * Live cross-border rails need a PA-CB / AD partner (owner gate). This module
 * implements the platform ledger path: hold on capture → admin release/approve →
 * mark paid (manual transfer) with a purpose code on the payment_event audit row.
 * Refunds prefer platform funds first: traveller is refunded even when vendor
 * payout has not cleared; paid disbursements are clawed as a failed/held note.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resilientFetch } from "@/lib/external-fetch";
import { razorpayConfig } from "@/lib/payments/config";
import {
  booking,
  payment,
  paymentDisbursement,
  paymentEvent,
  vendor,
  vendorPayoutAccount,
} from "@/lib/db/schema";

/** RBI-style purpose code for tourism / travel services. */
export const DISBURSEMENT_PURPOSE_CODE = "S1301";

export const ESCROW_HOLD_REASON = "Escrow until trip start / voucher issue";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function createHeldDisbursementForBooking(
  tx: Tx,
  args: {
    bookingId: string;
    paymentId: string;
    vendorId: string;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    travellerCurrency: string;
  }
) {
  const [existing] = await tx
    .select({ id: paymentDisbursement.id })
    .from(paymentDisbursement)
    .where(eq(paymentDisbursement.bookingId, args.bookingId))
    .limit(1);
  if (existing) return existing;

  const [payout] = await tx
    .select({ id: vendorPayoutAccount.id })
    .from(vendorPayoutAccount)
    .where(eq(vendorPayoutAccount.vendorId, args.vendorId))
    .limit(1);

  const [row] = await tx
    .insert(paymentDisbursement)
    .values({
      bookingId: args.bookingId,
      paymentId: args.paymentId,
      vendorId: args.vendorId,
      payoutAccountId: payout?.id ?? null,
      provider: "manual_bank_transfer",
      grossAmount: args.grossAmount,
      commissionAmount: args.commissionAmount,
      netAmount: args.netAmount,
      travellerCurrency: args.travellerCurrency,
      vendorCurrency: "IDR",
      status: "held",
      holdReason: ESCROW_HOLD_REASON,
    })
    .returning({ id: paymentDisbursement.id });

  await tx.insert(paymentEvent).values({
    provider: "manual_bank_transfer",
    providerEventId: `disbursement_held_${args.bookingId}`,
    paymentId: args.paymentId,
    type: "disbursement.held",
    signatureVerified: true,
    payload: {
      purposeCode: DISBURSEMENT_PURPOSE_CODE,
      bookingId: args.bookingId,
      vendorId: args.vendorId,
      netAmount: args.netAmount,
      holdReason: ESCROW_HOLD_REASON,
    },
    processedAt: new Date(),
  });

  return row;
}

export async function listDisbursements(limit = 80) {
  return db
    .select({
      id: paymentDisbursement.id,
      bookingId: paymentDisbursement.bookingId,
      paymentId: paymentDisbursement.paymentId,
      vendorId: paymentDisbursement.vendorId,
      businessName: vendor.businessName,
      grossAmount: paymentDisbursement.grossAmount,
      commissionAmount: paymentDisbursement.commissionAmount,
      netAmount: paymentDisbursement.netAmount,
      travellerCurrency: paymentDisbursement.travellerCurrency,
      vendorCurrency: paymentDisbursement.vendorCurrency,
      status: paymentDisbursement.status,
      holdReason: paymentDisbursement.holdReason,
      approvedAt: paymentDisbursement.approvedAt,
      paidAt: paymentDisbursement.paidAt,
      failureMessage: paymentDisbursement.failureMessage,
      createdAt: paymentDisbursement.createdAt,
      bookingReference: booking.reference,
    })
    .from(paymentDisbursement)
    .innerJoin(vendor, eq(paymentDisbursement.vendorId, vendor.id))
    .innerJoin(booking, eq(paymentDisbursement.bookingId, booking.id))
    .orderBy(desc(paymentDisbursement.createdAt))
    .limit(limit);
}

export async function adminPatchDisbursement(
  adminId: string,
  id: string,
  action: "release_hold" | "approve" | "mark_paid" | "fail",
  opts?: { failureMessage?: string }
) {
  const [row] = await db.select().from(paymentDisbursement).where(eq(paymentDisbursement.id, id)).limit(1);
  if (!row) return null;

  const now = new Date();

  if (action === "release_hold") {
    if (row.status !== "held") return { ok: false as const, reason: "not_held" };
    const [updated] = await db
      .update(paymentDisbursement)
      .set({ status: "pending", holdReason: null, updatedAt: now })
      .where(eq(paymentDisbursement.id, id))
      .returning();
    return { ok: true as const, disbursement: updated };
  }

  if (action === "approve") {
    if (row.status !== "pending" && row.status !== "held") return { ok: false as const, reason: "not_approvable" };
    const [updated] = await db
      .update(paymentDisbursement)
      .set({
        status: "approved",
        holdReason: null,
        approvedBy: adminId,
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(paymentDisbursement.id, id))
      .returning();
    await db.insert(paymentEvent).values({
      provider: row.provider,
      providerEventId: `disbursement_approved_${id}_${now.getTime()}`,
      paymentId: row.paymentId,
      type: "disbursement.approved",
      signatureVerified: true,
      payload: { purposeCode: DISBURSEMENT_PURPOSE_CODE, adminId, disbursementId: id },
      processedAt: now,
    });
    return { ok: true as const, disbursement: updated };
  }

  if (action === "mark_paid") {
    if (row.status !== "approved" && row.status !== "processing") {
      return { ok: false as const, reason: "not_payable" };
    }
    const payoutId = `manual_${id.slice(0, 8)}_${now.getTime()}`;
    const [updated] = await db
      .update(paymentDisbursement)
      .set({
        status: "paid",
        providerPayoutId: payoutId,
        paidAt: now,
        updatedAt: now,
        failureCode: null,
        failureMessage: null,
      })
      .where(eq(paymentDisbursement.id, id))
      .returning();
    await db.insert(paymentEvent).values({
      provider: row.provider,
      providerEventId: `disbursement_paid_${payoutId}`,
      paymentId: row.paymentId,
      type: "disbursement.paid",
      signatureVerified: true,
      payload: {
        purposeCode: DISBURSEMENT_PURPOSE_CODE,
        adminId,
        disbursementId: id,
        providerPayoutId: payoutId,
        note: "Manual / PA-CB partner transfer recorded. Live gateway not configured.",
      },
      processedAt: now,
    });
    return { ok: true as const, disbursement: updated };
  }

  // fail
  const [updated] = await db
    .update(paymentDisbursement)
    .set({
      status: "failed",
      failureCode: "admin_fail",
      failureMessage: opts?.failureMessage ?? "Marked failed by admin",
      updatedAt: now,
    })
    .where(eq(paymentDisbursement.id, id))
    .returning();
  return { ok: true as const, disbursement: updated };
}

/**
 * Refund-first-from-platform: mark payment + booking refunded; cancel unpaid
 * disbursements; if already paid, leave a clawback ledger event (partner must settle).
 */
async function createRazorpayRefund(paymentId: string, providerPaymentId: string, amount: number, alreadyRefunded: number) {
  const config = razorpayConfig();
  if (!config.keyId || !config.keySecret) throw new Error("Razorpay refund credentials are incomplete.");
  const idempotencyKey = `o2b-refund-${paymentId}-${alreadyRefunded}-${amount}`;
  const response = await resilientFetch("razorpay-refund", `https://api.razorpay.com/v1/payments/${encodeURIComponent(providerPaymentId)}/refund`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
      "content-type": "application/json",
      "X-Razorpay-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ amount, receipt: idempotencyKey.slice(0, 40), notes: { platform_payment_id: paymentId } }),
  });
  const body = await response.json().catch(() => null) as { id?: string; error?: { description?: string } } | null;
  if (!response.ok || !body?.id) throw new Error(body?.error?.description ?? "Razorpay did not accept the refund.");
  return body.id;
}

export async function refundBookingFromPlatform(adminId: string, paymentId: string, amount?: number) {
  const [candidate] = await db.select().from(payment).where(eq(payment.id, paymentId)).limit(1);
  if (!candidate) return { ok: false as const, reason: "payment_not_found" };
  if (candidate.status !== "captured" && candidate.status !== "partially_refunded") return { ok: false as const, reason: "not_refundable" };
  const requestedAmount = amount ?? candidate.amount - candidate.refundedAmount;
  if (requestedAmount <= 0 || candidate.refundedAmount + requestedAmount > candidate.amount) return { ok: false as const, reason: "invalid_amount" };
  if (candidate.provider !== "razorpay" || !candidate.providerPaymentId) return { ok: false as const, reason: "gateway_refund_unavailable" };
  const providerRefundId = await createRazorpayRefund(paymentId, candidate.providerPaymentId, requestedAmount, candidate.refundedAmount);

  return db.transaction(async (tx) => {
    const [pay] = await tx.select().from(payment).where(eq(payment.id, paymentId)).limit(1).for("update");
    if (!pay) return { ok: false as const, reason: "payment_not_found" };
    if (pay.status !== "captured" && pay.status !== "partially_refunded") {
      return { ok: false as const, reason: "not_refundable" };
    }

    const refundAmount = requestedAmount;
    if (refundAmount <= 0 || pay.refundedAmount + refundAmount > pay.amount) {
      return { ok: false as const, reason: "invalid_amount" };
    }

    const now = new Date();
    const newRefunded = pay.refundedAmount + refundAmount;
    const fully = newRefunded >= pay.amount;

    await tx
      .update(payment)
      .set({
        refundedAmount: newRefunded,
        providerRefundId,
        status: fully ? "refunded" : "partially_refunded",
        refundedAt: now,
        updatedAt: now,
        notes: `Refund by admin ${adminId} (platform-first)`,
      })
      .where(eq(payment.id, paymentId));

    if (fully) {
      await tx
        .update(booking)
        .set({ status: "refunded", cancelledAt: now, cancellationReason: "Refunded", updatedAt: now })
        .where(eq(booking.id, pay.bookingId));
    }

    const disbursements = await tx
      .select()
      .from(paymentDisbursement)
      .where(eq(paymentDisbursement.bookingId, pay.bookingId));

    for (const d of disbursements) {
      if (["pending", "held", "approved", "processing"].includes(d.status)) {
        await tx
          .update(paymentDisbursement)
          .set({
            status: "failed",
            failureCode: "refund_before_payout",
            failureMessage: "Cancelled because traveller refund issued from platform",
            updatedAt: now,
          })
          .where(eq(paymentDisbursement.id, d.id));
      } else if (d.status === "paid") {
        await tx.insert(paymentEvent).values({
          provider: d.provider,
          providerEventId: `clawback_${d.id}_${now.getTime()}`,
          paymentId: pay.id,
          type: "disbursement.clawback_required",
          signatureVerified: true,
          payload: {
            purposeCode: DISBURSEMENT_PURPOSE_CODE,
            disbursementId: d.id,
            adminId,
            note: "Traveller refunded from platform; vendor clawback required via PA-CB partner.",
          },
          processedAt: now,
        });
      }
    }

    await tx.insert(paymentEvent).values({
      provider: pay.provider,
      providerEventId: `refund_${paymentId}_${now.getTime()}`,
      paymentId: pay.id,
      type: "payment.refunded",
      signatureVerified: true,
      payload: { amount: refundAmount, adminId, providerRefundId, platformFirst: true },
      processedAt: now,
    });

    return { ok: true as const, refundedAmount: newRefunded, providerRefundId, fully };
  });
}

/** Pure policy helper for tests. */
export function escrowStatusAfterCapture(): "held" {
  return "held";
}

export function canReleaseEscrow(status: string): boolean {
  return status === "held";
}
