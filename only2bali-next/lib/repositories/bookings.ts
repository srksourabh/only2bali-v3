/**
 * Turning a departure into a booking that money can be taken against.
 *
 * The whole thing runs in one transaction with the departure row locked, which
 * is the only way the seat count can be trusted. Two people clicking "book" on
 * the last two seats of a sold-out departure is not a rare edge case — it is
 * what happens on the day a departure nearly fills.
 *
 * No gateway is called here. This produces the booking, the amount and a
 * time-limited seat hold; a payment provider attaches to that afterwards
 * through `payment` / `payment_event`. Keeping the two apart is deliberate:
 * the gateway has not been chosen, and this code must not have to change when
 * it is.
 */
import { and, eq, lt, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { booking, bookingTraveller, departure, seatHold, traveller, tripRequest } from "@/lib/db/schema";
import type { BookingRequestInput } from "@/lib/validators/bookings";

/** How long a seat is held while the traveller pays. */
export const HOLD_MINUTES = 15;

/**
 * Platform commission when the sale comes from the catalogue rather than from a
 * provider's own offer. A provider-originated booking uses `vendor.commission_rate`.
 */
const CATALOGUE_COMMISSION_RATE = 0.15;

export type BookingFailure =
  | "departure_not_found"
  | "departure_closed"
  | "not_enough_seats"
  | "traveller_count_mismatch";

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

/**
 * Human-readable, unguessable, and short enough to read down a phone line.
 * Not sequential — a sequential reference tells a competitor how many bookings
 * were taken last month.
 */
function newReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `O2B-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

export async function createBooking(
  accountId: string,
  input: BookingRequestInput
): Promise<BookingResult> {
  if (input.travellers.length !== input.pax) {
    return { ok: false, reason: "traveller_count_mismatch" };
  }

  return db.transaction(async (tx) => {
    /**
     * Expired holds are swept before the seat count is read, inside the same
     * transaction. A sweep that runs on a timer elsewhere would leave seats
     * unsellable for however long the timer takes, which on a nearly-full
     * departure is the difference between a sale and a lost one.
     */
    const expired = await tx
      .delete(seatHold)
      .where(and(eq(seatHold.departureId, input.departureId), lt(seatHold.expiresAt, new Date())))
      .returning({ seats: seatHold.seats });
    const releasedSeats = expired.reduce((sum, h) => sum + h.seats, 0);

    // FOR UPDATE. Everything below depends on nobody else changing this row.
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

    // The account may never have completed a traveller profile. A booking must
    // still belong to someone, so create the minimum rather than refusing.
    let [profile] = await tx
      .select({ id: traveller.id })
      .from(traveller)
      .where(eq(traveller.accountId, accountId))
      .limit(1);
    if (!profile) {
      [profile] = await tx
        .insert(traveller)
        .values({ accountId, fullName: input.travellers[0].fullName })
        .returning({ id: traveller.id });
    }

    /**
     * `booking.trip_request_id` is NOT NULL, so a catalogue purchase still gets
     * a request row. That is not bureaucracy: it is what lets a booking that
     * started as "I clicked buy" and a booking that started as "four providers
     * bid for my group" be reported, messaged and refunded through one path.
     */
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

    // Written as an expression against the current value rather than a computed
    // number, so the released seats and this hold settle in one statement. The
    // `departure_seats_sane` check constraint is the backstop.
    await tx
      .update(departure)
      .set({ seatsHeld: sql`${departure.seatsHeld} - ${releasedSeats} + ${input.pax}` })
      .where(eq(departure.id, dep.id));

    const grossAmount = dep.priceAmount * input.pax;
    const commissionAmount = Math.round(grossAmount * CATALOGUE_COMMISSION_RATE);

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
        commissionRate: CATALOGUE_COMMISSION_RATE.toFixed(4),
        commissionAmount,
        netAmount: grossAmount - commissionAmount,
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
