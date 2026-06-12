import { CATALOG, type Pkg, type Protocol, type Tier } from "./catalog";

export interface PlannerInput {
  city: string;
  month: string;
  size: number;
  budget: Tier;
  food: Protocol;
  lang: string;
  kitchen: boolean;
  cook: boolean;
  interests: string[];
}

export interface Recommendation {
  pkg: Pkg;
  score: number;
  why: string[];
}

/**
 * Deterministic rules-based itinerary recommendation.
 * HARD filter: food protocol compliance — non-compliant packages are never shown.
 * Scoring: +3 budget tier match · +2 per interest overlap · +2 kitchen match ·
 *          +1 guide language · +2 cook available for groups of 10+.
 */
export function recommend(inp: PlannerInput): Recommendation[] {
  return CATALOG.filter((p) => p.protocols.includes(inp.food))
    .map((p) => {
      let score = 0;
      const why: string[] = [
        `100% ${inp.food === "jain" ? "Jain-protocol" : inp.food} meals — pre-confirmed`,
      ];
      if (p.tier === inp.budget) { score += 3; why.push(`Fits your ${inp.budget} budget band`); }
      const hits = p.tags.filter((t) => inp.interests.includes(t));
      score += hits.length * 2;
      if (hits.length) why.push(`Matches interests: ${hits.join(", ")}`);
      if (inp.kitchen && p.kitchen) { score += 2; why.push("Stay includes private kitchen access"); }
      if (inp.lang && p.langs.includes(inp.lang)) { score += 1; why.push(`${inp.lang}-speaking guide available`); }
      if (inp.cook && p.cookReady && inp.size >= 10) { score += 2; why.push(`Accompanying cook available for your group of ${inp.size}`); }
      return { pkg: p, score, why };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/** Validation: cook accompaniment requires 10+ pax. */
export function validatePlannerInput(inp: PlannerInput): string | null {
  if (!inp.city || !inp.month || !inp.size || !inp.budget || !inp.food)
    return "Please fill departure city, month, group size, budget and food protocol.";
  if (inp.cook && inp.size < 10)
    return "Accompanying cook is available for groups of 10+ pax.";
  return null;
}
