import { describe, it, expect } from "vitest";
import {
  MAX_DAYS,
  dayCountBetween,
  parseItinerary,
  plannerInputSchema,
  stripCodeFence,
} from "./planner-schema";

const validDay = {
  day: 1,
  date: "2026-09-12",
  title: "Arrive in Bali",
  activities: ["Airport pickup", "Check in"],
  meals: { breakfast: "In-flight", lunch: "Thali", dinner: "Jain buffet" },
  transport: "Private AC vehicle",
  accommodation: "4-star resort, Seminyak",
  estimated_cost_inr: 6500,
};

describe("plannerInputSchema", () => {
  it("applies defaults to an empty body", () => {
    const result = plannerInputSchema.parse({});
    expect(result.food).toBe("vegetarian");
    expect(result.budget).toBe("comfort");
    expect(result.number_of_people).toBe(2);
  });

  it("maps common food aliases instead of rejecting the trip", () => {
    expect(plannerInputSchema.parse({ food: "veg" }).food).toBe("vegetarian");
    expect(plannerInputSchema.parse({ food: "non-veg" }).food).toBe("non_veg");
  });

  it("accepts a plain-English brief with empty optional numbers", () => {
    const parsed = plannerInputSchema.safeParse({
      plain_request: "Eight friends from Mumbai, vegetarian food, van with driver, 5 nights in October.",
      name: "Anita",
      age: null,
      number_of_people: 0,
      from_date: "2026-10-12",
      to_date: "2026-10-17",
      international_airport: "Chhatrapati Shivaji Maharaj International Airport (Mumbai)",
      food: "vegetarian",
      budget: "comfort",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.number_of_people).toBe(2);
  });

  it("rejects an unknown budget tier", () => {
    expect(plannerInputSchema.safeParse({ budget: "luxury" }).success).toBe(false);
  });

  it("rejects an absurd group size", () => {
    expect(plannerInputSchema.safeParse({ number_of_people: 100000 }).success).toBe(false);
  });

  it("rejects oversized free text rather than passing it to the model", () => {
    expect(plannerInputSchema.safeParse({ name: "x".repeat(5000) }).success).toBe(false);
  });

  it("caps array inputs", () => {
    const tooMany = Array.from({ length: 50 }, (_, i) => `interest-${i}`);
    expect(plannerInputSchema.safeParse({ interests: tooMany }).success).toBe(false);
  });
});

describe("stripCodeFence", () => {
  it("removes a json code fence", () => {
    expect(stripCodeFence('```json\n[{"a":1}]\n```')).toBe('[{"a":1}]');
  });

  it("leaves unfenced text alone", () => {
    expect(stripCodeFence('  [{"a":1}]  ')).toBe('[{"a":1}]');
  });
});

describe("parseItinerary", () => {
  it("accepts a well-formed itinerary", () => {
    const parsed = parseItinerary(JSON.stringify([validDay]));
    expect(parsed).not.toBeNull();
    expect(parsed).toHaveLength(1);
    expect(parsed![0].title).toBe("Arrive in Bali");
  });

  it("accepts a fenced well-formed itinerary", () => {
    expect(parseItinerary("```json\n" + JSON.stringify([validDay]) + "\n```")).not.toBeNull();
  });

  it("returns null for unparseable text so the caller falls back", () => {
    expect(parseItinerary("I'm sorry, I can't help with that.")).toBeNull();
  });

  it("returns null when the model returns an object instead of an array", () => {
    expect(parseItinerary(JSON.stringify(validDay))).toBeNull();
  });

  it("returns null when a day is missing its meals", () => {
    const { meals, ...withoutMeals } = validDay;
    expect(parseItinerary(JSON.stringify([withoutMeals]))).toBeNull();
  });

  it("returns null when a day has no activities", () => {
    expect(parseItinerary(JSON.stringify([{ ...validDay, activities: [] }]))).toBeNull();
  });

  it("returns null for an empty array", () => {
    expect(parseItinerary("[]")).toBeNull();
  });

  it("returns null for an itinerary longer than the cap", () => {
    const tooLong = Array.from({ length: MAX_DAYS + 1 }, (_, i) => ({ ...validDay, day: i + 1 }));
    expect(parseItinerary(JSON.stringify(tooLong))).toBeNull();
  });
});

describe("dayCountBetween", () => {
  it("counts inclusive days", () => {
    expect(dayCountBetween(new Date("2026-09-12"), new Date("2026-09-17"))).toBe(6);
  });

  it("never returns less than one", () => {
    expect(dayCountBetween(new Date("2026-09-17"), new Date("2026-09-12"))).toBe(1);
  });

  it("clamps an absurd range instead of generating forever", () => {
    expect(dayCountBetween(new Date("2026-01-01"), new Date("2030-01-01"))).toBe(MAX_DAYS);
  });

  it("survives an invalid date", () => {
    expect(dayCountBetween(new Date("nonsense"), new Date("2026-09-17"))).toBe(1);
  });
});
