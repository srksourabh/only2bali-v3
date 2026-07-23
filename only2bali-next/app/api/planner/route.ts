import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  MAX_BODY_BYTES,
  MODEL_TIMEOUT_MS,
  dayCountBetween,
  parseItinerary,
  plannerInputSchema,
} from "@/lib/planner-schema";
import { clientKey } from "@/lib/rate-limit";
import { rateLimitShared } from "@/lib/rate-limit-db";

/** 10 generations per IP per 10 minutes. This route calls a paid model. */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const limit = await rateLimitShared(`planner:${clientKey(req)}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many itinerary requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Request body too large." },
        { status: 413 }
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const parsed = plannerInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid trip details.",
          fields: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const {
      name,
      age,
      crew_type,
      number_of_people,
      from_date,
      to_date,
      international_airport,
      flight_class,
      budget,
      food,
      diet_choices,
      kitchen,
      cook,
      interests,
      vehicle_type,
      rent_period,
      include_driver,
      preferred_languages,
    } = body;

    const parsedStart = from_date ? new Date(from_date) : new Date();
    const start = Number.isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
    const parsedEnd = to_date ? new Date(to_date) : new Date(start.getTime() + 4 * 24 * 60 * 60 * 1000);
    const end = Number.isNaN(parsedEnd.getTime())
      ? new Date(start.getTime() + 4 * 24 * 60 * 60 * 1000)
      : parsedEnd;
    const dayCount = dayCountBetween(start, end);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY not configured, returning mock fallback itinerary");
      return NextResponse.json({
        success: true,
        isMock: true,
        itinerary: generateMockItinerary(start, dayCount, body)
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash if possible, fallback to gemini-2.0-flash or gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a premium Bali travel architect specializing in group travels from India. 
Create a highly customized day-by-day itinerary based on the user's selections.

Trip details:
- Lead Traveler Name: ${name} (Age: ${age})
- Travel Dates: ${from_date} to ${to_date} (${dayCount} days)
- Group Size: ${number_of_people} pax (Crew: ${crew_type})
- Departure Airport in India: ${international_airport} (Flight Class: ${flight_class})
- Budget Tier: ${budget} (Target per-person per-day spending. economical: ₹3000-5000/day, comfort: ₹5000-8000/day, premium: ₹8000+/day ex-flights)
- Diet Protocol: ${food} (Jain, vegetarian, or vegan). THIS IS AN INDIAN GROUP.
- Specific dietary tastes/sub-categories: ${diet_choices.join(", ")}
- Special stay requirements: ${kitchen ? "Stay with private kitchen access" : "Standard hotel stay"}
- Accompanying Cook service: ${cook ? "Accompanying Indian chef needed (10+ people)" : "Standard local Indian dining"}
- Interests/Vibe cards: ${interests.join(", ")}
- Transport choice: ${vehicle_type} (duration: ${rent_period}, with local driver: ${include_driver})
- Guide languages: ${preferred_languages.join(", ")}

Focus on:
1. Validating the diet preference: Make sure ALL lunch & dinners explicitly state they are 100% compliant with "${food}" (especially if Jain, specify no onion, garlic, or root vegetables). Mention specific Balinese Indian restaurants (like Ganesha Ek Sanskriti, Queen's Tandoor, Indian Delights) or chef-prepared buffet items.
2. Incorporate the selected Interest activities (such as beach visits, temple excursions, spa/wellness, wedding backdrops, trekking).
3. Accommodations must align with budget tier: Economical (3-star hotels/guesthouses), Comfort (4-star resort or boutique villas), Premium (5-star private pool luxury villas).
4. Address the group size in transportation notes (e.g. private AC Coach/bus for large groups, minivan for medium, private cars for couples).

Return ONLY a valid JSON array of days. No markdown, no comments, no explanation. Just the raw JSON block.
Each day object in the array must look exactly like this:
{
  "day": 1,
  "date": "YYYY-MM-DD",
  "title": "Brief day summary headline",
  "activities": ["Activity 1 details", "Activity 2 details", "Activity 3 details"],
  "meals": {
    "breakfast": "Specific vegetarian/Jain breakfast description",
    "lunch": "Specific vegetarian/Jain lunch restaurant/meal description",
    "dinner": "Specific vegetarian/Jain dinner description"
  },
  "transport": "Daily private transport description",
  "accommodation": "Recommended hotel/villa name (and area, e.g. Ubud/Seminyak/Nusa Dua)",
  "estimated_cost_inr": 6500
}

Start dates from ${from_date || start.toISOString().split("T")[0]}. Make it realistic and stunning.`;

    // Abandon the model rather than hanging the request. The curated itinerary is
    // a genuine product, not an error state, so a timeout degrades cleanly.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), MODEL_TIMEOUT_MS);

    let text: string;
    try {
      const result = await model.generateContent(
        { contents: [{ role: "user", parts: [{ text: prompt }] }] },
        { signal: abort.signal }
      );
      text = result.response.text();
    } catch (modelErr) {
      console.error("Gemini generation failed or timed out:", modelErr);
      return NextResponse.json({
        success: true,
        isMock: true,
        itinerary: generateMockItinerary(start, dayCount, body)
      });
    } finally {
      clearTimeout(timer);
    }

    // Validate the shape before it is presented as a real plan. An unparseable or
    // malformed response must fail closed to the curated itinerary.
    const itinerary = parseItinerary(text);

    if (!itinerary) {
      console.error("Gemini response failed schema validation. Raw text:", text);
      return NextResponse.json({
        success: true,
        isMock: true,
        itinerary: generateMockItinerary(start, dayCount, body)
      });
    }

    return NextResponse.json({
      success: true,
      isMock: false,
      itinerary
    });
  } catch (err: unknown) {
    // Do not leak internal error text to the client.
    console.error("Error generating itinerary:", err);
    return NextResponse.json(
      { success: false, error: "Could not generate an itinerary. Please try again." },
      { status: 500 }
    );
  }
}

