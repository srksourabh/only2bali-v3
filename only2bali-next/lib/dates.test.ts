import { describe, expect, it } from "vitest";
import { formatDateDdMmYyyy, parseDateDdMmYyyy } from "./dates";

describe("formatDateDdMmYyyy", () => {
  it("turns an ISO calendar date into dd-mm-yyyy", () => {
    expect(formatDateDdMmYyyy("2026-08-24")).toBe("24-08-2026");
  });

  it("keeps a time suffix off the formatted date", () => {
    expect(formatDateDdMmYyyy("2026-01-09T00:00:00.000Z")).toBe("09-01-2026");
  });
});

describe("parseDateDdMmYyyy", () => {
  it("parses a valid Indian-format date to ISO", () => {
    expect(parseDateDdMmYyyy("24-08-2026")).toBe("2026-08-24");
  });

  it("rejects an impossible calendar date", () => {
    expect(parseDateDdMmYyyy("31-02-2026")).toBeNull();
  });
});
