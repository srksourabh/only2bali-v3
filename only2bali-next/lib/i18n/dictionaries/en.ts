/**
 * English is the reference dictionary. Every other locale is typed against
 * `Dictionary`, so a missing key is a build error rather than a blank space
 * on a live page.
 */
export const en = {
  meta: {
    title: "Only2Bali — verified vegetarian, Jain and vegan group travel to Bali",
    description:
      "Group travel from India to Bali built around Jain, vegetarian and vegan protocol, with guides who speak your language. Every meal rated before your itinerary is issued.",
  },

  nav: {
    circuits: "Circuits",
    guarantee: "The veg guarantee",
    verify: "How we verify",
    packages: "Packages",
    plan: "Plan my trip",
    language: "Language",
    theme: "Toggle light and dark",
  },

  hero: {
    eyebrow: "India → Bali · Jain · Vegetarian · Vegan",
    headlineBefore: "Every meal on your trip is ",
    headlineEm: "verified",
    headlineAfter: " before you land.",
    sub: "Group travel to Bali built around Indian dietary protocol and your own language — not a “veg option” bolted onto someone else’s itinerary.",
    cta1: "Send my dates",
    cta2: "See how the guarantee works",
    caption: "Sembah — the folded-hand greeting shared by Bali and India",
  },

  rail: [
    { value: "4", label: "Themed circuits, not a generic tour" },
    { value: "7", label: "Indian languages spoken by our guides" },
    { value: "10+", label: "Group size for an accompanying cook" },
    { value: "Every meal", label: "Rated before your itinerary is issued" },
  ],

  circuits: {
    heading: "Choose the Bali you actually came for.",
    sub: "Four circuits, each built on real ground — temples, trails, kitchens and workshops we have walked ourselves. Pick one, and the whole trip organises around it.",
    addOn: "Add on",
    items: {
      ramayana: {
        name: "The temple circuit",
        blurb: "Besakih, Tirta Empul, Lempuyang and the Kecak fire dance at Uluwatu as the sun goes down.",
        stops: "6 temple stops · Kecak at sunset · satvik meal days",
      },
      adventure: {
        name: "Rafting to sunrise",
        blurb: "Ayung river, Mount Batur before dawn, Nusa Penida water.",
        stops: "High-energy veg meal plans",
      },
      culinary: {
        name: "The veg food trail",
        blurb: "Pure-veg kitchens, a cooking class, and warungs that cook to protocol.",
        stops: "Every kitchen inspected",
      },
      artistic: {
        name: "Carvers, weavers and painters",
        blurb: "Mas village wood-carving, Celuk silver, batik studios in Ubud and Sanur — working with the artisans, not watching from a bus window.",
        stops: "Hands-on workshops · small groups",
      },
      coast: {
        name: "Coast & rest days",
        blurb: "Nusa Dua, Jimbaran, and time to do nothing at all.",
        stops: "",
      },
      wellness: {
        name: "Wellness",
        blurb: "Ubud yoga, flower-bath spa, quiet mornings.",
        stops: "",
      },
    },
  },

  guarantee: {
    heading: "“100% vegetarian” is a claim. This is the receipt.",
    sub: "Every meal on every itinerary carries a rating before you see it. Change the protocol and watch what changes — this is the actual logic, not a marketing panel.",
    protocols: { jain: "Jain", veg: "Vegetarian", vegan: "Vegan" },
    legend: {
      green: "Dedicated kitchen, verified",
      amber: "Shared kitchen, separate line",
      red: "Not served on this protocol",
    },
    dayTitle: "Day 3 — Ubud & Tegallalang",
    protocolLabel: { jain: "JAIN PROTOCOL", veg: "VEGETARIAN PROTOCOL", vegan: "VEGAN PROTOCOL" },
    meals: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" },
    ratingLabel: { dedicated: "Dedicated", shared: "Shared line", substituted: "Substituted" },
    jain: {
      note: "<strong>Jain is the strictest filter.</strong> No onion, no garlic, no root vegetable. Kitchens that cannot guarantee a separate prep surface drop to amber, and the Tegallalang warung drops out of the day entirely — replaced, not quietly served.",
      foot: "Two of three meals from a dedicated kitchen. One substitution made automatically.",
      breakfast: { what: "Villa kitchen — Gujarati thali", note: "Prepared by your accompanying cook" },
      lunch: { what: "Sattvik By Nature, Ubud", note: "Pure-veg kitchen, no onion or garlic on request" },
      dinner: { what: "Warung near Tegallalang", note: "Shared wok — substituted for a Jain-capable kitchen" },
    },
    veg: {
      note: "<strong>Vegetarian opens the day up.</strong> The Tegallalang warung comes back in — it is fully vegetarian, but it shares a kitchen with non-veg preparation, so it is rated amber and you are told why rather than being reassured.",
      foot: "All three meals served. One amber rating disclosed up front.",
      breakfast: { what: "Resort breakfast, dedicated veg counter", note: "Separate serving line, verified" },
      lunch: { what: "Sattvik By Nature, Ubud", note: "Pure-veg kitchen" },
      dinner: { what: "Warung near Tegallalang", note: "Vegetarian menu, shared kitchen — disclosed" },
    },
    vegan: {
      note: "<strong>Vegan is where Bali is strongest.</strong> Canggu and Ubud have a genuine plant-based scene, so the constraint moves from availability to dairy in Indian cooking — the villa breakfast switches away from ghee and curd.",
      foot: "All three meals served. Dairy removed from the villa kitchen brief.",
      breakfast: { what: "Villa kitchen — plant-based Indian", note: "Ghee and curd removed from the brief" },
      lunch: { what: "The Shady Shack, Canggu", note: "Fully plant-based kitchen" },
      dinner: { what: "Raw and smoothie bar, Ubud", note: "Vegan kitchen, no cross-contact" },
    },
  },

  verify: {
    heading: "How a kitchen earns a green rating.",
    sub: "No competitor in faith-based travel publishes their method. We do, because the method is the product.",
    steps: [
      { title: "We visit unannounced", body: "A member of our team eats there first. No scheduled inspection, no advance notice." },
      { title: "We check the line, not the menu", body: "Separate oil, separate utensils, separate prep surface. A veg menu printed by a kitchen that shares a wok is amber, not green." },
      { title: "Jain protocol is asked explicitly", body: "No onion, no garlic, no root vegetable — confirmed with the cook who will actually be on shift, and photographed." },
      { title: "The rating expires", body: "Kitchens change hands and staff move on. A rating that is not re-checked drops out of our system rather than quietly ageing." },
    ],
  },

  packages: {
    heading: "Departures with real dates and real seats.",
    sub: "Indicative per person, excluding international flights. Every package is customisable — these are starting points, not fixed menus.",
    perPerson: "per person · from",
    checkDates: "Check dates",
    nights: "nights",
    days: "days",
    items: [
      {
        tag: "Ramayana",
        name: "Sattvik Serenity",
        meta: "6 days · 5 nights · Ubud, Tirta Empul, Uluwatu, Nusa Dua",
        price: "₹1,18,000",
        why: [
          "Jain-protocol kitchen in the villa, cook optional",
          "Gujarati and Hindi-speaking guide throughout",
          "Temple mornings timed before the crowds",
        ],
        chips: ["Jain", "Vegetarian", "Private villa"],
      },
      {
        tag: "Mixed",
        name: "Bali Veg Explorer",
        meta: "5 days · 4 nights · Kuta, Ubud, Uluwatu",
        price: "₹58,000",
        why: [
          "Verified Indian veg restaurants on every travel day",
          "Water sports and Uluwatu Kecak included",
          "Built for first-time groups on a tighter budget",
        ],
        chips: ["Vegetarian", "Jain", "Group"],
      },
      {
        tag: "Adventure",
        name: "Active Bali",
        meta: "5 days · 4 nights · Ayung, Mount Batur, Nusa Penida",
        price: "₹62,000",
        why: [
          "High-protein veg and vegan meal plans for trek days",
          "Batur sunrise with a packed protocol breakfast",
          "Rafting, ATV and snorkelling in one week",
        ],
        chips: ["Vegetarian", "Vegan", "Active"],
      },
    ],
  },

  langs: {
    heading: "Your parents shouldn’t have to explain their food in English.",
    sub: "Our Bali guide network includes Indian-language speakers who understand temple etiquette, fasting days and family travel rhythms — on both sides.",
  },

  close: {
    heading: "Tell us your dates. We’ll come back with three quotes.",
    body: "From verified providers, within 24 hours, each priced all-in with the compliance rating for every meal already attached. No call centre, no drip campaign.",
    cta1: "Start with my dates",
    cta2: "List my business as a provider",
  },

  brand: {
    heading: "The mark",
    body: "<em>Candi bentar</em> — the split gate that marks the entrance to a Balinese temple courtyard. Two stepped pylons, a passage between them, and the sun rising through the opening. You pass through it to enter.",
    scale: "Scale",
    full: "Full",
    favicon: "20px · favicon",
    reversed: "Reversed",
    reversedBody: "Ivory pylons, saffron sun. For emerald and photographic grounds.",
    palette: "Palette — unchanged",
    paletteBody: "Every colour already in your codebase. Nothing new was introduced.",
  },

  footer: {
    tagline: "Verified vegetarian, Jain and vegan group travel to Bali.",
    note: "Photography and palette from the existing site.",
  },
};

export type Dictionary = typeof en;
