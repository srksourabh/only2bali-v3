import { describe, it, expect } from "vitest";
import { isAllowedStoredUrl } from "./store";

describe("isAllowedStoredUrl", () => {
  it("accepts local upload paths under /uploads/providers", () => {
    expect(isAllowedStoredUrl("/uploads/providers/abc/media/photo-1.jpg")).toBe(true);
  });

  it("rejects path traversal and non-provider uploads", () => {
    expect(isAllowedStoredUrl("/uploads/../secret.txt")).toBe(false);
    expect(isAllowedStoredUrl("/uploads/other/x.jpg")).toBe(false);
  });

  it("accepts https blob or CDN urls", () => {
    expect(isAllowedStoredUrl("https://xyz.public.blob.vercel-storage.com/a.jpg")).toBe(true);
  });

  it("rejects http and junk", () => {
    expect(isAllowedStoredUrl("http://example.com/a.jpg")).toBe(false);
    expect(isAllowedStoredUrl("not-a-url")).toBe(false);
  });
});
