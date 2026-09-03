import { PROTOCOLS } from "@/lib/protocols";
import { z } from "zod";

/** Hard cap on the request body. Rejected before any parsing or model call. */
export const MAX_BODY_BYTES = 16 * 1024;

/** How long the model gets before we abandon it and serve the curated itinerary. */
export const MODEL_TIMEOUT_MS = 20_000;

/** Trip length we are willing to generate. Bounds the prompt and the response. */
export const MAX_DAYS = 30;

const shortText = z.string().trim().max(240);

function blankToUndef(value: unknown): unknown {
  if (value === null) return undefined;
  if (typeof value === "number" && Number.isNaN(value)) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

function aliasFood(value: unknown): unknown {
  const cleaned = blankToUndef(value);
  if (typeof cleaned !== "string") return cleaned;
  const key = cleaned.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, string> = {
    veg: "vegetarian",
    vegetarian: "vegetarian",
    jain: "jain",
    vegan: "vegan",
    satvik: "satvik",
    sattvic: "satvik",
    eggetarian: "eggetarian",
    egg: "eggetarian",
    halal: "halal",
    non_veg: "non_veg",
    nonveg: "non_veg",
  };
  return aliases[key] ?? key;
}

export const plannerInputSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const obj: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  for (const key of Object.keys(obj)) {
    obj[key] = blankToUndef(obj[key]);
  }
  obj.food = aliasFood(obj.food);
  if (typeof obj.number_of_people === "number" && obj.number_of_people < 1) {
    delete obj.number_of_people;
  }
  if (typeof obj.plain_request === "string" && obj.plain_request.length > 8000) {
    obj.plain_request = obj.plain_request.slice(0, 8000);
  }
  return obj;
}, z.object({
  plain_request: z.string().trim().max(8000).default(""),
  name: shortText.default("Traveler"),
  age: z.union([z.string().trim().max(10), z.number()]).optional(),
  crew_type: shortText.default("friends_get_together"),
  number_of_people: z.coerce.number().int().min(1).max(200).default(2),
  times_visited_bali: shortText.default("first_time"),
  from_date: z.string().trim().max(40).default(""),
  to_date: z.string().trim().max(40).default(""),
  international_airport: shortText.default(""),
  flight_class: shortText.default("Economy"),
  budget: z.enum(["economical", "comfort", "premium"]).default("comfort"),
  food: z.enum(PROTOCOLS).catch("vegetarian").default("vegetarian"),
  diet_choices: z.array(shortText).max(20).default([]),
  kitchen: z.coerce.boolean().default(false),
  cook: z.coerce.boolean().default(false),
  interests: z.array(shortText).max(20).default([]),
  vehicle_type: shortText.default("car"),
  rent_period: shortText.default("1-2 Days"),
  include_driver: shortText.default("Yes"),
  preferred_languages: z.array(shortText).max(10).default(["English"]),
}));

export type PlannerInput = z.infer<typeof plannerInputSchema>;

/**
 * Shape the model must return. Anything else is treated as a failed generation
 * and falls back to the curated itinerary — a malformed response must never
 * reach the client as if it were a real plan.
 */
export const itineraryDaySchema = z.object({
  day: z.coerce.number().int().min(1),
  date: z.string().trim().max(40),
  title: z.string().trim().min(1).max(300),
  activities: z.array(z.string().trim().max(1000)).min(1).max(20),
  meals: z.object({
    breakfast: z.string().trim().max(1000),
    lunch: z.string().trim().max(1000),
    dinner: z.string().trim().max(1000),
  }),
  transport: z.string().trim().max(1000),
  accommodation: z.string().trim().max(1000),
  estimated_cost_inr: z.coerce.number().min(0).max(10_000_000),
});

export const itinerarySchema = z.array(itineraryDaySchema).min(1).max(MAX_DAYS);

export type ItineraryDay = z.infer<typeof itineraryDaySchema>;

/** Days between two dates, inclusive, clamped to something we will actually generate. */
export function dayCountBetween(start: Date, end: Date): number {
  const raw = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (!Number.isFinite(raw)) return 1;
  return Math.min(MAX_DAYS, Math.max(1, raw));
}

/** Strips a ```json fence if the model wrapped its output in one. */
export function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  const firstLineBreak = trimmed.indexOf("\n");
  const lastFence = trimmed.lastIndexOf("```");
  if (firstLineBreak === -1 || lastFence <= firstLineBreak) return trimmed;
  return trimmed.substring(firstLineBreak + 1, lastFence).trim();
}

/**
 * Parses and validates a model response.
 * Returns null on any failure — callers fall back to the curated itinerary.
 */
export function parseItinerary(raw: string): ItineraryDay[] | null {
  try {
    const parsed = JSON.parse(stripCodeFence(raw));
    const result = itinerarySchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
