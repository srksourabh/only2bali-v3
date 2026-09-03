import { z } from "zod";

/**
 * E.164-ish. Deliberately permissive about country code but strict about shape,
 * so a typo is rejected before it costs an SMS.
 */
const mobile = z
  .string()
  .trim()
  .transform((v) => {
    const digits = v.replace(/[\s()-]/g, "");
    if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
    return digits;
  })
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

const password = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password is too long.");

export const authRoleSchema = z.enum(["traveller", "vendor", "admin"]);

/** Signup accepts an email or a display name; we store a sanitized username. */
export function normalizeUsernameInput(raw: string): {
  username: string;
  email?: string;
  error?: string;
} {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return { username: "", error: "Enter a username or email." };

  if (trimmed.includes("@")) {
    const parsed = email.safeParse(trimmed);
    if (!parsed.success) return { username: "", error: "Enter a valid email address." };
    const local = parsed.data.split("@")[0].replace(/[^a-z0-9._-]+/g, "");
    const username = (local.length >= 3 ? local : `user${local}`).slice(0, 40);
    if (username.length < 3) return { username: "", error: "Email is too short to use as a username." };
    return { username, email: parsed.data };
  }

  const username = trimmed.replace(/\s+/g, "_").replace(/[^a-z0-9._-]+/g, "");
  if (username.length < 3) {
    return { username, error: "Username must be at least 3 letters or numbers." };
  }
  if (username.length > 40) return { username: username.slice(0, 40), error: "Username is too long." };
  return { username };
}

const emptyToUndef = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const passwordSignUpSchema = z
  .object({
    username: z.string().min(1, "Enter a username or email."),
    password,
    email: z.preprocess(emptyToUndef, email.optional()),
    role: z.enum(["traveller", "vendor"]),
    businessName: z.preprocess(emptyToUndef, z.string().trim().min(2).max(160).optional()),
  })
  .superRefine((value, ctx) => {
    const normalized = normalizeUsernameInput(value.username);
    if (normalized.error) {
      ctx.addIssue({ code: "custom", message: normalized.error, path: ["username"] });
    }
  })
  .transform((value) => {
    const normalized = normalizeUsernameInput(value.username);
    const suppliedEmail = value.email && value.email.length > 0 ? value.email : undefined;
    return {
      ...value,
      username: normalized.username,
      email: suppliedEmail ?? normalized.email ?? "",
    };
  })
  .refine((value) => value.role !== "vendor" || Boolean(value.businessName), {
    message: "Provider business name is required.",
    path: ["businessName"],
  });

export const passwordSignInSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your username or email.")
    .max(254),
  password: z.string().min(1, "Enter your password.").max(128),
  role: authRoleSchema,
});

export const verifyMobileRequestSchema = z.object({ mobile });
export const verifyMobileConfirmSchema = z.object({
  mobile,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "The code is six digits."),
});

export type PasswordSignUpInput = z.infer<typeof passwordSignUpSchema>;
export type PasswordSignInInput = z.infer<typeof passwordSignInSchema>;
export type VerifyMobileRequestInput = z.infer<typeof verifyMobileRequestSchema>;
export type VerifyMobileConfirmInput = z.infer<typeof verifyMobileConfirmSchema>;

/** The single string an OTP is keyed on, so email and mobile cannot collide. */
export function toIdentifier(input: { email?: string; mobile?: string }): string {
  return input.email ? `email:${input.email}` : `mobile:${input.mobile}`;
}
