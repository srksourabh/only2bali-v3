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
  verificationStatus: z.enum(["verified", "rejected", "suspended", "in_review", "pending"]).optional(),
  rejectionReason: z.string().trim().max(1000).optional(),
  assignedTo: z.uuid().nullable().optional(),
}).refine(
  (value) => value.verificationStatus !== undefined || value.assignedTo !== undefined,
  "Give a verification status or an assigned developer."
);

export const bootstrapAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(40, "Username is too long.")
    .regex(/^[a-z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores only."),
  password: z.string().min(10, "Password must be at least 10 characters.").max(128, "Password is too long."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254).optional().or(z.literal("")),
});

export type AdminListingPatchInput = z.infer<typeof adminListingPatchSchema>;
export type AdminContentStatusInput = z.infer<typeof adminContentStatusSchema>;
export type AdminPromotionPatchInput = z.infer<typeof adminPromotionPatchSchema>;
export type AdminApplicationDecisionInput = z.infer<typeof adminApplicationDecisionSchema>;
export type AdminVendorVerificationInput = z.infer<typeof adminVendorVerificationSchema>;
export const platformFeePatchSchema = z.object({
  platformFeePercent: z
    .number()
    .min(0, "Platform fee cannot be negative.")
    .max(50, "Platform fee cannot exceed 50%."),
});

export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;
export type PlatformFeePatchInput = z.infer<typeof platformFeePatchSchema>;
