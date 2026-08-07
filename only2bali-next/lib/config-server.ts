import "server-only";
import { getSetting } from "@/lib/repositories/settings";
import { normalizeContact } from "@/lib/config";

/** Server-side contact: database settings win, then NEXT_PUBLIC_* env. */
export async function getContactConfig(): Promise<{
  brand: string;
  whatsapp: string | null;
  email: string | null;
  configured: boolean;
}> {
  try {
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
  return {
    brand: "Only2Bali",
    ...normalizeContact(
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
      process.env.NEXT_PUBLIC_CONTACT_EMAIL
    ),
  };
}

export async function waFromSettings(text: string): Promise<string | null> {
  const c = await getContactConfig();
  return c.whatsapp ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(text)}` : null;
}
