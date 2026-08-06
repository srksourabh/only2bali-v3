import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { booking, bookingListing, pkg, serviceListing, traveller, tripRequest } from "@/lib/db/schema";
import { getVendorByAccount } from "@/lib/repositories/provider";

export async function listProviderBookings(accountId: string) {
  const vendor = await getVendorByAccount(accountId);
  if (!vendor) return null;

  const rows = await db
    .select({
      bookingId: booking.id,
      reference: booking.reference,
      status: booking.status,
      grossAmount: booking.grossAmount,
      netAmount: booking.netAmount,
      currency: booking.currency,
      pax: booking.pax,
      packageName: pkg.name,
      listingTitle: serviceListing.title,
      listingId: serviceListing.id,
      serviceDate: tripRequest.fromDate,
      travellerName: traveller.fullName,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt,
    })
    .from(booking)
    .leftJoin(pkg, eq(booking.packageId, pkg.id))
    .leftJoin(bookingListing, eq(bookingListing.bookingId, booking.id))
    .leftJoin(serviceListing, eq(bookingListing.listingId, serviceListing.id))
    .leftJoin(tripRequest, eq(booking.tripRequestId, tripRequest.id))
    .leftJoin(traveller, eq(booking.travellerId, traveller.id))
    .where(eq(booking.vendorId, vendor.id))
    .orderBy(desc(booking.createdAt))
    .limit(80);

  return { vendorId: vendor.id, bookings: rows };
}

const PROVIDER_STATUS = new Set(["in_progress", "completed"]);

export async function updateProviderBookingStatus(
  accountId: string,
  bookingId: string,
  status: "in_progress" | "completed"
) {
  if (!PROVIDER_STATUS.has(status)) {
    throw Object.assign(new Error("Invalid status."), { status: 400 });
  }
  const vendor = await getVendorByAccount(accountId);
  if (!vendor) {
    throw Object.assign(new Error("Provider profile not found."), { status: 404 });
  }

  const [row] = await db
    .select({
      id: booking.id,
      status: booking.status,
      vendorId: booking.vendorId,
    })
    .from(booking)
    .where(and(eq(booking.id, bookingId), eq(booking.vendorId, vendor.id)))
    .limit(1);

  if (!row) {
    throw Object.assign(new Error("Booking not found."), { status: 404 });
  }

  const allowedFrom =
    status === "in_progress"
      ? ["confirmed"]
      : ["confirmed", "in_progress"];
  if (!allowedFrom.includes(row.status)) {
    throw Object.assign(
      new Error(`Cannot move a ${row.status} booking to ${status}.`),
      { status: 409 }
    );
  }

  const [updated] = await db
    .update(booking)
    .set({ status, updatedAt: new Date() })
    .where(eq(booking.id, bookingId))
    .returning();

  return updated;
}
