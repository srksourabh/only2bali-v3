import { describe, expect, it } from "vitest";
import { bookingRequestSchema, listingBookingSchema } from "./bookings";

const lead = [{ fullName: "Anita Shah" }];

describe("listingBookingSchema", () => {
  it("accepts a live listing uuid", () => {
    const parsed = listingBookingSchema.safeParse({
      listingId: "00000000-0000-4000-8000-000000000001",
      serviceDate: "2026-10-12",
      pax: 4,
      protocol: "vegetarian",
      travellers: lead,
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a catalogue fallback id so sample listings can be booked", () => {
    const parsed = listingBookingSchema.safeParse({
      listingId: "sample-svc-jain-thali",
      serviceDate: "2026-10-12",
      pax: 8,
      protocol: "jain",
      travellers: lead,
    });
    expect(parsed.success).toBe(true);
  });

  it("coerces pax from a string", () => {
    const parsed = listingBookingSchema.safeParse({
      listingId: "sample-svc-ubud-villa",
      serviceDate: "2026-10-12",
      pax: "6",
      protocol: "vegetarian",
      travellers: lead,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.pax).toBe(6);
  });
});

describe("bookingRequestSchema", () => {
  it("does not treat a fallback listing as an invalid departure", () => {
    const parsed = bookingRequestSchema.safeParse({
      listingId: "sample-svc-jain-thali",
      serviceDate: "2026-10-12",
      pax: 2,
      protocol: "vegan",
      travellers: lead,
    });
    expect(parsed.success).toBe(true);
  });
});
