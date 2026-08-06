import { z } from "zod";

export const adminListingPatchSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  priceAmount: z.number().int().positive().optional(),
  tier: z.enum(["economical", "comfort", "premium"]).optional(),
  status: z.enum(["draft", "pending_review", "active", "paused", "rejected"]).optional(),
  active: z.boolean().optional(),
  images: z.array(z.url().max(1000)).max(20).optional(),
}).refine((value) => Object.keys(value).length > 0, "Give at least one field to update.");

export const adminContentStatusSchema = z.object({
  status: z.enum(["draft", "pending_review", "published", "paused", "rejected"]).optional(),
  approved: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Give at least one field to update.");

export const adminPromotionPatchSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  priceAmount: z.number().int().positive().optional(),
  status: z.enum(["draft", "pending_review", "published", "paused", "rejected"]).optional(),
  images: z.array(z.url().max(1000)).max(20).optional(),
}).refine((value) => Object.keys(value).length > 0, "Give at least one field to update.");

export const adminApplicationDecisionSchema = z.object({
  status: z.enum(["verified", "rejected", "in_review"]),
  reason: z.string().trim().max(1000).optional(),
});

export const adminVendorVerificationSchema = z.object({
  verificationStatus: z.enum(["verified", "rejected", "suspended", "in_review", "pending"]),
  rejectionReason: z.string().trim().max(1000).optional(),
});

export type AdminListingPatchInput = z.infer<typeof adminListingPatchSchema>;
export type AdminContentStatusInput = z.infer<typeof adminContentStatusSchema>;
export type AdminPromotionPatchInput = z.infer<typeof adminPromotionPatchSchema>;
export type AdminApplicationDecisionInput = z.infer<typeof adminApplicationDecisionSchema>;
export type AdminVendorVerificationInput = z.infer<typeof adminVendorVerificationSchema>;
