/**
 * Turning a departure or listing into a booking that money can be taken against.
 *
 * The whole thing runs in one transaction with the inventory row locked, which
 * is the only way the seat / date count can be trusted.
 *
 * No gateway is called here. This produces the booking, the amount and a
 * time-limited hold; a payment provider attaches afterwards through
 * `payment` / `payment_event`.
 */
import { and, eq, lt, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { namedTravellersFitGroup } from "@/lib/repositories/booking-travellers";
import {
  availability,
  booking,
  bookingListing,
  bookingTraveller,
  departure,
  seatHold,
  serviceListing,
  traveller,
  tripRequest,
  vendor,
} from "@/lib/db/schema";
import type { DepartureBookingInput, ListingBookingInput } from "@/lib/validators/bookings";
import { resolveBookableListingId } from "@/lib/repositories/fallback-listings";
import { computeListingGrossAmount } from "@/lib/repositories/listing-price";
import { isPubliclyVisibleListing } from "@/lib/repositories/listings-public";
import { resolveCommissionRate, splitGrossAmount } from "@/lib/payments/fee";
import { getPlatformFeeRate } from "@/lib/repositories/platform-settings";

/** How long a seat / date is held while the traveller pays. */
export const HOLD_MINUTES = 15;

export type BookingFailure =
  | "departure_not_found"
  | "departure_closed"
  | "not_enough_seats"
  | "traveller_count_mismatch"
  | "listing_not_found"
  | "listing_unavailable"
  | "date_blocked"
  | "date_held"
  | "capacity_exceeded";

export interface BookingCreated {
  reference: string;
  bookingId: string;
  grossAmount: number;
  currency: string;
  pricePerPerson: number;
  holdExpiresAt: Date;
}

export type BookingResult =
  | { ok: true; booking: BookingCreated }
  | { ok: false; reason: BookingFailure; seatsAvailable?: number };

function newReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `O2B-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function ensureTravellerProfile(tx: Tx, accountId: string, leadName: string) {
  let [profile] = await tx
    .select({ id: traveller.id })
    .from(traveller)
    .where(eq(traveller.accountId, accountId))
    .limit(1);
  if (!profile) {
    [profile] = await tx
      .insert(traveller)
      .values({ accountId, fullName: leadName })
      .returning({ id: traveller.id });
  }
  return profile;
}

export async function createBooking(
  accountId: string,
  input: DepartureBookingInput
): Promise<BookingResult> {
  if (!namedTravellersFitGroup(input.pax, input.travellers.length)) {
    return { ok: false, reason: "traveller_count_mismatch" };
  }

  return db.transaction(async (tx) => {
    const expired = await tx
      .delete(seatHold)
      .where(and(eq(seatHold.departureId, input.departureId), lt(seatHold.expiresAt, new Date())))
      .returning({ seats: seatHold.seats });
    const releasedSeats = expired.reduce((sum, h) => sum + h.seats, 0);

    const [dep] = await tx
      .select({
        id: departure.id,
        packageId: departure.packageId,
        priceAmount: departure.priceAmount,
        priceCurrency: departure.priceCurrency,
        seatsTotal: departure.seatsTotal,
        seatsHeld: departure.seatsHeld,
        seatsBooked: departure.seatsBooked,
        status: departure.status,
        startDate: departure.startDate,
        endDate: departure.endDate,
      })
      .from(departure)
      .where(eq(departure.id, input.departureId))
      .limit(1)
      .for("update");

    if (!dep) return { ok: false, reason: "departure_not_found" as const };
    if (dep.status === "cancelled" || dep.status === "sold_out") {
      return { ok: false, reason: "departure_closed" as const };
    }

    const held = dep.seatsHeld - releasedSeats;
    const seatsAvailable = dep.seatsTotal - held - dep.seatsBooked;
    if (seatsAvailable < input.pax) {
      return { ok: false, reason: "not_enough_seats" as const, seatsAvailable };
    }

    const profile = await ensureTravellerProfile(tx, accountId, input.travellers[0].fullName);

    const [request] = await tx
      .insert(tripRequest)
      .values({
        travellerId: profile.id,
        status: "booked",
        protocol: input.protocol,
        groupSize: input.pax,
        rooms: input.rooms,
        fromDate: dep.startDate,
        toDate: dep.endDate,
        visibility: "private",
        specialRequirements: input.specialRequirements,
        mobileVerified: true,
      })
      .returning({ id: tripRequest.id });

    const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);
    await tx.insert(seatHold).values({
      departureId: dep.id,
      tripRequestId: request.id,
      seats: input.pax,
      expiresAt: holdExpiresAt,
    });

    await tx
      .update(departure)
      .set({ seatsHeld: sql`${departure.seatsHeld} - ${releasedSeats} + ${input.pax}` })
      .where(eq(departure.id, dep.id));

    const grossAmount = dep.priceAmount * input.pax;
    const catalogueRate = await getPlatformFeeRate(tx);
    const split = splitGrossAmount(grossAmount, catalogueRate);

    const [row] = await tx
      .insert(booking)
      .values({
        reference: newReference(),
        tripRequestId: request.id,
        travellerId: profile.id,
        packageId: dep.packageId,
        departureId: dep.id,
        pax: input.pax,
        rooms: input.rooms,
        grossAmount,
        currency: dep.priceCurrency,
        commissionRate: split.rateString,
        commissionAmount: split.commissionAmount,
        netAmount: split.netAmount,
        status: "pending_payment",
      })
      .returning({ id: booking.id, reference: booking.reference });

    await tx.insert(bookingTraveller).values(
      input.travellers.map((t, i) => ({
        bookingId: row.id,
        fullName: t.fullName,
        age: t.age,
        dietaryNotes: t.dietaryNotes,
        isLead: i === 0,
      }))
    );

    return {
      ok: true as const,
      booking: {
        reference: row.reference,
        bookingId: row.id,
        grossAmount,
        currency: dep.priceCurrency,
        pricePerPerson: dep.priceAmount,
        holdExpiresAt,
      },
    };
  });
}

/**
 * Book a verified provider listing for one service date.
 * Price is always taken from the listing (or date override), never the client.
 */
export async function createListingBooking(
  accountId: string,
  input: ListingBookingInput
): Promise<BookingResult> {
  if (!namedTravellersFitGroup(input.pax, input.travellers.length)) {
    return { ok: false, reason: "traveller_count_mismatch" };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (input.serviceDate < today) {
    return { ok: false, reason: "listing_unavailable" };
  }

  const listingId = await resolveBookableListingId(input.listingId);
  if (!listingId) return { ok: false, reason: "listing_not_found" };

  return db.transaction(async (tx) => {
    const [listingRow] = await tx
      .select()
      .from(serviceListing)
      .where(eq(serviceListing.id, listingId))
      .limit(1)
      .for("update");

    if (!listingRow) return { ok: false, reason: "listing_not_found" as const };

    const [vendorRow] = await tx
      .select({
        verificationStatus: vendor.verificationStatus,
        commissionRate: vendor.commissionRate,
      })
      .from(vendor)
      .where(eq(vendor.id, listingRow.vendorId))
      .limit(1);

    if (!vendorRow) return { ok: false, reason: "listing_not_found" as const };

    const listing = {
      id: listingRow.id,
      vendorId: listingRow.vendorId,
      priceAmount: listingRow.priceAmount,
      priceCurrency: listingRow.priceCurrency,
      priceUnit: listingRow.priceUnit,
      capacityMin: listingRow.capacityMin,
      capacityMax: listingRow.capacityMax,
      status: listingRow.status,
      active: listingRow.active,
      verificationStatus: vendorRow.verificationStatus,
      commissionRate: vendorRow.commissionRate,
    };
    if (
      !isPubliclyVisibleListing({
        listingStatus: listing.status,
        listingActive: listing.active,
        vendorVerificationStatus: listing.verificationStatus,
      })
    ) {
      return { ok: false, reason: "listing_unavailable" as const };
    }

    if (input.pax < listing.capacityMin || input.pax > listing.capacityMax) {
      return { ok: false, reason: "capacity_exceeded" as const };
    }

    await tx
      .update(availability)
      .set({ status: "open", holdExpiresAt: null })
      .where(
        and(
          eq(availability.listingId, listing.id),
          eq(availability.date, input.serviceDate),
          eq(availability.status, "held"),
          lt(availability.holdExpiresAt, new Date())
        )
      );

    let [slot] = await tx
      .select()
      .from(availability)
      .where(and(eq(availability.listingId, listing.id), eq(availability.date, input.serviceDate)))
      .limit(1)
      .for("update");

    if (slot?.status === "blocked" || slot?.status === "booked") {
      return { ok: false, reason: "date_blocked" as const };
    }
    if (slot?.status === "held" && slot.holdExpiresAt && slot.holdExpiresAt > new Date()) {
      return { ok: false, reason: "date_held" as const };
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);
    if (!slot) {
      [slot] = await tx
        .insert(availability)
        .values({
          listingId: listing.id,
          date: input.serviceDate,
          status: "held",
          holdExpiresAt,
        })
        .returning();
    } else {
      await tx
        .update(availability)
        .set({ status: "held", holdExpiresAt })
        .where(eq(availability.id, slot.id));
    }

    const profile = await ensureTravellerProfile(tx, accountId, input.travellers[0].fullName);

    const [request] = await tx
      .insert(tripRequest)
      .values({
        travellerId: profile.id,
        status: "booked",
        protocol: input.protocol,
        groupSize: input.pax,
        rooms: input.rooms,
        fromDate: input.serviceDate,
        toDate: input.serviceDate,
        visibility: "private",
        specialRequirements: input.specialRequirements,
        mobileVerified: true,
      })
      .returning({ id: tripRequest.id });

    const unitPrice = slot.priceOverrideAmount ?? listing.priceAmount;
    const grossAmount = computeListingGrossAmount({
      priceAmount: listing.priceAmount,
      priceUnit: listing.priceUnit,
      pax: input.pax,
      priceOverrideAmount: slot.priceOverrideAmount,
    });
    const platformRate = await getPlatformFeeRate(tx);
    const commissionRate = resolveCommissionRate(listing.commissionRate, platformRate);
    const split = splitGrossAmount(grossAmount, commissionRate);

    const [row] = await tx
      .insert(booking)
      .values({
        reference: newReference(),
        tripRequestId: request.id,
        travellerId: profile.id,
        vendorId: listing.vendorId,
        pax: input.pax,
        rooms: input.rooms,
        grossAmount,
        currency: listing.priceCurrency,
        commissionRate: split.rateString,
        commissionAmount: split.commissionAmount,
        netAmount: split.netAmount,
        status: "pending_payment",
      })
      .returning({ id: booking.id, reference: booking.reference });

    await tx.insert(bookingListing).values({
      bookingId: row.id,
      listingId: listing.id,
      priceSnapshot: unitPrice,
    });

    await tx.insert(bookingTraveller).values(
      input.travellers.map((t, i) => ({
        bookingId: row.id,
        fullName: t.fullName,
        age: t.age,
        dietaryNotes: t.dietaryNotes,
        isLead: i === 0,
      }))
    );

    return {
      ok: true as const,
      booking: {
        reference: row.reference,
        bookingId: row.id,
        grossAmount,
        currency: listing.priceCurrency,
        pricePerPerson:
          listing.priceUnit === "per_person" ? unitPrice : Math.round(grossAmount / input.pax),
        holdExpiresAt,
      },
    };
  });
}
