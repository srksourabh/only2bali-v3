"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { wa } from "@/lib/config";
import "./planner.css";

// ── DATA STRUCTURES ──

const CREW_OPTIONS = [
  { id: "business_partners", title: "Business Partners", desc: "Business surveys, site visits, or work groups", icon: "💼" },
  { id: "corporate_meeting", title: "Corporate Meeting", desc: "Annual meetings, board retreats, and events", icon: "🏢" },
  { id: "team_bonding", title: "Team Bonding", desc: "Team building, bonding games, and relaxation", icon: "🤝" },
  { id: "alumni_meeting", title: "Alumni Meeting", desc: "Reuniting with old school or college friends", icon: "🎓" },
  { id: "friends_get_together", title: "Friends Get-Together", desc: "Fun vacations with your closest circles", icon: "🥳" },
  { id: "family", title: "Family Group", desc: "Families traveling with toddlers/children", icon: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}" },
  { id: "new_couple", title: "New Couple", desc: "Honeymooners or romantic couple getaways", icon: "💑" },
  { id: "family_get_together", title: "Family Get-Together", desc: "Multi-generation tours (grandparents to kids)", icon: "👵👶" },
];

const AIRPORTS = [
  "Indira Gandhi International Airport (New Delhi)",
  "Chhatrapati Shivaji Maharaj International Airport (Mumbai)",
  "Kempegowda International Airport (Bengaluru)",
  "Chennai International Airport (Chennai)",
  "Rajiv Gandhi International Airport (Hyderabad)",
  "Netaji Subhas Chandra Bose International Airport (Kolkata)",
  "Sardar Vallabhbhai Patel International Airport (Ahmedabad)",
  "Pune International Airport (Pune)",
  "Cochin International Airport (Kochi)",
  "Goa International Airport (Dabolim, Goa)",
  "Coimbatore International Airport (Coimbatore)",
  "Madurai International Airport (Madurai)",
  "Trivandrum International Airport (Thiruvananthapuram)",
  "Mangalore International Airport (Mangalore)",
  "Jaipur International Airport (Jaipur)",
  "Biju Patnaik International Airport (Bhubaneswar)",
  "Visakhapatnam International Airport (Visakhapatnam)",
  "Srinagar International Airport (Srinagar)",
  "Lucknow International Airport (Lucknow)",
  "Chandigarh International Airport (Chandigarh)",
  "Vadodara International Airport (Vadodara)",
  "Surat International Airport (Surat)",
  "Imphal International Airport (Imphal)",
  "Bagdogra International Airport (Bagdogra)",
  "Gaya International Airport (Gaya)",
  "Rajahmundry Airport (Rajahmundry)",
  "Dehradun Airport (Dehradun)",
  "Jammu Airport (Jammu)",
  "Belagavi Airport (Belagavi)",
  "Kanpur Airport (Kanpur)",
  "Port Blair Airport (Port Blair)",
  "Bhuj Airport (Bhuj)",
  "Agartala Airport (Agartala)",
  "Aurangabad Airport (Aurangabad)",
  "Kolhapur Airport (Kolhapur)"
];

const INTERESTS = [
  { id: "beaches", name: "Natural Beauty & Beaches", icon: "🏖️" },
  { id: "culture", name: "Local Cultures & Traditions", icon: "🛕" },
  { id: "wellness", name: "Wellness & Relaxation", icon: "🧘" },
  { id: "wedding", name: "Wedding & Pre-Wedding Shoot", icon: "📸" },
  { id: "adventure", name: "Adventure & Water Sports", icon: "🚣" },
  { id: "culinary", name: "Local Culinary & Tastes", icon: "🍳" },
  { id: "shopping", name: "Shopping in local markets", icon: "🛍️" },
  { id: "luxury", name: "Luxury & Unique Experiences", icon: "✨" }
];

const STAYS = [
  { id: "hotel", name: "Hotel", icon: "🏨" },
  { id: "motel", name: "Motel", icon: "🏩" },
  { id: "villa", name: "Villa", icon: "🏡" },
  { id: "cottage", name: "Cottage", icon: "🪵" },
  { id: "apartment", name: "Apartment", icon: "🏢" },
  { id: "guesthouse", name: "Guesthouse", icon: "🏠" }
];

const VEHICLES = [
  { id: "motorbike", name: "Motorbike (1-2 People)", icon: "🏍️" },
  { id: "car", name: "Car (5-10 People)", icon: "🚗" },
  { id: "van", name: "Van (12-15 People)", icon: "🚐" },
  { id: "minibus", name: "Mini Bus (20-30 People)", icon: "🚌" },
  { id: "bus", name: "Bus (30+ People)", icon: "🚌" },
  { id: "luxury_car", name: "Luxury Car (5-8 People)", icon: "✨🚗" }
];

