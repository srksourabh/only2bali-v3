import { z } from "zod";

/**
 * What the public forms are allowed to send.
 *
 * Both forms are unauthenticated, so everything here is untrusted. Lengths are
 * capped so a single submission cannot be used to write megabytes into the
 * table, and the food protocol is narrowed to the same three values the
 * database enum accepts — "Mixed (veg household)" is offered in the UI but is
 * not a protocol, so it is carried in the message instead.
 */
const phone = z
  .string()
  .trim()
  .min(8, "Enter a phone number with country code.")
  .max(24)
  .regex(/^[+\d][\d\s-]{7,}$/, "Enter a valid phone number, for example +91 98xxxxxxx.");

import { PROTOCOLS } from "@/lib/protocols";

export { PROTOCOLS };

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(120),
  mobile: phone,
  email: z.string().trim().toLowerCase().email().max(254).optional().or(z.literal("")),
  departureCity: z.string().trim().min(1, "Which city do you fly from?").max(120),
  groupSize: z.coerce.number().int().min(1).max(500),
  /** null when the visitor picked an option outside the enum. */
  protocol: z.enum(PROTOCOLS).nullable(),
  protocolLabel: z.string().trim().max(60).optional(),
  travelMonth: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
});

export const vendorApplicationSchema = z.object({
  businessName: z.string().trim().min(1, "Tell us the business name.").max(160),
  businessType: z.string().trim().min(1, "Choose a business type.").max(80),
  baseArea: z.string().trim().min(1, "Where do you operate?").max(160),
  cuisine: z.string().trim().max(200).optional(),
  capabilities: z
    .array(z.string().trim().min(1).max(40))
    .min(1, "Pick at least one dietary capability.")
    .max(10),
  languages: z.string().trim().max(200).optional(),
  priceBand: z.string().trim().max(80).optional(),
  whatsapp: phone,
  email: z.string().trim().toLowerCase().email().max(254).optional().or(z.literal("")),
  availability: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type VendorApplicationInput = z.infer<typeof vendorApplicationSchema>;

/** Maps the form's own label onto the database enum, or null when it does not fit. */
export function toProtocol(label: string): (typeof PROTOCOLS)[number] | null {
  const key = label.trim().toLowerCase();
  return (PROTOCOLS as readonly string[]).includes(key)
    ? (key as (typeof PROTOCOLS)[number])
    : null;
}
