import { z } from "zod";

/**
 * What the browser is allowed to say at checkout.
 *
 * Note what is absent: any amount. The price comes from the departure row, on
 * the server, every time. A checkout that accepts a price from the client is a
 * checkout that can be bought from with the developer console open.
 */
export const bookingRequestSchema = z.object({
  departureId: z.uuid("Choose a departure date."),
  pax: z.number().int().min(1, "At least one traveller.").max(30, "Contact us for groups over 30."),
  rooms: z.number().int().min(1).max(15).optional(),
  protocol: z.enum(["jain", "vegetarian", "vegan"]),
  travellers: z
    .array(
      z.object({
        fullName: z.string().trim().min(2, "Full name required.").max(120),
        age: z.number().int().min(0).max(120).optional(),
        dietaryNotes: z.string().trim().max(500).optional(),
      })
    )
    .min(1, "Add at least the lead traveller.")
    .max(30),
  specialRequirements: z.string().trim().max(1000).optional(),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
