import { describe, expect, it } from "vitest";
import { namedTravellersFitGroup } from "./booking-travellers";

describe("namedTravellersFitGroup", () => {
  it("accepts only the lead for an 8-person group", () => {
    expect(namedTravellersFitGroup(8, 1)).toBe(true);
  });

  it("rejects more names than seats", () => {
    expect(namedTravellersFitGroup(2, 3)).toBe(false);
  });

  it("rejects an empty name list", () => {
    expect(namedTravellersFitGroup(8, 0)).toBe(false);
  });
});