function generateMockItinerary(start: Date, days: number, body: any): any[] {
  const result = [];
  const foodLabel = body.food === "jain" ? "100% Jain (no onion/garlic)" : body.food === "vegan" ? "Vegan" : "Strict Vegetarian";
  const budgetTier = body.budget || "comfort";
  const hotelClass = budgetTier === "premium" ? "5-Star Luxury Private Pool Villa" : budgetTier === "comfort" ? "4-Star Boutique Resort" : "3-Star Deluxe Hotel";
  const guideLang = body.preferred_languages?.[0] || "English";
  
  const dailyCost = budgetTier === "premium" ? 10000 : budgetTier === "comfort" ? 6000 : 3500;

  for (let i = 0; i < days; i++) {
    const current = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = current.toISOString().split("T")[0];
    
    if (i === 0) {
      result.push({
        day: 1,
        date: dateStr,
        title: "Arrive in Bali & Sunset Oceanside Dinner",
        activities: [
          `Arrive at Ngurah Rai International Airport from ${body.international_airport || "Delhi/Mumbai"}`,
          `Welcome garland service and meet your private local driver and ${guideLang}-speaking guide`,
          "Transfer to your hotel in Seminyak, check in and freshen up",
          "Evening visit to Jimbaran beach for sunset views"
        ],
        meals: {
          breakfast: "In-flight catering",
          lunch: "Welcome refreshments upon arrival",
          dinner: `Special welcome buffet at Ganesha Ek Sanskriti (Seminyak) — ${foodLabel} food prep`
        },
        transport: `Private AC vehicle (${body.vehicle_type || "minivan"}) from airport to hotel`,
        accommodation: `${hotelClass} in Seminyak`,
        estimated_cost_inr: dailyCost
      });
    } else if (i === days - 1) {
      result.push({
        day: i + 1,
        date: dateStr,
        title: "Kuta Beach Souvenirs & Airport Departure",
        activities: [
          "Leisurely morning walk around the resort",
          "Boutique shopping at Kuta Art Market and Seminyak Square for local Balinese souvenirs",
          "Check out from the resort and private transfer to airport",
          "Board return flight to India with sweet memories"
        ],
        meals: {
          breakfast: `Healthy resort breakfast buffet (dedicated ${foodLabel} counter)`,
          lunch: `Indian thali lunch at Queen's Tandoor — customized ${foodLabel}`,
          dinner: "In-flight catering"
        },
        transport: "Private transfer to airport",
        accommodation: "Flight back home",
        estimated_cost_inr: dailyCost
      });
    } else {
      // Intermediate days
      const tripNumber = i % 3;
      if (tripNumber === 1) {
        result.push({
          day: i + 1,
          date: dateStr,
          title: "Ubud Rice Terraces & Traditional Dance",
          activities: [
            "Scenic drive to Ubud cultural heartland",
            "Walk through Tegallalang Rice Terraces and take photos on the Bali Swing",
            "Explore Sacred Monkey Forest Sanctuary",
            "Evening watch: Traditional Barong & Keris dance performance in Ubud village"
          ],
          meals: {
            breakfast: "Resort breakfast buffet",
            lunch: `Aromatic Indian lunch in Ubud (Sari Organik or Indian Delights) — ${foodLabel} options`,
            dinner: `Custom ${foodLabel} banquet style dinner at Ubud resort`
          },
          transport: `Private AC vehicle with driver and ${guideLang}-speaking guide`,
          accommodation: `${hotelClass} in Ubud`,
          estimated_cost_inr: dailyCost
        });
      } else if (tripNumber === 2) {
        result.push({
          day: i + 1,
          date: dateStr,
          title: "Uluwatu Temple Cliff Cliffside Sunset",
          activities: [
            "Morning relaxation, spa, or yoga session at the resort",
            "Afternoon visit to Uluwatu Temple perched on a 70m high cliff facing the Indian Ocean",
            "Watch the dramatic Kecak Fire Dance at Uluwatu with sunset background",
            "Stroll along Nusa Dua beach walkway"
          ],
          meals: {
            breakfast: "Resort breakfast buffet",
            lunch: `Delicious Indian buffet at Nu Delhi (Nusa Dua) — ${foodLabel}`,
            dinner: `Candlelit dinner at beachfront Indian restaurant — ${foodLabel} standard`
          },
          transport: `Private AC vehicle with driver and ${guideLang}-speaking guide`,
          accommodation: `${hotelClass} in Nusa Dua`,
          estimated_cost_inr: dailyCost
        });
      } else {
        result.push({
          day: i + 1,
          date: dateStr,
          title: "Water Sports at Tanjung Benoa & Sea Temple",
          activities: [
            "Morning water sports adventure at Tanjung Benoa (Banana Boat, Parasailing, Jet Ski)",
            "Visit the spectacular Tanah Lot Sea Temple, marvel at the offshore structure",
            "Walk around Canggu creative boutique cafes"
          ],
          meals: {
            breakfast: "Resort breakfast buffet",
            lunch: `Customized ${foodLabel} lunch box served fresh at water sports center`,
            dinner: `Gourmet dinner at Jimbaran Indian restaurant — ${foodLabel}`
          },
          transport: `Private AC vehicle with driver and ${guideLang}-speaking guide`,
          accommodation: `${hotelClass} in Seminyak`,
          estimated_cost_inr: dailyCost
        });
      }
    }
  }
  return result;
}
