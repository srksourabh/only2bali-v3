import { describe, expect, it } from "vitest";
import { generateMockItinerary } from "./planner-mock";
import type { PlannerInput } from "./planner-schema";

const start = new Date("2026-10-12T00:00:00Z");

function base(overrides: Partial<PlannerInput> = {}): PlannerInput {
  return {
    plain_request: "",
    name: "Anita",
    age: 34,
    crew_type: "family",
    number_of_people: 8,
    times_visited_bali: "first_time",
    from_date: "2026-10-12",
    to_date: "2026-10-16",
    international_airport: "Mumbai",
    flight_class: "Economy",
    budget: "comfort",
    food: "vegetarian",
    diet_choices: [],
    kitchen: false,
    cook: false,
    interests: ["Natural Beauty & Beaches"],
    vehicle_type: "Van (12-15 People)",
    rent_period: "Whole Trip",
    include_driver: "Yes",
    preferred_languages: ["Hindi"],
    ...overrides,
  };
}

describe("generateMockItinerary", () => {
  it("changes the plan when food, group, interests or airport change", () => {
    const vegBeach = generateMockItinerary(start, 4, base());
    const jainTemple = generateMockItinerary(
      start,
      4,
      base({
        food: "jain",
        crew_type: "new_couple",
        number_of_people: 2,
        interests: ["Local Cultures & Traditions", "Wellness & Relaxation"],
        international_airport: "Delhi",
        vehicle_type: "Car (5-10 People)",
        preferred_languages: ["Gujarati"],
        plain_request: "Quiet temples and a private pool villa in Ubud.",
      })
    );

    expect(vegBeach.map((d) => d.title).join("|")).not.toBe(jainTemple.map((d) => d.title).join("|"));
    expect(JSON.stringify(vegBeach)).not.toBe(JSON.stringify(jainTemple));
    expect(jainTemple.some((d) => /jain/i.test(JSON.stringify(d.meals)))).toBe(true);
    expect(jainTemple.some((d) => /Ubud|temple|wellness/i.test(JSON.stringify(d.activities)))).toBe(true);
  });

  it("cycles selected interests and carries the trip brief into activity days", () => {
    const plan = generateMockItinerary(start, 6, base({
      interests: ["Natural Beauty & Beaches", "Local Cultures & Traditions", "Wellness & Relaxation"],
      plain_request: "A slow anniversary trip based in Ubud with one beach day.",
    }));
    const middle = plan.slice(1, -1);
    expect(new Set(middle.slice(0, 3).map((day) => day.title)).size).toBe(3);
    expect(middle.every((day) => day.activities.some((item) => item.includes("anniversary")))).toBe(true);
  });
});
