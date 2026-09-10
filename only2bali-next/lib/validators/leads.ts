import { z } from "zod";
import { PROTOCOLS } from "@/lib/protocols";

export { PROTOCOLS };

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

/**
 * Dummy / reserved domains that look like an email but are not a mailbox we
 * can reach. `test@test.com` is the QA example; RFC 2606 holds example.*.
 * `.test` as a TLD stays allowed because the e2e suite uses @only2bali.test.
 */
const PLACEHOLDER_EMAIL_DOMAINS = new Set([
  "test.com",
  "test.in",
  "test.net",
  "test.org",
  "testing.com",
  "example.com",
  "example.net",
  "example.org",
]);

export const vendorEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254)
  .refine((value) => {
    const domain = value.split("@")[1] ?? "";
    return !PLACEHOLDER_EMAIL_DOMAINS.has(domain);
  }, "Enter a valid email address.");

/** 10-digit Indian mobile. Optional +91 is stripped; anything else is refused. */
export const indianMobile10Schema = z
  .string()
  .trim()
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) return digits.slice(2);
    return digits;
  })
  .pipe(
    z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number.")
      .transform((local) => `+91${local}`)
  );

export const vendorEmailCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the six-digit code sent to your email.");

export const vendorEmailVerifySchema = z.object({
  email: vendorEmailSchema,
});

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
  whatsapp: indianMobile10Schema,
  email: vendorEmailSchema,
  emailCode: vendorEmailCodeSchema,
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
