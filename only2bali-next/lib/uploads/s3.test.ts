import { describe, expect, it } from "vitest";
import { objectUrl, publicUrl, s3Config, s3Configured } from "./s3";

const R2 = {
  S3_ENDPOINT: "https://acct.r2.cloudflarestorage.com",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
  S3_BUCKET_MEDIA: "o2b-media",
  S3_BUCKET_DOCUMENTS: "o2b-documents",
  S3_PUBLIC_BASE_URL: "https://media.only2bali.com",
};

describe("s3 configuration", () => {
  it("configures media and documents from separate buckets", () => {
    expect(s3Config("media", R2)?.bucket).toBe("o2b-media");
    expect(s3Config("documents", R2)?.bucket).toBe("o2b-documents");
  });

  /**
   * The separation is what stops a guessable listing-photo URL from reaching a
   * vendor's passport scan, so neither folder may borrow the other's bucket.
   */
  it("does not let one bucket stand in for the other", () => {
    const mediaOnly = { ...R2, S3_BUCKET_DOCUMENTS: undefined };
    expect(s3Configured("media", mediaOnly)).toBe(true);
    expect(s3Configured("documents", mediaOnly)).toBe(false);
  });

  it("never gives a private document a public URL", () => {
    const documents = s3Config("documents", R2)!;
    expect(documents.publicBaseUrl).toBeNull();
    expect(publicUrl(documents, "providers/v/documents/x.pdf")).toBeNull();
  });

  it("refuses a half-configured store rather than failing at upload time", () => {
    expect(s3Configured("media", { ...R2, S3_SECRET_ACCESS_KEY: undefined })).toBe(false);
    expect(s3Configured("media", { ...R2, S3_ENDPOINT: undefined })).toBe(false);
    expect(s3Configured("media", {})).toBe(false);
  });

  it("defaults the region to what Cloudflare documents, since R2 ignores it", () => {
    expect(s3Config("media", R2)?.region).toBe("auto");
    expect(s3Config("media", { ...R2, S3_REGION: "us-west-004" })?.region).toBe("us-west-004");
  });

  it("tolerates trailing slashes in either URL", () => {
    const config = s3Config("media", {
      ...R2,
      S3_ENDPOINT: "https://acct.r2.cloudflarestorage.com/",
      S3_PUBLIC_BASE_URL: "https://media.only2bali.com/",
    })!;
    expect(objectUrl(config, "a/b.jpg")).toBe("https://acct.r2.cloudflarestorage.com/o2b-media/a/b.jpg");
    expect(publicUrl(config, "a/b.jpg")).toBe("https://media.only2bali.com/a/b.jpg");
  });

  it("serves media from the public domain, not the signing endpoint", () => {
    const config = s3Config("media", R2)!;
    expect(publicUrl(config, "providers/v/media/photo.jpg")).toBe(
      "https://media.only2bali.com/providers/v/media/photo.jpg"
    );
    expect(publicUrl(config, "x.jpg")).not.toContain("r2.cloudflarestorage.com");
  });
});
