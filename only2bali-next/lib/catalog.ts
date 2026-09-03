import type { Protocol } from "@/lib/protocols";

export type { Protocol };
export type Tier = "economical" | "comfort" | "premium";

export interface Pkg {
  id: string;
  name: string;
  tier: Tier;
  protocols: Protocol[];
  days: number;
  band: string;
  tags: string[];
  kitchen: boolean;
  cookReady: boolean;
  langs: string[];
  blurb: string;
  outline: string;
}

export const CATALOG: Pkg[] = [
  { id: "sattvik", name: "Sattvik Serenity", tier: "premium", protocols: ["jain", "vegetarian"], days: 6,
    band: "Premium · ₹1,18,000+ /pax", tags: ["temples", "wellness", "culture"], kitchen: true, cookReady: true,
    langs: ["Hindi", "Gujarati", "English"],
    blurb: "Ubud + Uluwatu in private villas with Jain-protocol kitchen and optional accompanying cook.",
    outline: "D1 Arrival, villa check-in, welcome Jain thali · D2 Tirta Empul & Ubud palace · D3 Tegallalang + wellness spa · D4 Uluwatu temple & Kecak · D5 Nusa Dua beach day, satvik dinner · D6 Departure" },
  { id: "explorer", name: "Bali Veg Explorer", tier: "economical", protocols: ["vegetarian", "jain"], days: 5,
    band: "Economical · ₹58,000+ /pax", tags: ["beaches", "adventure", "shopping"], kitchen: false, cookReady: true,
    langs: ["Hindi", "English"],
    blurb: "Value-packed group trip: Kuta, Ubud and water sports with verified Indian veg restaurants throughout.",
    outline: "D1 Arrival, Kuta sunset · D2 Water sports + Uluwatu · D3 Ubud day trip, veg warung lunch · D4 Shopping + beach clubs (veg menus) · D5 Departure" },
  { id: "vegan", name: "Vegan Vitality Retreat", tier: "comfort", protocols: ["vegan"], days: 6,
    band: "Comfort · ₹86,000+ /pax", tags: ["wellness", "beaches", "culture"], kitchen: true, cookReady: false,
    langs: ["English", "Hindi"],
    blurb: "Ubud and Canggu's celebrated plant-based scene with yoga, raw cafés and a cooking class.",
    outline: "D1 Arrival, Canggu vegan café crawl · D2 Yoga + rice terraces · D3 Vegan cooking class · D4 Ubud markets & monkey forest · D5 Beach + sunset raw dinner · D6 Departure" },
  { id: "temple", name: "Temple & Tranquility", tier: "comfort", protocols: ["vegetarian", "jain"], days: 7,
    band: "Comfort · ₹92,000+ /pax", tags: ["temples", "culture", "wellness"], kitchen: true, cookReady: true,
    langs: ["Tamil", "Telugu", "Kannada", "Hindi", "English"],
    blurb: "A Brahmin-community favourite: Bali's sacred temple circuit with satvik meals and South-Indian-speaking guides.",
    outline: "D1 Arrival, satvik dinner · D2 Besakih mother temple · D3 Tirta Empul holy springs · D4 Lempuyang gates + rest · D5 Tanah Lot sunset · D6 Cultural performances · D7 Departure" },
  { id: "celebration", name: "Premium Family Celebration", tier: "premium", protocols: ["jain", "vegetarian", "vegan"], days: 7,
    band: "Premium · ₹1,45,000+ /pax", tags: ["beaches", "wellness", "shopping", "culture"], kitchen: true, cookReady: true,
    langs: ["Hindi", "Gujarati", "Marathi", "English"],
    blurb: "Milestone birthdays & anniversaries: private villa estate, dedicated cook, curated celebration evening.",
    outline: "D1 Arrival, estate check-in · D2 Beach + spa day · D3 Private celebration evening, custom menu · D4 Ubud excursion · D5 Yacht / Nusa Penida option · D6 Leisure + shopping · D7 Departure" },
  { id: "adventure", name: "Active Bali (Veg-Fueled)", tier: "economical", protocols: ["vegetarian", "vegan"], days: 5,
    band: "Economical · ₹62,000+ /pax", tags: ["adventure", "beaches"], kitchen: false, cookReady: false,
    langs: ["Hindi", "English"],
    blurb: "Rafting, ATV, snorkeling and volcano sunrise — with high-energy veg/vegan meal plans.",
    outline: "D1 Arrival · D2 Ayung river rafting + ATV · D3 Mt Batur sunrise trek, veg brunch · D4 Nusa Penida snorkeling · D5 Departure" },
];
