import { describe, expect, it } from "vitest";
import { isUuid, uuidFromSeed } from "./fallback-listings";

describe("uuidFromSeed", () => {
  it("returns a stable UUID v5-shaped id", () => {
    const a = uuidFromSeed("only2bali-fallback-listing:sample-svc-jain-thali");
    const b = uuidFromSeed("only2bali-fallback-listing:sample-svc-jain-thali");
    expect(a).toBe(b);
    expect(isUuid(a)).toBe(true);
  });

  it("changes when the listing seed changes", () => {
    expect(uuidFromSeed("listing:a")).not.toBe(uuidFromSeed("listing:b"));
  });
});
