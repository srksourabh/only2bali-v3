"use client";
import { useState } from "react";
import { recommend, validatePlannerInput, type PlannerInput, type Recommendation } from "@/lib/recommend";
import { wa } from "@/lib/config";

const CITIES = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Hyderabad", "Ahmedabad", "Kolkata", "Other"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const LANGS = ["Hindi", "Tamil", "Gujarati", "Telugu", "Kannada", "Marathi", "English"];
const INTERESTS = [
  ["temples", "🛕 Temples"], ["beaches", "🏖️ Beaches"], ["adventure", "🚣 Adventure"],
  ["wellness", "🧘 Wellness"], ["culture", "🎭 Culture & arts"], ["shopping", "🛍️ Shopping"],
] as const;

export default function Planner() {
  const [inp, setInp] = useState<PlannerInput>({
    city: "", month: "", size: 0, budget: "" as PlannerInput["budget"],
    food: "" as PlannerInput["food"], lang: "", kitchen: false, cook: false, interests: [],
  });
  const [err, setErr] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[] | null>(null);

  const set = <K extends keyof PlannerInput>(k: K, v: PlannerInput[K]) =>
    setInp((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validatePlannerInput(inp);
    if (v) { setErr(v); setRecs(null); return; }
    setErr(null);
    setRecs(recommend(inp));
  };

  const summary = `Departure: ${inp.city} · ${inp.month} · ${inp.size} pax · ${inp.food} · ${inp.budget}`;

  return (
    <main><section><div className="wrap">
      <span className="tag">Customized Itinerary Planner</span>
      <h2>Tell us about your group. Get matched itineraries instantly.</h2>
      <p className="sub">Rules-based recommendations you can refine on a call — nothing is booked.</p>

      <form onSubmit={submit} noValidate>
        <div className="row">
          <div><label htmlFor="city">Departure city</label>
            <select id="city" value={inp.city} onChange={(e) => set("city", e.target.value)}>
              <option value="">Select…</option>{CITIES.map((c) => <option key={c}>{c}</option>)}
            </select></div>
          <div><label htmlFor="month">Travel month</label>
            <select id="month" value={inp.month} onChange={(e) => set("month", e.target.value)}>
              <option value="">Select…</option>{MONTHS.map((m) => <option key={m}>{m}</option>)}
            </select></div>
        </div>
        <div className="row">
          <div><label htmlFor="size">Group size (pax)</label>
            <input id="size" type="number" min={2} max={200} value={inp.size || ""} onChange={(e) => set("size", parseInt(e.target.value || "0", 10))} /></div>
          <div><label htmlFor="budget">Budget per person (ex-flights)</label>
            <select id="budget" value={inp.budget} onChange={(e) => set("budget", e.target.value as PlannerInput["budget"])}>
              <option value="">Select…</option>
              <option value="economical">Economical — ₹55–75k</option>
              <option value="comfort">Comfort — ₹75–110k</option>
              <option value="premium">Premium — ₹110k+</option>
            </select></div>
        </div>
        <div className="row">
          <div><label htmlFor="food">Food protocol</label>
            <select id="food" value={inp.food} onChange={(e) => set("food", e.target.value as PlannerInput["food"])}>
              <option value="">Select…</option>
              <option value="jain">Jain (no onion/garlic/root veg)</option>
              <option value="vegetarian">Strict vegetarian</option>
              <option value="vegan">Vegan</option>
            </select></div>
          <div><label htmlFor="lang">Preferred guide language</label>
            <select id="lang" value={inp.lang} onChange={(e) => set("lang", e.target.value)}>
              <option value="">No preference</option>{LANGS.map((l) => <option key={l}>{l}</option>)}
            </select></div>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Interests</label>
          <div className="checks">
            {INTERESTS.map(([v, lbl]) => (
              <label key={v}>
                <input type="checkbox" checked={inp.interests.includes(v)}
                  onChange={(e) => set("interests", e.target.checked ? [...inp.interests, v] : inp.interests.filter((x) => x !== v))} />
                {lbl}
              </label>
            ))}
          </div>
        </div>
        <div className="checks" style={{ marginBottom: "1.2rem" }}>
          <label><input type="checkbox" checked={inp.kitchen} onChange={(e) => set("kitchen", e.target.checked)} /> Need stay with kitchen access</label>
          <label><input type="checkbox" checked={inp.cook} onChange={(e) => set("cook", e.target.checked)} /> Want an accompanying cook</label>
        </div>
        {err && <p className="errmsg" role="alert">{err}</p>}
        <button className="btn btn-g" type="submit">Show My Matched Itineraries</button>
      </form>

      {recs && (
        <div style={{ marginTop: "2rem" }} aria-live="polite">
          <h3 style={{ color: "var(--emerald-d)" }}>Your top matches</h3>
          <p className="fineprint">{summary} — indicative plans, confirmed on consultation.</p>
          {inp.size >= 10 && (
            <p className="fineprint">👨‍🍳 Your group of {inp.size} qualifies for an <b>accompanying cook</b> and group pricing.</p>
          )}
          {recs.map((r) => (
            <div className="card result" key={r.pkg.id}>
              <span className="band">{r.pkg.tier} · {r.pkg.days} days · match score {r.score}</span>
              <h3>{r.pkg.name}</h3>
              <div className="price">{r.pkg.band}</div>
              <ul className="why">{r.why.map((w) => <li key={w}>{w}</li>)}</ul>
              <div className="days"><b>Outline:</b> {r.pkg.outline}</div>
              <a className="btn btn-g" target="_blank" rel="noopener noreferrer"
                href={wa(`Hi Only2Bali! Planner request:\n• Package: ${r.pkg.name}\n• ${summary}${inp.kitchen ? "\n• Kitchen stay needed" : ""}${inp.cook ? "\n• Accompanying cook requested" : ""}${inp.lang ? `\n• Guide language: ${inp.lang}` : ""}${inp.interests.length ? `\n• Interests: ${inp.interests.join(", ")}` : ""}\nPlease customize this for my group.`)}>
                Customize This Trip →
              </a>
            </div>
          ))}
        </div>
      )}
    </div></section></main>
  );
}
