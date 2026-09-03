import { NextResponse } from "next/server";
import {
  bookingRequestSchema,
  departureBookingSchema,
  isListingBooking,
  listingBookingSchema,
} from "@/lib/validators/bookings";
import { createBooking, createListingBooking } from "@/lib/repositories/bookings";
import { getSessionUser } from "@/lib/auth";
import { rateLimitShared } from "@/lib/rate-limit-db";

export const dynamic = "force-dynamic";

/**
 * Creates a booking in `pending_payment` and holds inventory (seats or a listing date).
 * Sign-in required. Amount is always server-computed.
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
      // Prefer the more specific schema error for clearer fields.
      const specific =
        typeof json === "object" && json && "listingId" in json
          ? listingBookingSchema.safeParse(json)
          : departureBookingSchema.safeParse(json);
      const err = specific.success ? parsed.error : specific.error;
      return NextResponse.json(
        {
          success: false,
          error: "Check the details and try again.",
          fields: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
        { status: 400 }
      );
    }

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

    const result = isListingBooking(parsed.data)
      ? await createListingBooking(user.accountId, parsed.data)
      : await createBooking(user.accountId, parsed.data);

    if (!result.ok) {
      switch (result.reason) {
        case "departure_not_found":
        case "listing_not_found":
          return NextResponse.json(
            { success: false, error: "That option no longer exists." },
            { status: 404 }
          );
        case "departure_closed":
          return NextResponse.json(
            { success: false, error: "That departure is closed. Please choose another date." },
            { status: 409 }
          );
        case "listing_unavailable":
          return NextResponse.json(
            { success: false, error: "That service is not available to book." },
            { status: 409 }
          );
        case "date_blocked":
          return NextResponse.json(
            { success: false, error: "That date is not available. Please choose another." },
            { status: 409 }
          );
        case "date_held":
          return NextResponse.json(
            { success: false, error: "Someone else is booking that date. Try again in a few minutes." },
            { status: 409 }
          );
        case "capacity_exceeded":
          return NextResponse.json(
            { success: false, error: "That group size is outside this service's capacity." },
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
            { success: false, error: "Too many names for this group size." },
            { status: 400 }
          );
      }
    }

    return NextResponse.json({ success: true, data: result.booking }, { status: 201 });
  } catch (err) {
    console.error("[bookings] could not create booking", err);
    return NextResponse.json(
      {
        success: false,
        error: "We could not hold that booking just now. Nothing was charged. Please try again.",
      },
      { status: 500 }
    );
  }
}
