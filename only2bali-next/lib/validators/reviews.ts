import { z } from "zod";

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  direction: z.enum(["traveller_to_vendor", "vendor_to_traveller"]),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  foodComplianceKept: z.boolean().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
