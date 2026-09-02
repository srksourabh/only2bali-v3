import { describe, expect, it } from "vitest";
import { safePostSignInDestination } from "./navigation";

describe("safePostSignInDestination", () => {
  it("keeps valid same-locale destinations", () => {
    expect(safePostSignInDestination("/en/account?tab=bookings", "en", "traveller"))
      .toBe("/en/account?tab=bookings");
  });

  it("rejects external and cross-locale redirects", () => {
    expect(safePostSignInDestination("//evil.example", "en", "traveller")).toBe("/en/account");
    expect(safePostSignInDestination("https://evil.example", "en", "traveller")).toBe("/en/account");
    expect(safePostSignInDestination("/hi/account", "en", "traveller")).toBe("/en/account");
  });

  it("uses the provider workspace for vendor fallback", () => {
    expect(safePostSignInDestination(null, "en", "vendor")).toBe("/en/provider");
  });
});
