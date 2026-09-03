import type { ItineraryDay, PlannerInput } from "./planner-schema";

type DayPack = { title: string; activities: string[]; area: string };

const PACKS: Record<string, DayPack> = {
  beach: {
    title: "Seminyak coast and Jimbaran sunset",
    area: "Seminyak",
    activities: [
      "Morning swim or beach club time at Seminyak",
      "Walk the Canggu beach path and stop at a veg-friendly cafe",
      "Evening Jimbaran bay sunset with a reserved Indian table",
    ],
  },
  culture: {
    title: "Ubud temples and craft villages",
    area: "Ubud",
    activities: [
      "Tegallalang rice terraces and a short valley walk",
      "Sacred Monkey Forest and Ubud palace courtyard",
      "Evening Barong or temple dance in an Ubud village hall",
    ],
  },
  wellness: {
    title: "Spa, yoga and quiet Ubud gardens",
    area: "Ubud",
    activities: [
      "Sunrise yoga or pranayama in the villa garden",
      "Balinese wellness treatment at a quiet spa",
      "Slow afternoon by a private pool with herbal tea",
    ],
  },
  wedding: {
    title: "Cliff backdrops and pre-wedding frames",
    area: "Uluwatu",
    activities: [
      "Golden-hour portraits at a cliff temple lookout",
      "Outfit change stop at a private villa lawn",
      "Sunset Kecak performance as a ceremony backdrop",
    ],
  },
  adventure: {
    title: "Tanjung Benoa water sports",
    area: "Nusa Dua",
    activities: [
      "Banana boat, parasailing or jet ski at Tanjung Benoa",
      "Optional glass-bottom boat to the near-shore reef",
      "Recovery swim at Nusa Dua beach",
    ],
  },
  culinary: {
    title: "Indian and Balinese kitchen trail",
    area: "Seminyak",
    activities: [
      "Market walk for spices, fruit and coconut produce",
      "Hands-on vegetarian cooking session with a local cook",
      "Dinner at a dedicated Indian kitchen with labelled protocols",
    ],
  },
  shopping: {
    title: "Seminyak boutiques and art markets",
    area: "Seminyak",
    activities: [
      "Morning at Seminyak Square and independent boutiques",
      "Kuta Art Market for souvenirs and batik",
      "Optional silver workshop stop in Celuk",
    ],
  },
  luxury: {
    title: "Private villa day and fine dining",
    area: "Nusa Dua",
    activities: [
      "Late breakfast in a private pool villa",
      "Chauffeured lookout stops without a packed schedule",
      "Chef-prepared protocol dinner on the villa terrace",
    ],
  },
};

function hash32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function foodLabel(food: PlannerInput["food"]): string {
  switch (food) {
    case "jain":
      return "100% Jain (no onion, garlic or root vegetables)";
    case "vegan":
      return "Vegan";
    case "satvik":
      return "Satvik vegetarian";
    case "eggetarian":
      return "Eggetarian";
    case "halal":
      return "Halal";
    case "non_veg":
      return "Non-vegetarian with labelled veg options";
    default:
      return "Strict Vegetarian";
  }
}

function hotelClass(budget: PlannerInput["budget"]): string {
  if (budget === "premium") return "5-star private pool villa";
  if (budget === "economical") return "3-star deluxe hotel";
  return "4-star boutique resort";
}

function interestKeys(interests: string[], plain: string): Array<keyof typeof PACKS> {
  const blob = `${interests.join(" ")} ${plain}`.toLowerCase();
  const keys: Array<keyof typeof PACKS> = [];
  if (/beach|natural|coast|sea/.test(blob)) keys.push("beach");
  if (/culture|temple|tradition/.test(blob)) keys.push("culture");
  if (/wellness|spa|yoga|relax/.test(blob)) keys.push("wellness");
  if (/wedding|pre-wedding|shoot|photo/.test(blob)) keys.push("wedding");
  if (/adventure|water sport|trek/.test(blob)) keys.push("adventure");
  if (/culin|taste|food|kitchen/.test(blob)) keys.push("culinary");
  if (/shop/.test(blob)) keys.push("shopping");
  if (/luxury|unique|villa/.test(blob)) keys.push("luxury");
  return keys.length ? keys : ["beach", "culture"];
}

