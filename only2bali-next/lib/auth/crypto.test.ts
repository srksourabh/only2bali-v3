import { describe, it, expect, beforeAll } from "vitest";
import {
  generateOtp, hashOtp, safeEqual, generateSessionToken, hashSessionToken,
} from "./crypto";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-that-is-comfortably-over-32-chars";
});

describe("generateOtp", () => {
  it("is always six digits", () => {
    for (let i = 0; i < 500; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it("covers the full range including leading zeros", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 3000; i++) seen.add(generateOtp());
    // A generator that never produced a leading zero would be a smaller
    // keyspace than advertised.
    expect([...seen].some((c) => c.startsWith("0"))).toBe(true);
    expect(seen.size).toBeGreaterThan(2000);
  });
});

describe("hashOtp", () => {
  it("never returns the code itself", () => {
    const code = "123456";
    const hash = hashOtp(code, "email:a@b.com");
    expect(hash).not.toContain(code);
    expect(hash).toHaveLength(64);
  });

  it("is deterministic for the same code and identifier", () => {
    expect(hashOtp("123456", "email:a@b.com")).toBe(hashOtp("123456", "email:a@b.com"));
  });

  it("binds the code to the identifier", () => {
    // Otherwise a code issued for one address could be replayed against another.
    expect(hashOtp("123456", "email:a@b.com")).not.toBe(hashOtp("123456", "email:c@d.com"));
  });

  it("differs for different codes", () => {
    expect(hashOtp("123456", "x")).not.toBe(hashOtp("123457", "x"));
  });

  it("refuses to run without a strong AUTH_SECRET", () => {
    const original = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "short";
    expect(() => hashOtp("123456", "x")).toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = "";
    expect(() => hashOtp("123456", "x")).toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = original;
  });
});

describe("safeEqual", () => {
  it("matches identical strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
  });

  it("rejects different strings of equal length", () => {
    expect(safeEqual("abc", "abd")).toBe(false);
  });

  it("rejects different lengths without throwing", () => {
    expect(safeEqual("abc", "abcdef")).toBe(false);
    expect(safeEqual("", "a")).toBe(false);
  });
});

describe("session tokens", () => {
  it("are long, URL-safe and unique", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const t = generateSessionToken();
      expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(t.length).toBeGreaterThanOrEqual(43); // 256 bits, base64url
      seen.add(t);
    }
    expect(seen.size).toBe(500);
  });

  it("hash to a stable value that is not the token", () => {
    const t = generateSessionToken();
    const h = hashSessionToken(t);
    expect(h).toHaveLength(64);
    expect(h).not.toBe(t);
    expect(hashSessionToken(t)).toBe(h);
  });
});
