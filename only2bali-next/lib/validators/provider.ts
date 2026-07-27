import { z } from "zod";

const shortText = z.string().trim().min(1).max(180);
const optionalText = z.string().trim().max(2000).optional().or(z.literal(""));
const urlText = z.url().max(1000);

const currency = z.enum(["INR", "IDR"]);

export const providerProfileSchema = z.object({
  businessName: shortText.optional(),
  legalName: z.string().trim().max(180).optional().or(z.literal("")),
  baseArea: z.string().trim().max(180).optional().or(z.literal("")),
  description: optionalText,
  addressLine1: z.string().trim().max(240).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  logo: z.url().max(1000).optional().or(z.literal("")),
  coverImage: z.url().max(1000).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(32).optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email().max(254).optional().or(z.literal("")),
  website: z.url().max(1000).optional().or(z.literal("")),
  languages: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
});

const serviceListingBaseSchema = z.object({
  title: shortText,
  serviceType: z.enum([
    "restaurant",
    "accommodation",
    "transport",
    "guide",
    "cook",
    "produce",
    "artisan",
    "activity_operator",
    "tour_agency",
  ]),
  description: optionalText,
  area: z.string().trim().max(180).optional().or(z.literal("")),
  addressLine1: z.string().trim().max(240).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(40).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacityMin: z.number().int().min(1).max(500).default(1),
  capacityMax: z.number().int().min(1).max(500).default(30),
  tier: z.enum(["economical", "comfort", "premium"]).default("comfort"),
  priceAmount: z.number().int().positive(),
  priceCurrency: currency.default("INR"),
  priceUnit: z.enum(["per_person", "per_day", "per_group", "per_night", "per_trip"]).default("per_person"),
  images: z.array(urlText).max(20).optional(),
  serviceDetails: z.record(z.string(), z.unknown()).optional(),
  inclusions: z.array(z.string().trim().min(1).max(160)).max(40).optional(),
  exclusions: z.array(z.string().trim().min(1).max(160)).max(40).optional(),
  cancellationPolicy: optionalText,
});

export const serviceListingSchema = serviceListingBaseSchema.refine(
  (value) => value.capacityMin <= value.capacityMax,
  "Capacity maximum must be at least the minimum."
);

export const serviceListingPatchSchema = serviceListingBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Give at least one field to update."
).refine(
  (value) =>
    value.capacityMin === undefined ||
    value.capacityMax === undefined ||
    value.capacityMin <= value.capacityMax,
  "Capacity maximum must be at least the minimum."
);

export const providerMediaSchema = z.object({
  listingId: z.uuid().optional(),
  kind: z.enum(["photo", "menu", "licence", "gallery", "cover"]).default("photo"),
  fileUrl: urlText,
  altText: z.string().trim().max(180).optional().or(z.literal("")),
  caption: z.string().trim().max(300).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const providerEventSchema = z.object({
  title: shortText,
  description: optionalText,
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime().optional(),
  area: z.string().trim().max(180).optional().or(z.literal("")),
  addressLine1: z.string().trim().max(240).optional().or(z.literal("")),
  priceAmount: z.number().int().positive().optional(),
  priceCurrency: currency.default("INR"),
  displayCurrency: currency.default("IDR"),
  capacity: z.number().int().min(1).max(1000).optional(),
  images: z.array(urlText).max(20).optional(),
});

export const providerPromotionSchema = z.object({
  listingId: z.uuid().optional(),
  title: shortText,
  description: optionalText,
  offerCode: z.string().trim().max(80).optional().or(z.literal("")),
  priceAmount: z.number().int().positive().optional(),
  priceCurrency: currency.default("INR"),
  displayCurrency: currency.default("IDR"),
  terms: optionalText,
  validFrom: z.iso.datetime().optional(),
  validUntil: z.iso.datetime().optional(),
  images: z.array(urlText).max(20).optional(),
});

export const payoutAccountSchema = z.object({
  accountHolderName: shortText,
  bankName: z.string().trim().max(160).optional().or(z.literal("")),
  bankCountry: z.string().trim().max(80).default("Indonesia"),
  currency: currency.default("IDR"),
  maskedAccount: z.string().trim().max(80).optional().or(z.literal("")),
  upiId: z.string().trim().max(120).optional().or(z.literal("")),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
export type ServiceListingInput = z.infer<typeof serviceListingSchema>;
export type ServiceListingPatchInput = z.infer<typeof serviceListingPatchSchema>;
export type ProviderMediaInput = z.infer<typeof providerMediaSchema>;
export type ProviderEventInput = z.infer<typeof providerEventSchema>;
export type ProviderPromotionInput = z.infer<typeof providerPromotionSchema>;
export type PayoutAccountInput = z.infer<typeof payoutAccountSchema>;
