import { describe, it, expect } from "vitest";
import { isPubliclyVisibleProvider } from "./providers-public";

describe("isPubliclyVisibleProvider", () => {
  it("allows verified providers only", () => {
    expect(isPubliclyVisibleProvider("verified")).toBe(true);
  });

  it("hides draft, pending, rejected and suspended", () => {
    expect(isPubliclyVisibleProvider("draft")).toBe(false);
    expect(isPubliclyVisibleProvider("pending")).toBe(false);
    expect(isPubliclyVisibleProvider("rejected")).toBe(false);
    expect(isPubliclyVisibleProvider("suspended")).toBe(false);
  });
});