const FOOD_PREFS = {
  vegetarian: [
    { id: "north_indian_veg", name: "North Indian Vegetarian" },
    { id: "south_indian_veg", name: "South Indian Vegetarian" },
    { id: "gujarati_veg", name: "Gujarati Vegetarian" },
    { id: "jain_veg", name: "Strict Jain Dishes" }
  ],
  balinese: [
    { id: "jimbaran_seafood", name: "Jimbaran Seafood" },
    { id: "balinese_culinary", name: "Balinese Culinary" },
    { id: "indonesian_food", name: "Indonesian Specialties" },
    { id: "local_snacks", name: "Balinese Local Snacks" }
  ],
  dietary: [
    { id: "vegan", name: "Vegan Foods" },
    { id: "keto", name: "Keto Friendly" },
    { id: "halal", name: "Halal Certified" },
    { id: "soto_ayam", name: "Vegetarian Soto Ayam" }
  ],
  nonveg: [
    { id: "north_indian_nonveg", name: "North Indian Non-Veg" },
    { id: "south_indian_nonveg", name: "South Indian Non-Veg" }
  ]
};

const LANGUAGES = ["Tamil", "English", "Hindi", "Marathi", "Gujarati", "Kannada"];

const LOADING_MESSAGES = [
  "Consulting Gemini Flash AI model...",
  "Searching Bali regional destination database...",
  "Formatting custom Indian dietary configurations...",
  "Sourcing local private stays & transport slots...",
  "Calculating total group budget estimates in INR...",
  "Structuring day-by-day travel timeline guides...",
  "Applying Balinese Sanskrit aesthetic layouts..."
];

interface DayItinerary {
  day: number;
  date: string;
  title: string;
  activities: string[];
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  transport: string;
  accommodation: string;
  estimated_cost_inr: number;
}

