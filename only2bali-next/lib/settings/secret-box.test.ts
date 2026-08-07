import { describe, it, expect, beforeAll } from "vitest";
import { decryptSecret, encryptSecret, maskSecret } from "./secret-box";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-that-is-comfortably-over-32-chars";
});

describe("secret-box", () => {
  it("round-trips plaintext", () => {
    const ct = encryptSecret("re_live_abc123");
    expect(ct.startsWith("v1:")).toBe(true);
    expect(decryptSecret(ct)).toBe("re_live_abc123");
  });

  it("produces different ciphertext each time", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("maskSecret only reveals last four", () => {
    expect(maskSecret("re_live_abc123")).toBe("••••••••c123");
    expect(maskSecret("ab")).toBe("••••");
  });
});
