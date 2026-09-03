/**
 * English is the reference dictionary. Every other locale is typed against
 * `Dictionary`, so a missing key is a build error rather than a blank space
 * on a live page.
 */
export const en = {
  meta: {
    title: "Only2Bali - Indonesia travel marketplace for Indian groups",
    description:
      "Book verified stays, rides, guides, restaurants and group packages across Bali, Jakarta and Indonesia — built for Indian travellers, with food protocol as one clear filter.",
  },

  nav: {
    home: "Home",
    circuits: "Circuits",
    destinations: "Destinations",
    services: "Services",
    guarantee: "Trip quality",
    verify: "How we verify",
    packages: "Packages",
    providers: "Providers",
    plan: "Plan your trip",
    language: "Language",
    theme: "Toggle light and dark",
  },

  hero: {
    eyebrow: "India → Indonesia · Bali · Jakarta · Circuits · Services",
    headlineBefore: "Your Indonesia trip, ",
    headlineEm: "built around you",
    headlineAfter: " — with verified local providers.",
    sub: "Browse curated circuits and book stays, rides, guides, restaurants and packages from verified partners in Bali, Jakarta and beyond. Pay Only2Bali; we pay the providers.",
    cta1: "Explore circuits",
    cta2: "Browse services",
    caption: "Sembah — the folded-hand greeting shared by Bali and India",
  },

  rail: [
    { value: "Bali + Jakarta", label: "Destinations live now, more Indonesia next" },
    { value: "4", label: "Temple, adventure, food and artisan circuits" },
    { value: "7", label: "Indian languages spoken by our guides" },
    { value: "Verified", label: "Providers go live only after admin review" },
  ],

  destinations: {
    heading: "Where do you want to go?",
    sub: "Start with Bali or Jakarta. Every service and package is tied to a place, not a vague brochure.",
    bali: {
      name: "Bali",
      blurb: "Temples, coasts, Ubud, Nusa islands — the core circuits and most of our verified supply.",
    },
    jakarta: {
      name: "Jakarta",
      blurb: "City stays, airport logistics, dining and add-on services for groups entering Indonesia.",
    },
  },

  circuits: {
    heading: "Choose the Indonesia you actually came for.",
    sub: "Four circuits, each backed by real providers for kitchens, hotels, villas, cars, guides and activities. Pick your route and we match the whole trip around your comfort and budget.",
    addOn: "Add on",
    items: {
      ramayana: {
        name: "The temple circuit",
        blurb: "Besakih, Tirta Empul, Lempuyang and the Kecak fire dance at Uluwatu as the sun goes down.",
        stops: "6 temple stops · Kecak at sunset · satvik meal days",
      },
      adventure: {
        name: "Quality rides to sunrise",
        blurb: "Ayung river, Mount Batur before dawn, Nusa Penida water, and driver-led transfers that do not feel random.",
        stops: "Private cars, vans and buses matched to group size",
      },
      culinary: {
        name: "The food and stay trail",
        blurb: "Pure-veg kitchens, cooking classes, villa kitchens, resorts and budget stays that work for Indian groups.",
        stops: "Kitchens and stays checked together",
      },
      artistic: {
        name: "Carvers, weavers and painters",
        blurb: "Mas village wood-carving, Celuk silver, batik studios in Ubud and Sanur — working with the artisans, not watching from a bus window.",
        stops: "Hands-on workshops · small groups",
      },
      coast: {
        name: "Coast, rest and luxury cars",
        blurb: "Nusa Dua, Jimbaran, beach clubs, airport transfers and premium cars for groups that want a smoother trip.",
        stops: "",
      },
      wellness: {
        name: "Wellness",
        blurb: "Ubud yoga, flower-bath spa, quiet mornings.",
        stops: "",
      },
    },
  },

  services: {
    heading: "Book services from verified local partners.",
    sub: "Restaurants, stays, transport, guides, activities and more — listed by providers across Bali and Jakarta, published only after Only2Bali checks them.",
    empty: "No published services in this filter yet. Providers are onboarding — try another region or check packages.",
    from: "from",
    verified: "Verified provider",
    viewCta: "View service",
    bookCta: "Enquire to book",
    bookNow: "Book and pay",
    booking: "Holding…",
    signedInRequired: "Sign in to hold this date and pay Only2Bali.",
    signIn: "Sign in to book",
    leadName: "Lead traveller full name",
    pax: "Group size",
    protocol: "Food protocol",
    date: "Service date",
    success: "Held — reference",
    errGeneric: "Could not create the booking. Nothing was charged.",
    filterAll: "All destinations",
    filterBali: "Bali",
    filterJakarta: "Jakarta",
    back: "All services",
    reviewsHeading: "Traveller reviews",
  },

  providers: {
    heading: "Verified Bali and Jakarta providers.",
    sub: "Only admin-verified partners appear here. Open a profile to see approved photos and live services.",
    empty: "No verified providers are public yet.",
    viewCta: "View provider",
    verified: "Verified",
  },

  guarantee: {
    heading: "Food protocol is one filter. Stays, rides and budget are checked too.",
    sub: "Vegetarian, Jain and vegan remain first-class options — disclosed meal by meal — alongside stay comfort, vehicle type, guide language and clear INR pricing.",
    protocols: { jain: "Jain", veg: "Vegetarian", vegan: "Vegan", satvik: "Satvik (no onion or garlic)", eggetarian: "Vegetarian with egg", halal: "Halal", nonVeg: "No restriction" },
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
    heading: "How a provider earns trust.",
    sub: "We verify the service travellers actually get: stays, rides, guides, activities and kitchens — not just the sales pitch.",
    steps: [
      { title: "We check in person", body: "A member of our team sees the place or vehicle, or rides with the guide, before the listing goes live. No scheduled inspection theatre." },
      { title: "We check the real service", body: "Room fit for stays, vehicle condition for rides, language and route knowledge for guides, and kitchen practice where food is part of the trip." },
      { title: "Food protocol when it matters", body: "Where meals are included, Jain and veg constraints are confirmed with the cook on shift — no onion, no garlic, no root vegetable when requested — and photographed." },
      { title: "The rating expires", body: "Hotels, drivers, menus and prices change. A check that is not renewed drops out of our system rather than quietly ageing." },
    ],
  },

  packages: {
    heading: "Latest partner offers selected by admin.",
    sub: "Starting offers in INR, excluding international flights. Premium rates are shown only for premium partners; every plan can move between budget, comfort and luxury car options.",
    perPerson: "starting offer / person",
    checkDates: "View itinerary & offer",
    bookNow: "Book this departure",
    nights: "nights",
    days: "days",
    empty: "No published packages yet.",
    items: [
      {
        slug: "sattvik-serenity",

        tag: "Ramayana",
        name: "Sattvik Serenity",
        meta: "6 days · 5 nights · Ubud, Tirta Empul, Uluwatu, Nusa Dua",
        price: "₹88,000",
        why: [
          "Premium partner option with Jain-protocol kitchen",
          "Gujarati and Hindi-speaking guide throughout",
          "Temple mornings timed before the crowds",
        ],
        chips: ["Jain", "Vegetarian", "Premium partner"],
      },
      {
        slug: "bali-veg-explorer",

        tag: "Mixed",
        name: "Bali Veg Explorer",
        meta: "5 days · 4 nights · Kuta, Ubud, Uluwatu",
        price: "₹39,500",
        why: [
          "Latest budget partner offer for first-time groups",
          "Water sports and Uluwatu Kecak included",
          "Built for first-time groups on a tighter budget",
        ],
        chips: ["Vegetarian", "Jain", "Budget option"],
      },
      {
        slug: "active-bali",

        tag: "Adventure",
        name: "Active Bali",
        meta: "5 days · 4 nights · Ayung, Mount Batur, Nusa Penida",
        price: "₹47,500",
        why: [
          "High-protein veg and vegan meal plans for trek days",
          "Batur sunrise with a packed protocol breakfast",
          "Rafting, ATV and snorkelling in one week",
        ],
        chips: ["Vegetarian", "Vegan", "Comfort offer"],
      },
    ],
  },

  langs: {
    heading: "Your parents shouldn’t have to explain their food in English.",
    sub: "Our Bali guide network includes Indian-language speakers who understand temple etiquette, fasting days and family travel rhythms — on both sides.",
  },

  close: {
    heading: "Tell us your dates. We’ll come back with clear options.",
    body: "We match verified providers across Bali and Jakarta — food, stays, cars, guides and activities — then show economical, comfort and premium choices in INR.",
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
    tagline: "Indonesia travel marketplace for Indian groups — Bali, Jakarta and beyond.",
    note: "Photography and palette from the existing site.",
  },

  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    account: "My account",
    heading: "No password. Just a code.",
    sub: "Enter your email or mobile and we'll send a six-digit code. No password to forget, and nothing for anyone to steal.",
    useEmail: "Email",
    useMobile: "Mobile",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    mobileLabel: "Mobile number",
    mobilePlaceholder: "+91 98765 43210",
    continue: "Send me a code",
    sending: "Sending…",
    codeHeading: "Enter the six-digit code",
    codeSentTo: "We sent it to",
    codeLabel: "Six-digit code",
    verify: "Sign in",
    verifying: "Checking…",
    resend: "Send a new code",
    resendIn: "You can request another in",
    seconds: "s",
    changeContact: "Use a different address",
    expiresNote: "The code expires in ten minutes and works once.",
    errInvalid: "That code is not correct.",
    errExpired: "That code has expired. Request a new one.",
    errLocked: "Too many incorrect attempts. Request a new code.",
    errRate: "Too many requests. Please wait a moment.",
    errNetwork: "Could not reach the server. Check your connection and try again.",
    errGeneric: "Something went wrong. Please try again.",
    welcomeNew: "Welcome. Your account is ready.",
  },

  account: {
    heading: "Your account",
    signedInAs: "Signed in as",
    role: "Role",
    roleTraveller: "Traveller",
    roleVendor: "Provider",
    roleAdmin: "Admin",
    tripsHeading: "Your trips",
    tripsEmpty: "You have not planned a trip yet.",
    tripsEmptyCta: "Plan a trip",
    bookingsHeading: "Bookings",
    bookingsEmpty: "Nothing booked yet. Bookings appear here with your vouchers and payment schedule.",
    payNow: "Pay now",
    paying: "Opening payment…",
    paid: "Paid — booking confirmed",
    holdExpired: "Seat hold expired — contact us to rebook",
    awaitingPayment: "Awaiting payment",
    confirmed: "Confirmed",
    payErrSetup: "Online payment is not configured yet. Your seats are held — we will follow up.",
    payErrGeneric: "Payment could not be completed. Nothing was charged twice. Try again.",
    savedHeading: "Saved packages",
    savedEmpty: "Packages you save will show up here.",
    browseCta: "Browse packages",
    protocolNote: "Set your food protocol once and every itinerary we build respects it.",
    reviewHeading: "Leave a rating",
    reviewSubmit: "Submit rating",
    reviewThanks: "Thank you — your rating is saved.",
    reviewPrompt: "Rate this provider",
  },
};

export type Dictionary = typeof en;
