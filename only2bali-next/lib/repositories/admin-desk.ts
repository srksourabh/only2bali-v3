import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { account, booking, payment, paymentDisbursement, traveller, vendor } from "@/lib/db/schema";

export type DeskStaff = { id: string; username: string };

export type DeskPayment = {
  bookingId: string;
  reference: string;
  travellerName: string;
  pax: number;
  amount: number;
  currency: string;
  bookingStatus: string;
  paymentStatus: string | null;
  provider: string | null;
  capturedAt: string | null;
  vendorNet?: number | null;
  disbursementStatus?: string | null;
};

export type DeskVendor = {
  id: string;
  businessName: string;
  verificationStatus: string;
  assignedTo: string | null;
  assignedUsername: string | null;
};

export function attachPaymentsToVendors(
  vendors: DeskVendor[],
  payments: Array<DeskPayment & { vendorId: string | null }>
): Array<DeskVendor & { payments: DeskPayment[] }> {
  const byVendor = new Map<string, DeskPayment[]>();
  for (const row of payments) {
    if (!row.vendorId) continue;
    const { vendorId: _vendorId, ...payment } = row;
    const list = byVendor.get(row.vendorId) ?? [];
    list.push(payment);
    byVendor.set(row.vendorId, list);
  }
  return vendors.map((vendor) => ({
    ...vendor,
    payments: byVendor.get(vendor.id) ?? [],
  }));
}

export async function listAdminVendorDesk() {
  const assignee = alias(account, "vendor_assignee");
  const [staff, vendors, paymentRows] = await Promise.all([
    db
      .select({ id: account.id, username: account.username })
      .from(account)
      .where(and(eq(account.role, "admin"), eq(account.status, "active")))
      .orderBy(account.username),
    db
      .select({
        id: vendor.id,
        businessName: vendor.businessName,
        verificationStatus: vendor.verificationStatus,
        assignedTo: vendor.assignedTo,
        assignedUsername: assignee.username,
      })
      .from(vendor)
      .leftJoin(assignee, eq(vendor.assignedTo, assignee.id))
      .orderBy(desc(vendor.createdAt))
      .limit(80),
    db
      .select({
        vendorId: booking.vendorId,
        bookingId: booking.id,
        reference: booking.reference,
        travellerName: traveller.fullName,
        pax: booking.pax,
        paymentAmount: payment.amount,
        grossAmount: booking.grossAmount,
        currency: booking.currency,
        bookingStatus: booking.status,
        paymentStatus: payment.status,
        provider: payment.provider,
        capturedAt: payment.capturedAt,
        vendorNet: paymentDisbursement.netAmount,
        disbursementStatus: paymentDisbursement.status,
      })
      .from(booking)
      .leftJoin(traveller, eq(booking.travellerId, traveller.id))
      .leftJoin(payment, eq(payment.bookingId, booking.id))
      .leftJoin(paymentDisbursement, eq(paymentDisbursement.bookingId, booking.id))
      .orderBy(desc(booking.createdAt))
      .limit(300),
  ]);

  return {
    staff: staff.map((row) => ({
      id: row.id,
      username: row.username ?? row.id,
    })),
    vendors: attachPaymentsToVendors(
      vendors,
      paymentRows.map((row) => ({
        vendorId: row.vendorId,
        bookingId: row.bookingId,
        reference: row.reference,
        travellerName: row.travellerName?.trim() || "Traveller",
        pax: row.pax,
        amount: row.paymentAmount ?? row.grossAmount,
        currency: row.currency,
        bookingStatus: row.bookingStatus,
        paymentStatus: row.paymentStatus ?? null,
        provider: row.provider ?? null,
        capturedAt: row.capturedAt ? row.capturedAt.toISOString() : null,
        vendorNet: row.vendorNet ?? null,
        disbursementStatus: row.disbursementStatus ?? null,
      }))
    ),
  };
}
