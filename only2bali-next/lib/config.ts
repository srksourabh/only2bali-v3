/**
 * Where a visitor's message actually goes.
 *
 * These shipped as hardcoded placeholders — WhatsApp `6281200000000` and
 * `hello@only2bali.com` — while every lead on the site was a WhatsApp or mailto
 * link. Every enquiry went to a number nobody owns.
 *
 * Two things changed. Enquiries are written to Postgres first, so the business
 * keeps the lead whatever happens next; and the WhatsApp and email links render
 * only when a real destination is configured. An unconfigured site shows no
 * contact button rather than a broken one.
 *
 * Prefer Admin → Integration settings (or Vercel NEXT_PUBLIC_*). Env remains
 * the sync fallback for client components; server code should use
 * `getContactConfig()` so database-saved values apply.
 */
const PLACEHOLDER_WHATSAPP = "6281200000000";
const PLACEHOLDER_EMAIL = "hello@only2bali.com";

function normalizeContact(whatsappRaw: string | null | undefined, emailRaw: string | null | undefined) {
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

/** Sync env-based contact — used by client components. */
export const CFG = {
  brand: "Only2Bali",
  ...envContact,
} as const;

/** Server-side: database settings win, then env. */
export async function getContactConfig(): Promise<{
  brand: string;
  whatsapp: string | null;
  email: string | null;
  configured: boolean;
}> {
  try {
    const { getSetting } = await import("@/lib/repositories/settings");
    const [wa, email] = await Promise.all([
      getSetting("contact.whatsapp_number"),
      getSetting("contact.email"),
    ]);
    const fromDb = normalizeContact(wa, email);
    if (fromDb.configured) {
      return { brand: "Only2Bali", ...fromDb };
    }
  } catch {
    // fall through to env
  }
  return { brand: "Only2Bali", ...envContact };
}

export const wa = (text: string): string | null =>
  CFG.whatsapp ? `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}` : null;

export const mailto = (subject: string, body: string): string | null =>
  CFG.email
    ? `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

export async function waFromSettings(text: string): Promise<string | null> {
  const c = await getContactConfig();
  return c.whatsapp ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(text)}` : null;
}
