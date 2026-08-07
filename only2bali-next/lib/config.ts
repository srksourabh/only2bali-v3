/**
 * Where a visitor's message actually goes.
 *
 * Sync env-based contact for client components. Server code that should honour
 * Admin → Integration settings must use `getContactConfig` from
 * `lib/config-server.ts` — never import settings/db from this file.
 */
const PLACEHOLDER_WHATSAPP = "6281200000000";
const PLACEHOLDER_EMAIL = "hello@only2bali.com";

export function normalizeContact(
  whatsappRaw: string | null | undefined,
  emailRaw: string | null | undefined
) {
  const rawWhatsapp = (whatsappRaw ?? "").replace(/\D/g, "");
  const rawEmail = (emailRaw ?? "").trim().toLowerCase();
  const whatsappOk = rawWhatsapp.length >= 8 && rawWhatsapp !== PLACEHOLDER_WHATSAPP;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail) && rawEmail !== PLACEHOLDER_EMAIL;
  return {
    whatsapp: whatsappOk ? rawWhatsapp : null,
    email: emailOk ? rawEmail : null,
    configured: whatsappOk || emailOk,
  };
}

const envContact = normalizeContact(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  process.env.NEXT_PUBLIC_CONTACT_EMAIL
);

/** Sync env-based contact — safe for client components. */
export const CFG = {
  brand: "Only2Bali",
  ...envContact,
} as const;

export const wa = (text: string): string | null =>
  CFG.whatsapp ? `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}` : null;

export const mailto = (subject: string, body: string): string | null =>
  CFG.email
    ? `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;
