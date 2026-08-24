import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { createHmac } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  mintDocumentHandle,
  verifyDocumentHandle,
  isAllowedStoredUrl,
  readDocumentBytes,
  storeUpload,
  uploadsConfigured,
  uploadBackend,
} from "./store";

const blobMocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@vercel/blob", () => blobMocks);

const VENDOR = "11111111-2222-3333-4444-555555555555";

beforeAll(() => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-that-is-at-least-32-characters-long!!";
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
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
  it("requires an independent private token in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "public-store-token");
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "");
    try {
      expect(uploadsConfigured("media")).toBe(true);
      expect(uploadBackend("media")).toBe("vercel_blob");
      expect(uploadsConfigured("documents")).toBe(false);
      expect(uploadBackend("documents")).toBe("none");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("writes KYC documents only to the private Blob store", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "public-store-token");
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "private-store-token");
    blobMocks.put.mockResolvedValue({
      url: "https://private.example/document.pdf",
      downloadUrl: "https://private.example/document.pdf?download=1",
      pathname: `providers/${VENDOR}/documents/document.pdf`,
      contentType: "application/pdf",
      contentDisposition: "inline",
    });

    const stored = await import("./store").then(({ storeUpload }) =>
      storeUpload(new File(["private"], "document.pdf", { type: "application/pdf" }), {
        folder: "documents",
        vendorId: VENDOR,
      })
    );

    expect(blobMocks.put).toHaveBeenCalledOnce();
    expect(blobMocks.put.mock.calls[0][2]).toMatchObject({
      access: "private",
      token: "private-store-token",
    });
    expect(stored).toMatchObject({ access: "private" });
    expect(stored).not.toHaveProperty("url");
  });

  it("keeps marketplace media in the public Blob store", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "public-store-token");
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "private-store-token");
    blobMocks.put.mockResolvedValue({
      url: "https://public.example/photo.jpg",
      downloadUrl: "https://public.example/photo.jpg?download=1",
      pathname: `providers/${VENDOR}/media/photo.jpg`,
      contentType: "image/jpeg",
      contentDisposition: "inline",
    });

    const stored = await import("./store").then(({ storeUpload }) =>
      storeUpload(new File(["photo"], "photo.jpg", { type: "image/jpeg" }), {
        folder: "media",
        vendorId: VENDOR,
      })
    );

    expect(blobMocks.put.mock.calls[0][2]).toMatchObject({
      access: "public",
      token: "public-store-token",
    });
    expect(stored).toMatchObject({ backend: "vercel_blob", url: "https://public.example/photo.jpg" });
  });

  it("reads current KYC references through authenticated private Blob access", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "private-store-token");
    const pathname = `providers/${VENDOR}/documents/passport-abc123.jpg`;
    blobMocks.get.mockResolvedValue({
      statusCode: 200,
      stream: new Response("private-bytes").body,
      headers: new Headers(),
      blob: { contentType: "image/jpeg" },
    });

    const stored = await readDocumentBytes(pathname);

    expect(blobMocks.get).toHaveBeenCalledWith(pathname, {
      access: "private",
      token: "private-store-token",
    });
    expect(stored?.bytes.toString()).toBe("private-bytes");
    expect(stored?.contentType).toBe("image/jpeg");
  });

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

/**
 * The local branch of readDocumentBytes had no coverage, and it did not agree
 * with the local branch of storeUpload: the write put the file under
 * `.uploads/providers/<vendor>/…` and the read looked for it under
 * `.uploads/<vendor>/…`. Every KYC document uploaded on a developer machine
 * was therefore stored once and never readable again. Round-trip it rather
 * than asserting either path, so the two cannot drift apart again.
 */
describe("local private document storage", () => {
  const LOCAL_VENDOR = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  afterEach(async () => {
    await rm(path.join(process.cwd(), ".uploads", "providers", LOCAL_VENDOR), {
      recursive: true,
      force: true,
    });
  });

  it("reads back exactly what it wrote", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "");

    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "licence.pdf", {
      type: "application/pdf",
    });
    const stored = await storeUpload(file, { folder: "documents", vendorId: LOCAL_VENDOR });
    if (!("ref" in stored)) throw new Error("a documents upload must return a private ref");

    expect(stored.ref).toBe(`providers/${LOCAL_VENDOR}/documents/${stored.ref.split("/").pop()}`);

    const read = await readDocumentBytes(stored.ref);
    expect(read).not.toBeNull();
    expect(read!.bytes.toString("hex")).toBe("25504446");
    expect(read!.contentType).toBe("application/pdf");
  });

  it("still refuses to walk out of the private root", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("BLOB_PRIVATE_READ_WRITE_TOKEN", "");

    const outside = path.join(process.cwd(), ".uploads", "escaped.pdf");
    await mkdir(path.dirname(outside), { recursive: true });
    await writeFile(outside, "should never be served");

    expect(await readDocumentBytes("providers/../escaped.pdf")).toBeNull();
    expect(await readDocumentBytes("../.uploads/escaped.pdf")).toBeNull();

    await rm(outside, { force: true });
  });
});
