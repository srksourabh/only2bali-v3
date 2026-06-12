import { describe, it, expect } from "vitest";
import { recommend, validatePlannerInput, type PlannerInput } from "./recommend";

const base: PlannerInput = {
  city: "Mumbai", month: "October", size: 12, budget: "premium",
  food: "jain", lang: "Gujarati", kitchen: true, cook: true,
  interests: ["temples", "wellness"],
};

describe("recommend()", () => {
  it("never shows a package that violates the food protocol (hard filter)", () => {
    for (const food of ["jain", "vegetarian", "vegan"] as const) {
      const recs = recommend({ ...base, food });
      expect(recs.length).toBeGreaterThan(0);
      recs.forEach((r) => expect(r.pkg.protocols).toContain(food));
    }
  });

  it("returns at most 3, sorted by descending score", () => {
    const recs = recommend(base);
    expect(recs.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < recs.length; i++)
      expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
  });

  it("Jain premium temple group → Sattvik Serenity ranks first", () => {
    expect(recommend(base)[0].pkg.id).toBe("sattvik");
  });

  it("Brahmin temple tour (vegetarian, comfort, Tamil) → Temple & Tranquility first", () => {
    const recs = recommend({ ...base, food: "vegetarian", budget: "comfort", lang: "Tamil", size: 15, interests: ["temples", "culture"] });
    expect(recs[0].pkg.id).toBe("temple");
  });

  it("cook bonus only applies at 10+ pax", () => {
    const small = recommend({ ...base, size: 6 });
    const large = recommend({ ...base, size: 12 });
    expect(large[0].score).toBeGreaterThan(small[0].score);
  });

  it("vegan couple's group (vegan, economical, Bengaluru) -> Active Bali first", () => {
    const recs = recommend({
      ...base,
      food: "vegan",
      budget: "economical",
      size: 10,
      interests: ["adventure", "beaches"],
      cook: false,
      kitchen: false,
      lang: "English",
    });
    expect(recs[0].pkg.id).toBe("adventure");
  });
});

describe("validatePlannerInput()", () => {
  it("rejects cook request under 10 pax", () => {
    expect(validatePlannerInput({ ...base, size: 6, cook: true })).toMatch(/10\+/);
  });
  it("accepts a complete valid input", () => {
    expect(validatePlannerInput(base)).toBeNull();
  });
  it("rejects missing required fields", () => {
    expect(validatePlannerInput({ ...base, city: "" })).not.toBeNull();
  });
});
