import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * AES-256-GCM envelope for admin-stored secrets.
 * Key material is derived from AUTH_SECRET so rotating AUTH_SECRET seals old rows.
 */

function encryptionKey(): Buffer {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be set (≥32 chars) to encrypt settings.");
  }
  return createHash("sha256").update(`o2b-settings-v1:${s}`).digest();
}

/** Returns `v1:<iv_b64>:<tag_b64>:<ct_b64>`. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ct.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const [version, ivB64, tagB64, ctB64] = payload.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !ctB64) {
    throw new Error("Invalid encrypted setting payload.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivB64, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Last-4 hint for the admin UI; never the full value. */
export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 4) return "••••";
  return `••••••••${trimmed.slice(-4)}`;
}
