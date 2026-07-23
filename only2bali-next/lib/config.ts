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
 * Set these in Vercel (Project → Settings → Environment Variables). They are
 * public by nature — they appear on the page — so `NEXT_PUBLIC_` is right here,
 * and would be wrong for anything secret.
 */
const PLACEHOLDER_WHATSAPP = "6281200000000";
const PLACEHOLDER_EMAIL = "hello@only2bali.com";

/** Digits only, no leading `+`, which is what wa.me expects. */
const rawWhatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
const rawEmail = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim().toLowerCase();

const whatsappOk = rawWhatsapp.length >= 8 && rawWhatsapp !== PLACEHOLDER_WHATSAPP;
const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail) && rawEmail !== PLACEHOLDER_EMAIL;

export const CFG = {
  brand: "Only2Bali",
  whatsapp: whatsappOk ? rawWhatsapp : null,
  email: emailOk ? rawEmail : null,
  /** True when at least one channel is real. Gate contact links on this. */
  configured: whatsappOk || emailOk,
} as const;

export const wa = (text: string): string | null =>
  CFG.whatsapp ? `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}` : null;

export const mailto = (subject: string, body: string): string | null =>
  CFG.email
    ? `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;
