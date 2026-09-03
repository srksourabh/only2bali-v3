import { PROTOCOLS } from "@/lib/protocols";
import { z } from "zod";

export const tripRequestCreateSchema = z.object({
  protocol: z.enum(PROTOCOLS),
  tier: z.enum(["economical", "comfort", "premium"]).optional(),
  groupSize: z.number().int().min(1).max(500),
  crewType: z.string().trim().max(80).optional(),
  rooms: z.number().int().min(1).max(100).optional(),
  fromDate: z.iso.date().optional(),
  toDate: z.iso.date().optional(),
  flexibleMonth: z.string().trim().max(80).optional(),
  nights: z.number().int().min(1).max(60).optional(),
  departureCity: z.string().trim().max(120).optional(),
  interests: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  kitchenRequired: z.boolean().default(false),
  cookRequired: z.boolean().default(false),
  preferredLanguage: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
  budgetMinAmount: z.number().int().positive().optional(),
  budgetMaxAmount: z.number().int().positive().optional(),
  budgetCurrency: z.enum(["INR", "IDR"]).default("INR"),
  budgetBasis: z.enum(["per_person", "total", "unsure"]).default("unsure"),
  specialRequirements: z.string().trim().max(2000).optional(),
  requirementTags: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  publishToProviders: z.boolean().default(true),
}).refine(
  (value) => !value.cookRequired || value.groupSize >= 10,
  "An accompanying cook is available for groups of 10 or more."
).refine(
  (value) => !value.budgetMinAmount || !value.budgetMaxAmount || value.budgetMinAmount <= value.budgetMaxAmount,
  "Minimum budget must be lower than maximum budget."
);

export const providerBidSchema = z.object({
  title: z.string().trim().min(1).max(180),
  summary: z.string().trim().max(2000).optional(),
  vendorNetAmount: z.number().int().positive(),
  currency: z.enum(["INR", "IDR"]).default("INR"),
  pricePerPerson: z.number().int().positive().optional(),
  lineItems: z.array(z.object({
    label: z.string().trim().min(1).max(120),
    amount: z.number().int().positive(),
  })).max(40).optional(),
  inclusionsDelta: z.record(z.string(), z.unknown()).optional(),
  dayPlan: z.unknown().optional(),
  validUntil: z.iso.datetime().optional(),
});

export const messageSchema = z.object({
  tripRequestId: z.uuid().optional(),
  vendorId: z.uuid().optional(),
  bookingId: z.uuid().optional(),
  threadId: z.uuid().optional(),
  body: z.string().trim().min(1).max(2000),
}).refine(
  (value) => value.threadId || (value.tripRequestId && value.vendorId),
  "Give a thread, or a trip request and provider."
);

export type TripRequestCreateInput = z.infer<typeof tripRequestCreateSchema>;
export type ProviderBidInput = z.infer<typeof providerBidSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
