/**
 * Lifecycle email notifications.
 *
 * Every function here looks up its own recipients and never throws: a failed
 * send must not fail the booking/offer/message flow that triggered it.
 * `sendEmail` already swallows its own delivery errors, so the try/catch here
 * only guards the lookup query itself.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, booking, traveller, vendor, vendorApplication } from "@/lib/db/schema";
import { sendEmail } from "@/lib/auth/email-transport";

function money(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amountMinor / 100);
}

async function notify(to: string | null | undefined, subject: string, text: string): Promise<void> {
  if (!to) return;
  try {
    await sendEmail(to, subject, text);
  } catch (err) {
    console.error("[notifications] send failed:", subject, err instanceof Error ? err.message : err);
  }
}

async function travellerEmail(travellerId: string | null): Promise<string | null> {
  if (!travellerId) return null;
  const [row] = await db
    .select({ email: account.email })
    .from(traveller)
    .innerJoin(account, eq(traveller.accountId, account.id))
    .where(eq(traveller.id, travellerId))
    .limit(1);
  return row?.email ?? null;
}

async function vendorContact(vendorId: string | null): Promise<{ email: string | null; businessName: string | null }> {
  if (!vendorId) return { email: null, businessName: null };
  const [row] = await db
    .select({ vendorEmail: vendor.email, accountEmail: account.email, businessName: vendor.businessName })
    .from(vendor)
    .innerJoin(account, eq(vendor.accountId, account.id))
    .where(eq(vendor.id, vendorId))
    .limit(1);
  return { email: row?.vendorEmail ?? row?.accountEmail ?? null, businessName: row?.businessName ?? null };
}

/** A vendor submitted or the system generated a new offer against a trip request. */
export async function notifyOfferReceived(args: {
  travellerId: string | null;
  vendorName: string;
  offerTitle: string;
  totalAmount: number;
  currency: string;
}): Promise<void> {
  const email = await travellerEmail(args.travellerId);
  await notify(
    email,
    "You have a new trip offer",
    `${args.vendorName} sent you an offer "${args.offerTitle}" for ${money(args.totalAmount, args.currency)}. Sign in to Only2Bali to view and respond.`
  );
}

/** Traveller accepted an offer; a booking now exists, pending payment. */
export async function notifyOfferAccepted(bookingId: string): Promise<void> {
  const [row] = await db
    .select({
      reference: booking.reference,
      grossAmount: booking.grossAmount,
      currency: booking.currency,
      vendorId: booking.vendorId,
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);
  if (!row) return;

  const { email } = await vendorContact(row.vendorId);
  await notify(
    email,
    `Booking ${row.reference} accepted — awaiting payment`,
    `A traveller accepted your offer. Booking ${row.reference} (${money(row.grossAmount, row.currency)}) is now pending payment.`
  );
}

/** Payment captured; booking moved to confirmed. */
export async function notifyBookingConfirmed(bookingId: string): Promise<void> {
  const [row] = await db
    .select({
      reference: booking.reference,
      grossAmount: booking.grossAmount,
      currency: booking.currency,
      travellerId: booking.travellerId,
      vendorId: booking.vendorId,
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);
  if (!row) return;

  const amount = money(row.grossAmount, row.currency);
  const { email: vendorEmail } = await vendorContact(row.vendorId);
  await Promise.all([
    notify(
      await travellerEmail(row.travellerId),
      `Booking ${row.reference} confirmed`,
      `Your payment of ${amount} has been received. Booking ${row.reference} is confirmed.`
    ),
    notify(
      vendorEmail,
      `Booking ${row.reference} confirmed — payment received`,
      `Payment of ${amount} has been received for booking ${row.reference}. It is now confirmed.`
    ),
  ]);
}

/** Admin approved, rejected, or moved a vendor application to review. */
export async function notifyVendorApplicationDecision(
  applicationId: string,
  status: "verified" | "rejected" | "in_review"
): Promise<void> {
  const [row] = await db
    .select({ email: vendorApplication.email, businessName: vendorApplication.businessName })
    .from(vendorApplication)
    .where(eq(vendorApplication.id, applicationId))
    .limit(1);
  if (!row?.email) return;

  const messages: Record<typeof status, string> = {
    verified: `Good news — ${row.businessName} has been verified. You can now sign in and start listing.`,
    rejected: `Your application for ${row.businessName} was not approved this time.`,
    in_review: `Your application for ${row.businessName} is under review. We'll follow up shortly.`,
  };
  await notify(row.email, "Only2Bali vendor application update", messages[status]);
}

/** Someone sent a message; notify the other party in the thread. */
export async function notifyNewMessage(args: {
  recipientTravellerId?: string | null;
  recipientVendorId?: string | null;
  senderLabel: string;
}): Promise<void> {
  if (args.recipientTravellerId) {
    await notify(
      await travellerEmail(args.recipientTravellerId),
      "New message on Only2Bali",
      `${args.senderLabel} sent you a new message. Sign in to Only2Bali to read and reply.`
    );
  }
  if (args.recipientVendorId) {
    const { email } = await vendorContact(args.recipientVendorId);
    await notify(email, "New message on Only2Bali", `${args.senderLabel} sent you a new message. Sign in to Only2Bali to read and reply.`);
  }
}
