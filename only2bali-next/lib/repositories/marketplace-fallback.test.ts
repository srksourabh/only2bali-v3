import { describe, it, expect } from "vitest";
import {
  getFallbackServiceById,
  listFallbackProviders,
  listFallbackServices,
} from "./marketplace-fallback";

describe("marketplace fallback catalogue", () => {
  it("keeps Bali and Jakarta listings so destination chips have data", () => {
    expect(listFallbackServices({ region: "bali" }).length).toBeGreaterThan(0);
    expect(listFallbackServices({ region: "jakarta" }).some((s) => s.city === "Jakarta")).toBe(true);
    expect(listFallbackServices({ region: "jakarta" }).every((s) => s.city === "Jakarta")).toBe(true);
  });

  it("returns a service detail for a fallback id", () => {
    expect(getFallbackServiceById("sample-svc-jain-thali")?.title).toMatch(/thali/i);
  });

  it("lists fallback providers for both destinations", () => {
    expect(listFallbackProviders({ region: "bali" }).length).toBeGreaterThan(0);
    expect(listFallbackProviders({ region: "jakarta" }).some((p) => p.city === "Jakarta")).toBe(true);
  });
});
