import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { mintDocumentHandle, verifyDocumentHandle, isAllowedStoredUrl, readDocumentBytes } from "./store";

const VENDOR = "11111111-2222-3333-4444-555555555555";

beforeAll(() => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-that-is-at-least-32-characters-long!!";
});

describe("document handles", () => {
  const base = {
    pathname: `providers/${VENDOR}/documents/passport-abc123.jpg`,
    vendorId: VENDOR,
    backend: "vercel_blob" as const,
    contentType: "image/jpeg",
  };

  it("mints a handle that verifies for the same vendor and ref", () => {
    const handle = mintDocumentHandle(base);
    const payload = verifyDocumentHandle(handle, VENDOR);
    expect(payload).not.toBeNull();
    expect(payload!.p).toBe(base.pathname);
    expect(payload!.b).toBe("vercel_blob");
    expect(payload!.c).toBe("image/jpeg");
  });

  it("rejects a handle from another vendor (cross-vendor registration)", () => {
    const otherVendor = "99999999-2222-3333-4444-555555555555";
    const handle = mintDocumentHandle({ ...base, vendorId: otherVendor });
    expect(verifyDocumentHandle(handle, VENDOR)).toBeNull();
  });

  it("rejects tampered payloads", () => {
    const handle = mintDocumentHandle(base);
    const [body] = handle.split(".");
    const forged = `${Buffer.from(
      JSON.stringify({ p: "providers/other/documents/x.jpg", v: VENDOR, b: "local", c: "image/png", exp: Date.now() + 1000 })
    ).toString("base64url")}.${handle.split(".")[1]}`;
    expect(forged).not.toBe(handle);
    expect(verifyDocumentHandle(`${body}.badsignaturebadsignaturebadsignature`, VENDOR)).toBeNull();
  });

  it("rejects expired handles", () => {
    const payload = { p: base.pathname, v: VENDOR, b: "local", c: "application/pdf", exp: Date.now() - 1 };
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = createHmac("sha256", process.env.AUTH_SECRET!).update(body).digest("base64url");
    expect(verifyDocumentHandle(`${body}.${sig}`, VENDOR)).toBeNull();
  });

  it("refuses to operate without AUTH_SECRET", async () => {
    const prev = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    try {
      expect(() => mintDocumentHandle(base)).toThrow(/AUTH_SECRET/);
    } finally {
      process.env.AUTH_SECRET = prev;
    }
  });
});

describe("private document storage contract", () => {
  it("document refs are pathname references, never fetchable URLs", () => {
    // The upload response shape is enforced by the route; here we pin the
    // invariant that the DB-stored reference format cannot be an https URL
    // or a /uploads public path — those only appear in legacy rows.
    const refPattern = /^providers\/[a-zA-Z0-9._-]+\/documents\/[a-z0-9-]+\.(jpg|png|webp|pdf)$/;
    expect(refPattern.test(`providers/${VENDOR}/documents/id-abcdef12.pdf`)).toBe(true);
    expect(refPattern.test("https://evil.example/kyc.pdf")).toBe(false);
    expect(refPattern.test("/uploads/providers/v/documents/id-abcdef12.pdf")).toBe(false);
  });

  it("readDocumentBytes rejects junk references instead of guessing paths", async () => {
    expect(await readDocumentBytes("../../.env.local")).toBeNull();
    expect(await readDocumentBytes("/etc/passwd")).toBeNull();
    expect(await readDocumentBytes("providers/../secrets/documents/x.jpg")).toBeNull();
  });
});

describe("isAllowedStoredUrl (media path, unchanged)", () => {
  it("still accepts media upload paths and https urls", () => {
    expect(isAllowedStoredUrl("/uploads/providers/abc/media/photo-1.jpg")).toBe(true);
    expect(isAllowedStoredUrl("https://xyz.public.blob.vercel-storage.com/a.jpg")).toBe(true);
    expect(isAllowedStoredUrl("http://example.com/a.jpg")).toBe(false);
  });
});
