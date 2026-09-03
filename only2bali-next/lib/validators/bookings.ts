import { PROTOCOLS } from "@/lib/protocols";
import { z } from "zod";

const travellerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name required.").max(120),
  age: z.number().int().min(0).max(120).optional(),
  dietaryNotes: z.string().trim().max(500).optional(),
});

const sharedBookingFields = {
  pax: z.coerce.number().int().min(1, "At least one traveller.").max(30, "Contact us for groups over 30."),
  rooms: z.number().int().min(1).max(15).optional(),
  protocol: z.enum(PROTOCOLS),
  travellers: z
    .array(travellerSchema)
    .min(1, "Add at least the lead traveller.")
    .max(30),
  specialRequirements: z.string().trim().max(1000).optional(),
};

/**
 * What the browser is allowed to say at checkout.
 *
 * Note what is absent: any amount. The price comes from the departure or
 * listing row, on the server, every time.
 */
export const departureBookingSchema = z.object({
  departureId: z.uuid("Choose a departure date."),
  ...sharedBookingFields,
});

export const listingBookingSchema = z.object({
  listingId: z
    .string()
    .trim()
    .min(8, "Choose a service.")
    .max(80, "Choose a service.")
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^sample-svc-[a-z0-9-]+$/i,
      "Choose a service."
    ),
  /** ISO calendar date YYYY-MM-DD in the service's local day. */
  serviceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a service date."),
  ...sharedBookingFields,
});

export const bookingRequestSchema = z.union([departureBookingSchema, listingBookingSchema]);

export type DepartureBookingInput = z.infer<typeof departureBookingSchema>;
export type ListingBookingInput = z.infer<typeof listingBookingSchema>;
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export function isListingBooking(input: BookingRequestInput): input is ListingBookingInput {
  return "listingId" in input;
}
