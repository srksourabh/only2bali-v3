import { z } from "zod";

/**
 * E.164-ish. Deliberately permissive about country code but strict about shape,
 * so a typo is rejected before it costs an SMS.
 */
const mobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid mobile number with country code."));

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export const identifierSchema = z
  .object({
    email: email.optional(),
    mobile: mobile.optional(),
  })
  .refine((v) => Boolean(v.email) !== Boolean(v.mobile), {
    message: "Provide either an email address or a mobile number, not both.",
  });

export const requestOtpSchema = identifierSchema;

export const verifyOtpSchema = z
  .object({
    email: email.optional(),
    mobile: mobile.optional(),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "The code is six digits."),
  })
  .refine((v) => Boolean(v.email) !== Boolean(v.mobile), {
    message: "Provide either an email address or a mobile number, not both.",
  });

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/** The single string an OTP is keyed on, so email and mobile cannot collide. */
export function toIdentifier(input: { email?: string; mobile?: string }): string {
  return input.email ? `email:${input.email}` : `mobile:${input.mobile}`;
}