function crewPace(crew: string): string {
  if (/couple/.test(crew)) return "private couple pace";
  if (/family/.test(crew)) return "family-friendly pace";
  if (/corporate|business|team/.test(crew)) return "group-event pace";
  return "friends-group pace";
}

function isoDate(start: Date, dayIndex: number): string {
  const current = new Date(start.getTime() + dayIndex * 24 * 60 * 60 * 1000);
  if (Number.isNaN(current.getTime())) return new Date().toISOString().slice(0, 10);
  return current.toISOString().slice(0, 10);
}

/**
 * Curated itinerary used when Gemini is missing or times out.
 * Input fields must change the plan — testers compare two briefs.
 */
export function generateMockItinerary(start: Date, days: number, body: PlannerInput): ItineraryDay[] {
  const food = foodLabel(body.food);
  const hotel = hotelClass(body.budget);
  const guide = body.preferred_languages[0] || "English";
  const airport = body.international_airport || "Delhi or Mumbai";
  const vehicle = body.vehicle_type || "private van";
  const plain = body.plain_request.trim();
  const keys = interestKeys(body.interests, plain);
  const people = body.number_of_people;
  const pace = crewPace(body.crew_type);
  const dailyCost = body.budget === "premium" ? 10000 : body.budget === "economical" ? 3500 : 6000;
  const seed = [
    body.name,
    body.food,
    body.budget,
    body.crew_type,
    String(people),
    airport,
    vehicle,
    guide,
    keys.join(","),
    plain,
  ].join("|");

  const result: ItineraryDay[] = [];
  const n = Math.max(1, days);

  for (let i = 0; i < n; i++) {
    const date = isoDate(start, i);
    if (i === 0) {
      result.push({
        day: 1,
        date,
        title: plain
          ? `${body.name}'s arrival -- ${plain.slice(0, 48)}${plain.length > 48 ? "..." : ""}`
          : `Arrive from ${airport} · ${people} pax · ${pace}`,
        activities: [
          ...(plain ? [`Trip brief: ${plain.slice(0, 180)}${plain.length > 180 ? "..." : ""}`] : []),
          `Arrive at Ngurah Rai from ${airport} (${body.flight_class})`,
          `Meet a ${guide}-speaking guide and a ${vehicle} for ${people} travellers`,
          `Transfer to ${hotel} and settle at a ${pace}`,
          body.cook ? "Confirm the accompanying cook's first protocol meal" : "Confirm tonight's protocol restaurant reservation",
        ],
        meals: {
          breakfast: "In-flight catering",
          lunch: "Welcome refreshments on arrival",
          dinner: `Welcome dinner prepared to ${food} standard`,
        },
        transport: `Private ${vehicle} from airport, driver ${body.include_driver === "Yes" ? "included" : "not included"}`,
        accommodation: `${hotel} near Seminyak`,
        estimated_cost_inr: dailyCost,
      });
      continue;
    }

    if (i === n - 1 && n > 1) {
      result.push({
        day: i + 1,
        date,
        title: `Last morning in Bali · fly back via ${airport}`,
        activities: [
          `${pace} checkout from ${hotel}`,
          keys.includes("shopping")
            ? "Final souvenir stop at Seminyak Square"
            : "Quiet resort morning before transfer",
          "Private transfer to Ngurah Rai with luggage space for the group",
          `Board the return flight toward ${airport}`,
        ],
        meals: {
          breakfast: `Resort breakfast with a dedicated ${food} counter`,
          lunch: `Packed ${food} lunch if the flight is after noon`,
          dinner: "In-flight catering",
        },
        transport: `Private ${vehicle} to the airport`,
        accommodation: "Flight back home",
        estimated_cost_inr: dailyCost,
      });
      continue;
    }

    const pack = PACKS[keys[(hash32(`${seed}:${i}`) + i) % keys.length]!] ?? PACKS.culture;
    result.push({
      day: i + 1,
      date,
      title: `${pack.title} · ${people} pax`,
      activities: pack.activities.map((line) => `${line} (${pace}, ${guide} guide)`),
      meals: {
        breakfast: `${hotel} breakfast — ${food}`,
        lunch: `${pack.area} lunch reserved as ${food}`,
        dinner: `${pack.area} dinner reserved as ${food}`,
      },
      transport: `Private ${vehicle} with ${guide}-speaking guide`,
      accommodation: `${hotel} in ${pack.area}`,
      estimated_cost_inr: dailyCost,
    });
  }

  return result;
}
