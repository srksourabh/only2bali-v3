import { NextResponse } from "next/server";
import { bookingRequestSchema } from "@/lib/validators/bookings";
import { createBooking } from "@/lib/repositories/bookings";
import { getSessionUser } from "@/lib/auth";
import { rateLimitShared } from "@/lib/rate-limit-db";

export const dynamic = "force-dynamic";

/**
 * Creates a booking in `pending_payment` and holds the seats.
 *
 * This is the last step before money. It deliberately does not take a payment:
 * it produces the booking reference and the server-computed amount that a
 * payment gateway is then pointed at. Nothing here changes when a gateway is
 * chosen.
 *
 * Sign-in is required. An anonymous booking has nobody to send a voucher to,
 * nobody to refund, and no way to prove later who agreed to what.
 */
const PER_ACCOUNT = { limit: 12, windowMs: 60 * 60_000 };
const MAX_BODY_BYTES = 16_384;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sign in to complete this booking." },
        { status: 401 }
      );
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: "Request too large." }, { status: 413 });
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
    }

    const parsed = bookingRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Check the details and try again.",
          fields: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        { status: 400 }
      );
    }

    // Keyed on the account, not the IP. A family booking from one office
    // network is normal; twelve bookings from one account in an hour is not.
    const limit = await rateLimitShared(
      `booking:acct:${user.accountId}`,
      PER_ACCOUNT.limit,
      PER_ACCOUNT.windowMs
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many booking attempts. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const result = await createBooking(user.accountId, parsed.data);

    if (!result.ok) {
      switch (result.reason) {
        case "departure_not_found":
          return NextResponse.json(
            { success: false, error: "That departure no longer exists." },
            { status: 404 }
          );
        case "departure_closed":
          return NextResponse.json(
            { success: false, error: "That departure is closed. Please choose another date." },
            { status: 409 }
          );
        case "not_enough_seats":
          return NextResponse.json(
            {
              success: false,
              error: `Only ${result.seatsAvailable} seats are left on that departure.`,
              data: { seatsAvailable: result.seatsAvailable },
            },
            { status: 409 }
          );
        case "traveller_count_mismatch":
          return NextResponse.json(
            { success: false, error: "Give the name of every traveller in the group." },
            { status: 400 }
          );
      }
    }

    return NextResponse.json({ success: true, data: result.booking }, { status: 201 });
  } catch (err) {
    // The transaction rolled back, so no seats are held and no booking exists.
    // Say so plainly rather than leaving the traveller wondering whether they
    // have just paid for something.
    console.error("[bookings] could not create booking", err);
    return NextResponse.json(
      { success: false, error: "We could not hold those seats just now. Nothing was charged. Please try again." },
      { status: 500 }
    );
  }
}
