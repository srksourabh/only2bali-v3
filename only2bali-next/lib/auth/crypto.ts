import { createHmac, randomBytes, randomInt, timingSafeEqual, createHash } from "node:crypto";

/**
 * Secret used to key the OTP and session hashes. Kept separate from any other
 * secret so rotating it invalidates outstanding codes and sessions without
 * touching anything else.
 */
function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set and at least 32 characters. Generate one with: openssl rand -base64 48"
    );
  }
  return s;
}

/** Six digits, uniformly distributed. `randomInt` is rejection-sampled, `Math.random` is not. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * HMAC rather than a bare hash: a plain SHA-256 of a six-digit code is trivially
 * reversible with a rainbow table of one million entries. The key makes the
 * stored value useless to anyone who only has the database.
 */
export function hashOtp(code: string, identifier: string): string {
  return createHmac("sha256", authSecret())
    .update(`${identifier}:${code}`)
    .digest("hex");
}

/** Constant-time. A length mismatch is reported as a mismatch, not an early return. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) {
    // Still burn a comparison so timing does not leak the length difference.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

/** 256 bits of entropy, URL-safe. This is the value the browser holds. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Sessions are stored as a hash, so a database leak does not hand over live
 * sessions. Unkeyed SHA-256 is fine here — the input is already 256 random bits,
 * so there is nothing to brute-force.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