function PlannerWizardComponent() {
  // ── MULTI-STEP FLOW STATE ──
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const searchParams = useSearchParams();

  useEffect(() => {
    const pkgId = searchParams.get("package");
    if (!pkgId) return;

    // Pre-populate states based on selected package ID
    if (pkgId === "sattvik") {
      setBudgetTier("premium");
      setFoodProtocol("jain");
      setDietChoices(["jain_veg"]);
      setKitchenAccess(true);
      setCookAccompaniment(true);
      setPreferredLanguages(["Hindi", "Gujarati", "English"]);
      setSelectedInterests(["culture", "wellness"]);
      setSelectedStays(["villa"]);
    } else if (pkgId === "explorer") {
      setBudgetTier("economical");
      setFoodProtocol("vegetarian");
      setKitchenAccess(false);
      setCookAccompaniment(true);
      setPreferredLanguages(["Hindi", "English"]);
      setSelectedInterests(["beaches", "adventure", "shopping"]);
      setSelectedStays(["hotel"]);
    } else if (pkgId === "vegan") {
      setBudgetTier("comfort");
      setFoodProtocol("vegan");
      setDietChoices(["vegan"]);
      setKitchenAccess(true);
      setCookAccompaniment(false);
      setPreferredLanguages(["English", "Hindi"]);
      setSelectedInterests(["wellness", "beaches", "culture"]);
      setSelectedStays(["hotel", "villa"]);
    } else if (pkgId === "temple") {
      setBudgetTier("comfort");
      setFoodProtocol("vegetarian");
      setDietChoices(["north_indian_veg", "south_indian_veg"]);
      setKitchenAccess(true);
      setCookAccompaniment(true);
      setPreferredLanguages(["Tamil", "English", "Hindi", "Kannada"]);
      setSelectedInterests(["culture", "wellness"]);
      setSelectedStays(["villa", "hotel"]);
    } else if (pkgId === "celebration") {
      setBudgetTier("premium");
      setFoodProtocol("vegetarian");
      setDietChoices(["north_indian_veg", "jain_veg", "vegan"]);
      setKitchenAccess(true);
      setCookAccompaniment(true);
      setPreferredLanguages(["Hindi", "Gujarati", "Marathi", "English"]);
      setSelectedInterests(["beaches", "wellness", "shopping", "culture"]);
      setSelectedStays(["villa"]);
    } else if (pkgId === "adventure") {
      setBudgetTier("economical");
      setFoodProtocol("vegetarian");
      setDietChoices(["north_indian_veg", "vegan"]);
      setKitchenAccess(false);
      setCookAccompaniment(false);
      setPreferredLanguages(["Hindi", "English"]);
      setSelectedInterests(["adventure", "beaches"]);
      setSelectedStays(["hotel"]);
    }
  }, [searchParams]);

  // ── INPUT STATES ──
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [crewType, setCrewType] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState<number>(0);
  const [timesVisitedBali, setTimesVisitedBali] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [internationalAirport, setInternationalAirport] = useState("");
  const [flightClass, setFlightClass] = useState("Economy");

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedStays, setSelectedStays] = useState<string[]>([]);
  const [budgetTier, setBudgetTier] = useState<"economical" | "comfort" | "premium">("comfort");

  const [foodProtocol, setFoodProtocol] = useState<"vegetarian" | "jain" | "vegan">("vegetarian");
  const [dietChoices, setDietChoices] = useState<string[]>([]);
  const [kitchenAccess, setKitchenAccess] = useState(false);
  const [cookAccompaniment, setCookAccompaniment] = useState(false);

  const [vehicleType, setVehicleType] = useState("");
  const [rentPeriod, setRentPeriod] = useState("Whole Trip");
  const [includeDriver, setIncludeDriver] = useState("Yes");
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [plainRequest, setPlainRequest] = useState("");
  const [publishedPreview, setPublishedPreview] = useState(false);

  // ── RESULT STATES ──
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [isMockResult, setIsMockResult] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  // ── LOADING TEXT ROTATION ──
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // ── HANDLERS ──
  const handleInterestToggle = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleStayToggle = (id: string) => {
    setSelectedStays((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        setError("You can select up to 2 accommodation types.");
        return prev;
      }
      setError(null);
      return [...prev, id];
    });
  };

  const handleDietChoiceToggle = (id: string) => {
    setDietChoices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleLanguageToggle = (lang: string) => {
    setPreferredLanguages((prev) =>
      prev.includes(lang) ? prev.filter((x) => x !== lang) : [...prev, lang]
    );
  };

  // ── NAVIGATION CONTROLS ──
  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) { setError("Please tell us your name."); return; }
      if (!age || parseInt(age) < 1 || parseInt(age) > 99) { setError("Please enter a valid age (1-99)."); return; }
      if (numberOfPeople <= 0) { setError("Please specify the number of travelers."); return; }
      if (!crewType) { setError("Please select your travel crew card."); return; }
      if (!timesVisitedBali) { setError("Please select how many times you visited Bali."); return; }
    } else if (step === 2) {
      if (!fromDate) { setError("Please pick your start date."); return; }
      if (!toDate) { setError("Please pick your departure date."); return; }
      if (new Date(fromDate) >= new Date(toDate)) { setError("The return date must be after the departure date."); return; }
      if (!internationalAirport) { setError("Please select your international departure airport in India."); return; }
    } else if (step === 3) {
      if (selectedInterests.length === 0) { setError("Please select at least one interest or vibe card."); return; }
      if (selectedStays.length === 0) { setError("Please select at least one accommodation preference."); return; }
    } else if (step === 4) {
      if (cookAccompaniment && numberOfPeople < 10) {
        setError("An accompanying Indian cook/catering team is strictly available for groups of 10+ people.");
        return;
      }
    } else if (step === 5) {
      if (!vehicleType) { setError("Please select your preferred ride vehicle."); return; }
      if (preferredLanguages.length === 0) { setError("Please select at least one guide language."); return; }
      
      // All inputs validated, execute AI calculation
      fetchAICalculations();
      return;
    }
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  // ── API GENERATOR CALL ──
  const fetchAICalculations = async () => {
    setIsLoading(true);
    setLoadingMsgIdx(0);
    setError(null);

    const ageNum = parseInt(age, 10);
    const payload = {
      plain_request: plainRequest,
      name,
      age: Number.isFinite(ageNum) ? String(ageNum) : undefined,
      crew_type: crewType,
      number_of_people: numberOfPeople,
      times_visited_bali: timesVisitedBali,
      from_date: fromDate,
      to_date: toDate,
      international_airport: internationalAirport,
      flight_class: flightClass,
      budget: budgetTier,
      food: foodProtocol,
      diet_choices: dietChoices,
      kitchen: kitchenAccess,
      cook: cookAccompaniment,
      interests: selectedInterests.map(id => INTERESTS.find(i => i.id === id)?.name || id),
      vehicle_type: VEHICLES.find(v => v.id === vehicleType)?.name || vehicleType,
      rent_period: rentPeriod,
      include_driver: includeDriver,
      preferred_languages: preferredLanguages
    };

    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.itinerary) {
        setItinerary(data.itinerary);
        setIsMockResult(!!data.isMock);
        setActiveDayTab(1);
        setStep(6);
      } else {
        setError(data.fields?.[0]?.message ?? data.error ?? "Failed to generate itinerary. Please try again.");
      }
    } catch (e: any) {
      console.error(e);
      setError("Network error calling Gemini itinerary service. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlainEnglishPlan = async () => {
    const brief = plainRequest.trim();
    if (brief.length < 20) {
      setError("Write at least one clear sentence about your trip, group, budget, food, stay or ride needs.");
      return;
    }

    setIsLoading(true);
    setLoadingMsgIdx(0);
    setError(null);
    setPublishedPreview(false);
    setPublishedPreview(false);

    const start = fromDate || todayStr;
    const endDate = toDate || new Date(new Date(start).getTime() + 4 * 86_400_000).toISOString().slice(0, 10);
    const payload = {
      plain_request: brief,
      name: name || "Traveler",
      age: age || "35",
      crew_type: crewType || "plain_english_request",
      number_of_people: numberOfPeople || 2,
      times_visited_bali: timesVisitedBali || "not specified",
      from_date: start,
      to_date: endDate,
      international_airport: internationalAirport || "India",
      flight_class: flightClass,
      budget: budgetTier,
      food: foodProtocol,
      diet_choices: dietChoices,
      kitchen: kitchenAccess,
      cook: cookAccompaniment,
      interests: selectedInterests.map(id => INTERESTS.find(i => i.id === id)?.name || id),
      vehicle_type: VEHICLES.find(v => v.id === vehicleType)?.name || vehicleType || "Private car or van",
      rent_period: rentPeriod,
      include_driver: includeDriver,
      preferred_languages: preferredLanguages.length ? preferredLanguages : ["English", "Hindi"]
    };

    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.itinerary) {
        setItinerary(data.itinerary);
        setIsMockResult(!!data.isMock);
        setActiveDayTab(1);
        setStep(6);
        setPublishedPreview(true);
      } else {
        setError(data.fields?.[0]?.message ?? data.error ?? "Failed to generate itinerary. Please try again.");
      }
    } catch (e: any) {
      console.error(e);
      setError("Network error calling the itinerary service. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate sum of estimated days cost
  const totalCost = itinerary.reduce((sum, item) => sum + (item.estimated_cost_inr || 0), 0);

  // ── WHATSAPP SUMMARY PREPARATION ──
  const getWhatsAppLink = () => {
    const summaryHeader = `*ONLY2BALI TRIP INQUIRY* 🌴\n\n`;
    const details = `• *Lead Name:* ${name} (Age: ${age})\n• *Dates:* ${fromDate} to ${toDate} (${itinerary.length} days)\n• *Group Size:* ${numberOfPeople} pax (${CREW_OPTIONS.find(c => c.id === crewType)?.title})\n• *Departure:* ${internationalAirport} (${flightClass})\n• *Budget Band:* ${budgetTier.toUpperCase()}\n• *Diet:* ${foodProtocol.toUpperCase()} (${dietChoices.join(", ") || "None"})\n• *Cook Accompaniment:* ${cookAccompaniment ? "Yes" : "No"}\n• *Stay Kitchen:* ${kitchenAccess ? "Yes" : "No"}\n• *Vehicle:* ${VEHICLES.find(v => v.id === vehicleType)?.name} (${includeDriver === "Yes" ? "Driver included" : "Self drive"})\n• *Guide:* ${preferredLanguages.join(", ")}\n• *Est. AI Cost:* ₹${totalCost.toLocaleString()} per pax\n\n`;
    const message = `${summaryHeader}${details}Please review and customize this itinerary suggestion for our Balinese group tour!`;
    return wa(message);
  };

  return (
    <main>
      <section>
        <div className="wrap">
          <div className="planner-container">
            <span className="tag">Dynamic Custom Planner</span>

            {step <= 5 && !isLoading && (
              <div className="plain-planner">
                <div className="plain-planner-copy">
                  <span className="tag">Plan Your Trip</span>
                  <h1>Write your Bali trip in plain English.</h1>
                  <p>
                    Tell us the group size, food rules, budget, ride quality, stay style,
                    dates, and anything special. The AI will turn it into a concrete
                    day-by-day tour plan that can be shared with providers.
                  </p>
                </div>
                <div className="plain-planner-box">
                  <label htmlFor="plain-trip-request">Your trip brief</label>
                  <textarea
                    id="plain-trip-request"
                    value={plainRequest}
                    onChange={(e) => setPlainRequest(e.target.value)}
                    rows={7}
                    placeholder="Example: We are 8 people from Mumbai visiting Bali for 5 nights in October. We need vegetarian food, a clean 4-star stay, a comfortable van with driver, Ubud temples, Nusa Dua beach time, one luxury car day, and a total budget around Rs 55,000 per person excluding flights."
                  />
                  <div className="plain-actions">
                    <button className="btn-wizard-next" type="button" onClick={fetchPlainEnglishPlan}>
                      Generate concrete plan
                    </button>
                    <button className="btn-wizard-prev" type="button" onClick={() => setStep(1)}>
                      Use guided form
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar (Visible during Form steps) */}
            {step <= 5 && (
              <div className="wizard-progress-container">
                <div className="wizard-progress-bar" style={{ width: `${(step - 1) * 25}%` }}></div>
              </div>
            )}

            {/* Error alerts */}
            {error && (
              <div className="errmsg okbox" style={{ background: "#fdedec", color: "var(--err)", borderColor: "#fadbd8", marginBottom: "1.5rem" }} role="alert">
                ⚠️ {error}
              </div>
            )}

            {/* ── SCREEN: AI LOADING ── */}
            {isLoading && (
              <div className="ai-loading-container">
                <div className="ai-spinner"></div>
                <div className="ai-loading-message">{LOADING_MESSAGES[loadingMsgIdx]}</div>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Our engine is mapping locations, calculating budgets, and writing day files...</p>
              </div>
            )}

            {!isLoading && (
              <>
                {/* ── STEP 1: CREW & GROUP SIZE ── */}
                {step === 1 && (
                  <div className="wizard-step">
                    <h2 className="step-title">Your Bali Journey Begins Here</h2>
                    <p className="step-desc">The more we know about your travel crew, the better we can craft the matching vibe.</p>

                    <div className="form-group-row">
                      <div className="form-field">
                        <label htmlFor="lead-name">What is your name?</label>
                        <input id="lead-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" />
                      </div>
                      <div className="form-field">
                        <label htmlFor="lead-age">How old are you?</label>
                        <input id="lead-age" type="number" min="1" max="99" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 35" />
                      </div>
                    </div>

                    <div className="form-group-row">
                      <div className="form-field">
                        <label htmlFor="group-size">No of people traveling with you? (pax)</label>
                        <input id="group-size" type="number" min="1" max="150" value={numberOfPeople || ""} onChange={(e) => setNumberOfPeople(parseInt(e.target.value || "0", 10))} placeholder="Total group headcount" />
                      </div>
                      <div className="form-field">
                        <label htmlFor="visited-bali">How many times have you been to Bali?</label>
                        <select id="visited-bali" value={timesVisitedBali} onChange={(e) => setTimesVisitedBali(e.target.value)}>
                          <option value="">Select option</option>
                          <option value="first_time">First Time</option>
                          <option value="more_than_5_times">More than 5 times</option>
                          <option value="frequently_visit">Frequently visit</option>
                        </select>
                      </div>
                    </div>

                    <h4 style={{ color: "var(--emerald-d)", margin: "2rem 0 1rem", textAlign: "center" }}>Tell us about your incredible crew!</h4>
                    <div className="selection-grid">
                      {CREW_OPTIONS.map((crew) => (
                        <button
                          key={crew.id}
                          type="button"
                          aria-pressed={crewType === crew.id}
                          className={`selection-card ${crewType === crew.id ? "selected" : ""}`}
                          onClick={() => setCrewType(crew.id)}
                        >
                          <span className="selection-card-icon">{crew.icon}</span>
                          <span className="selection-card-title">{crew.title}</span>
                          <span className="selection-card-description">{crew.desc}</span>
                          <span className="selection-card-btn">{crewType === crew.id ? "✓ Selected" : "+ Choose"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 2: DATES & DEPARTURE AIRPORT ── */}
                {step === 2 && (
                  <div className="wizard-step">
                    <h2 className="step-title">When will this adventure begin?</h2>
                    <p className="step-desc">Pick your target dates and flights. Flights class and departure cities guide our transport estimates.</p>

                    <div className="form-group-row">
                      <div className="form-field">
                        <label htmlFor="from-date">Departure Date (From)</label>
                        <input id="from-date" type="date" lang="en-IN" min={todayStr} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="to-date">Return Date (To)</label>
                        <input id="to-date" type="date" lang="en-IN" min={fromDate || todayStr} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group-row">
                      <div className="form-field">
                        <label htmlFor="dep-airport">International departure airport in India</label>
                        <select id="dep-airport" value={internationalAirport} onChange={(e) => setInternationalAirport(e.target.value)}>
                          <option value="">Select departure airport</option>
                          {AIRPORTS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label htmlFor="flight-class">Preferred Flight Cabin Class</label>
                        <select id="flight-class" value={flightClass} onChange={(e) => setFlightClass(e.target.value)}>
                          <option value="Economy">Economy Class</option>
                          <option value="Business">Business Class</option>
                          <option value="First Class">First Class</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: INTERESTS & ACCOMMODATIONS ── */}
                {step === 3 && (
                  <div className="wizard-step">
                    <h2 className="step-title">Sightseeing Focus & Stays</h2>
                    <p className="step-desc">Pick what activities interest your group most and how you want to settle down at night.</p>

                    <h4 style={{ color: "var(--emerald-d)", margin: "1rem 0", fontWeight: 700 }}>1. Picture your perfect Bali (Select multiple)</h4>
                    <div className="selection-grid">
                      {INTERESTS.map((i) => {
                        const isSel = selectedInterests.includes(i.id);
                        return (
                          <button
                            key={i.id}
                            type="button"
                            aria-pressed={isSel}
                            className={`selection-card ${isSel ? "selected" : ""}`}
                            onClick={() => handleInterestToggle(i.id)}
                          >
                            <span className="selection-card-icon">{i.icon}</span>
                            <span className="selection-card-title">{i.name}</span>
                            <span className="selection-card-btn">{isSel ? "✓ Selected" : "+ Add"}</span>
                          </button>
                        );
                      })}
                    </div>

                    <h4 style={{ color: "var(--emerald-d)", margin: "2rem 0 1rem", fontWeight: 700 }}>2. Accommodation Type (Select up to 2)</h4>
                    <div className="selection-grid">
                      {STAYS.map((s) => {
                        const isSel = selectedStays.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={isSel}
                            className={`selection-card ${isSel ? "selected" : ""}`}
                            onClick={() => handleStayToggle(s.id)}
                          >
                            <span className="selection-card-icon">{s.icon}</span>
                            <span className="selection-card-title">{s.name}</span>
                            <span className="selection-card-btn">{isSel ? "✓ Selected" : "+ Add"}</span>
                          </button>
                        );
                      })}
                    </div>

                    <h4 style={{ color: "var(--emerald-d)", margin: "2rem 0 1rem", fontWeight: 700 }}>3. Budget Band per person (Ex-flights)</h4>
                    <div className="form-field" style={{ maxWidth: "400px", margin: "0 auto 2rem" }}>
                      <select id="budget-tier" value={budgetTier} onChange={(e) => setBudgetTier(e.target.value as any)}>
                        <option value="economical">Economical — ₹55k-75k (3-star stays)</option>
                        <option value="comfort">Comfort — ₹75k-110k (4-star resort/villas)</option>
                        <option value="premium">Premium — ₹110k+ (5-star private pool villas)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: FOOD PROTOCOLS & INDIAN CATERING ── */}
                {step === 4 && (
                  <div className="wizard-step">
                    <h2 className="step-title">Strict Vegetarian & Jain Catering</h2>
                    <p className="step-desc">The thing you will miss most about India is the food. We confirm Indian standard kitchens and chefs.</p>

                    <div className="form-group-row">
                      <div className="form-field">
                        <label htmlFor="food-protocol">Primary Food Protocol</label>
                        <select id="food-protocol" value={foodProtocol} onChange={(e) => setFoodProtocol(e.target.value as any)}>
                          <option value="vegetarian">Strict Vegetarian</option>
                          <option value="jain">Jain (No onion/garlic/root vegetables)</option>
                          <option value="vegan">Vegan (100% plant-based, dairy-free)</option>
                        </select>
                      </div>
                    </div>

                    <div className="custom-checkbox-row">
                      <label className={`checkbox-pill ${kitchenAccess ? "checked" : ""}`}>
                        <input type="checkbox" checked={kitchenAccess} onChange={(e) => setKitchenAccess(e.target.checked)} />
                        <div className="checkbox-pill-text">
                          <span className="checkbox-pill-title">Stay with private kitchen access</span>
                          <span className="checkbox-pill-desc">Required if you plan to cook your own quick items.</span>
                        </div>
                      </label>

                      <label className={`checkbox-pill ${cookAccompaniment ? "checked" : ""}`}>
                        <input type="checkbox" checked={cookAccompaniment} onChange={(e) => setCookAccompaniment(e.target.checked)} />
                        <div className="checkbox-pill-text">
                          <span className="checkbox-pill-title">Request accompanying Indian cook/catering</span>
                          <span className="checkbox-pill-desc">Strictly requires a group size of 10+ people. We ship Indian kitchenware to Bali.</span>
                        </div>
                      </label>
                    </div>

                    {/* Sub-Preferences Food Chips */}
                    <div className="food-pref-section">
                      <div className="food-pref-title">Indian Vegetarian Selections</div>
                      <div className="food-pref-chips">
                        {FOOD_PREFS.vegetarian.map((f) => (
                          <button key={f.id} className={`food-chip ${dietChoices.includes(f.id) ? "active" : ""}`} onClick={() => handleDietChoiceToggle(f.id)}>
                            {dietChoices.includes(f.id) ? "✓ " : ""} {f.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="food-pref-section">
                      <div className="food-pref-title">Balinese Culinary Options</div>
                      <div className="food-pref-chips">
                        {FOOD_PREFS.balinese.map((f) => (
                          <button key={f.id} className={`food-chip ${dietChoices.includes(f.id) ? "active" : ""}`} onClick={() => handleDietChoiceToggle(f.id)}>
                            {dietChoices.includes(f.id) ? "✓ " : ""} {f.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="food-pref-section">
                      <div className="food-pref-title">Special Dietary</div>
                      <div className="food-pref-chips">
                        {FOOD_PREFS.dietary.map((f) => (
                          <button key={f.id} className={`food-chip ${dietChoices.includes(f.id) ? "active" : ""}`} onClick={() => handleDietChoiceToggle(f.id)}>
                            {dietChoices.includes(f.id) ? "✓ " : ""} {f.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="food-pref-section">
                      <div className="food-pref-title">Non-Vegetarian Preferences</div>
                      <div className="food-pref-chips">
                        {FOOD_PREFS.nonveg.map((f) => (
                          <button key={f.id} className={`food-chip ${dietChoices.includes(f.id) ? "active" : ""}`} onClick={() => handleDietChoiceToggle(f.id)}>
                            {dietChoices.includes(f.id) ? "✓ " : ""} {f.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 5: VEHICLE & GUIDE LANGUAGE ── */}
                {step === 5 && (
                  <div className="wizard-step">
                    <h2 className="step-title">Choose Your Ride & Tour Guide</h2>
                    <p className="step-desc">Traffic or getting lost is a pain in Bali. We secure private cars or buses with local driver support.</p>

                    <h4 style={{ color: "var(--emerald-d)", margin: "1rem 0", fontWeight: 700 }}>1. Type of transport?</h4>
                    <div className="selection-grid">
                      {VEHICLES.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          aria-pressed={vehicleType === v.id}
                          className={`selection-card ${vehicleType === v.id ? "selected" : ""}`}
                          onClick={() => setVehicleType(v.id)}
                        >
                          <span className="selection-card-icon">{v.icon}</span>
                          <span className="selection-card-title">{v.name}</span>
                          <span className="selection-card-btn">{vehicleType === v.id ? "✓ Selected" : "+ Select"}</span>
                        </button>
                      ))}
                    </div>

                    <div className="form-group-row">
                      <div className="form-field">
                        <label htmlFor="rent-period">Rental Period</label>
                        <select id="rent-period" value={rentPeriod} onChange={(e) => setRentPeriod(e.target.value)}>
                          <option value="1-2 Days">1-2 Days</option>
                          <option value=">3 Days">&gt;3 Days</option>
                          <option value="Whole Trip">Whole Trip Duration</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label htmlFor="inc-driver">Include Local Driver?</label>
                        <select id="inc-driver" value={includeDriver} onChange={(e) => setIncludeDriver(e.target.value)}>
                          <option value="Yes">Yes, include private local driver</option>
                          <option value="No">No, self-drive rental</option>
                        </select>
                      </div>
                    </div>

                    <h4 style={{ color: "var(--emerald-d)", margin: "2rem 0 1rem", fontWeight: 700 }}>2. I prefer a tour guide who speaks... (Select multiple)</h4>
                    <div className="checks" style={{ justifyContent: "center", marginBottom: "2rem" }}>
                      {LANGUAGES.map((lang) => {
                        const isSel = preferredLanguages.includes(lang);
                        return (
                          <label key={lang} className={`checks-label ${isSel ? "checked" : ""}`} style={{ cursor: "pointer" }}>
                            <input type="checkbox" checked={isSel} onChange={() => handleLanguageToggle(lang)} style={{ display: "none" }} />
                            <span>{isSel ? "✓ " : "+ "} {lang}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── STEP 6: AI Suggestion results ── */}
                {step === 6 && (
                  <div className="wizard-step itinerary-results">
                    <div className="itinerary-header-banner">
                      <h3 className="itinerary-banner-title">Your Balinese Adventure is Ready!</h3>
                      <p className="itinerary-banner-meta">
                        Custom built for <b>{name}</b> &middot; {numberOfPeople} pax &middot; departures from {internationalAirport.split("(")[0]}
                      </p>
                    </div>

                    <div className="cost-summary-card">
                      <div className="cost-summary-label">
                        <span>ESTIMATED TOTAL PACKAGE COST</span>
                        <p style={{ fontWeight: 500, fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                          Based on {budgetTier} tier accommodation + meals & private transport (ex-flights).
                        </p>
                      </div>
                      <div className="cost-summary-val">
                        ₹{totalCost.toLocaleString()} <small style={{ fontSize: "0.9rem", color: "var(--muted)" }}>per person</small>
                      </div>
                    </div>

                    {isMockResult && (
                      <div className="okbox" style={{ background: "#fef9e7", color: "#b7950b", borderColor: "#f9e79f", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                        💡 <b>Offline Fallback Mode:</b> The live AI API was not reachable or key is not set. We have calculated a structured template itinerary matching your dates and food rules.
                      </div>
                    )}

                    {publishedPreview && (
                      <div className="published-preview">
                        <span className="tag">Published preview</span>
                        <h4>This readable plan is ready for traveler review and provider bidding.</h4>
                        <p>
                          In the live marketplace this plan is saved as a traveler inquiry, then
                          verified providers submit their own itinerary and bid through Only2Bali.
                        </p>
                      </div>
                    )}

                    {numberOfPeople >= 10 && (
                      <div className="okbox" style={{ marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                        {"\u{1F468}\u200D\u{1F373}"} <b>Accompanying Cook qualified:</b> Your large group of {numberOfPeople} pax qualifies for specialized Indian catering chef setups and wholesale pricing.
                      </div>
                    )}

                    {/* Day selector tabs */}
                    <div className="day-tabs">
                      {itinerary.map((item) => (
                        <button key={item.day} className={`day-tab ${activeDayTab === item.day ? "active" : ""}`} onClick={() => setActiveDayTab(item.day)}>
                          Day {item.day}
                        </button>
                      ))}
                    </div>

                    {/* Render Selected Day Detail */}
                    {itinerary.map((dayItem) => {
                      if (dayItem.day !== activeDayTab) return null;
                      return (
                        <div key={dayItem.day} className="day-detail-panel">
                          <div className="day-detail-title-row">
                            <h3 className="day-detail-title">Day {dayItem.day}: {dayItem.title}</h3>
                            <span className="day-detail-date">{dayItem.date}</span>
                          </div>

                          <div className="day-section-card">
                            <div className="day-section-title">📍 Planned Sightseeing & Activities</div>
                            <ul className="day-section-activities-list">
                              {dayItem.activities.map((act, idx) => (
                                <li key={idx}>{act}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="day-section-card">
                            <div className="day-section-title">🍽️ {foodProtocol.toUpperCase()} CATERING SCHEDULE</div>
                            <div className="day-meals-grid">
                              <div className="day-meal-item">
                                <div className="day-meal-item-name">Breakfast</div>
                                <div className="day-meal-item-desc">{dayItem.meals.breakfast}</div>
                              </div>
                              <div className="day-meal-item">
                                <div className="day-meal-item-name">Lunch</div>
                                <div className="day-meal-item-desc">{dayItem.meals.lunch}</div>
                              </div>
                              <div className="day-meal-item">
                                <div className="day-meal-item-name">Dinner</div>
                                <div className="day-meal-item-desc">{dayItem.meals.dinner}</div>
                              </div>
                            </div>
                          </div>

                          <div className="day-group-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="day-section-card" style={{ marginBottom: 0 }}>
                              <div className="day-section-title">🚗 Private Transport</div>
                              <p style={{ fontSize: "0.85rem", color: "var(--ink)" }}>{dayItem.transport}</p>
                            </div>
                            <div className="day-section-card" style={{ marginBottom: 0 }}>
                              <div className="day-section-title">🏨 Recommended stay ({budgetTier})</div>
                              <p style={{ fontSize: "0.85rem", color: "var(--ink)" }}>{dayItem.accommodation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Booking deep links */}
                    <div className="whatsapp-cta-section">
                      <h4 className="whatsapp-cta-title">Love this Itinerary Suggestion?</h4>
                      <p className="whatsapp-cta-subtitle">
                        Send this AI-calculated layout to our WhatsApp team. We will confirm hotel vacancies, check live flight prices, and finalize pricing.
                      </p>
                      {/* The planner never asks for a phone number, so it cannot
                          record a lead by itself. With no WhatsApp number
                          configured, send the visitor to the enquiry form,
                          which does store what they tell it. */}
                      {getWhatsAppLink() ? (
                        <a href={getWhatsAppLink()!} target="_blank" rel="noopener noreferrer" className="btn-whatsapp-deep">
                          💬 Customize & Confirm via WhatsApp
                        </a>
                      ) : (
                        <a href="../inquiry" className="btn-whatsapp-deep">
                          Send this to our travel designer
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* ── FORM NAVIGATION BUTTONS FOOTER ── */}
                {step <= 5 && (
                  <div className="wizard-nav">
                    {step > 1 && (
                      <button className="btn-wizard-prev" onClick={prevStep}>
                        {"\u2190"} Back
                      </button>
                    )}
                    <button className="btn-wizard-next" onClick={nextStep}>
                      {step === 5 ? (
                        <>Generate suggestions & calculate cost {"\u2192"}</>
                      ) : (
                        <>Next step {"\u2192"}</>
                      )}
                    </button>
                  </div>
                )}

                {/* Reset button inside results to plan another */}
                {step === 6 && (
                  <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <button className="btn-wizard-prev" onClick={() => setStep(1)}>
                      {"\u2190"} Plan another trip / Edit preferences
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PlannerWizard() {
  return (
    <Suspense fallback={
      <div className="wrap" style={{ padding: "8rem 0", textAlign: "center" }}>
        <div className="ai-spinner" style={{ margin: "0 auto 1.5rem" }}></div>
        <h3>Loading Itinerary Planner Wizard...</h3>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>Please wait while we initialize the dynamic form setup</p>
      </div>
    }>
      <PlannerWizardComponent />
    </Suspense>
  );
}
