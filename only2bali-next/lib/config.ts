// ── Site configuration — replace placeholders before launch ──
export const CFG = {
  whatsapp: "6281200000000", // TODO: real WhatsApp business number, digits only
  email: "hello@only2bali.com", // TODO: confirm inbox
  brand: "Only2Bali",
} as const;

export const wa = (text: string) =>
  `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(text)}`;

export const mailto = (subject: string, body: string) =>
  `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
