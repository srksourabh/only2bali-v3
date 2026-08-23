import { describe, expect, it } from "vitest";
import { portalHomePath } from "./portal";

describe("portalHomePath", () => {
  it.each([
    ["traveller", "/en/account"],
    ["vendor", "/en/provider"],
    ["admin", "/en/admin"],
  ] as const)("routes %s to its own portal", (role, expected) => {
    expect(portalHomePath(role, "en")).toBe(expected);
  });
});
