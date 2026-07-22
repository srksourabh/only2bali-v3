import { describe, it, expect } from "vitest";
import { safeNextPath } from "./redirect";

const FALLBACK = "/en/account";

describe("safeNextPath", () => {
  it("honours a same-origin path", () => {
    expect(safeNextPath("/en/planner", FALLBACK)).toBe("/en/planner");
    expect(safeNextPath("/ta/packages?x=1", FALLBACK)).toBe("/ta/packages?x=1");
  });

  it("falls back when absent", () => {
    expect(safeNextPath(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath("", FALLBACK)).toBe(FALLBACK);
  });

  it.each([
    "https://evil.example.com",
    "http://evil.example.com",
    "//evil.example.com",
    "///evil.example.com",
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "/\\evil.example.com", // some browsers treat a backslash as a slash
    "/\\\\evil.example.com",
    "/%2f%2fevil.example.com",
    "en/planner",
    "data:text/html,<script>",
  ])("refuses %s", (attempt) => {
    expect(safeNextPath(attempt, FALLBACK)).toBe(FALLBACK);
  });
});
