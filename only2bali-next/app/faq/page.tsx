import Link from "next/link";

export default function FAQ() {
  return (
    <main>
      <header className="hero">
        <div className="wrap">
          <span className="tag" style={{ background: "rgba(255,255,255,.12)", color: "#f6b85a" }}>
            FAQ &amp; Testimonials
          </span>
          <h1>Common Questions &amp; Traveler Stories</h1>
          <p>
            Find answers to practical questions about visas, cooking options, group travel, and custom requirements.
          </p>
          <div className="cta">
            <Link className="btn btn-p" href="/inquiry">Ask A Question</Link>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <span className="tag">Questions</span>
          <h2>Frequently Asked Questions</h2>
          <br />
          <details>
            <summary>Is the food really 100% vegetarian — including cooking surfaces and oil?</summary>
            <p>Yes. We only work with kitchens that are fully vegetarian or have audited separate veg preparation lines, utensils and oils. Jain meals follow no-onion, no-garlic, no-root-vegetable protocol.</p>
          </details>
          <details>
            <summary>How does the accompanying cook work for 10+ pax groups?</summary>
            <p>We arrange an Indian-cuisine-trained cook who travels with your group or is stationed at your villa, shops for groceries, and prepares meals to your protocol throughout the stay. Costs are quoted per group.</p>
          </details>
          <details>
            <summary>Can you plan around temple visits and religious observances?</summary>
            <p>Absolutely — early-morning temple circuits, satvik meal days, sunset-meal timing for Jain travelers, and festival-aware scheduling are all standard for us.</p>
          </details>
          <details>
            <summary>What&apos;s included in package pricing?</summary>
            <p>Indicative bands cover stays, all meals per your protocol, private transport, guide and activities — excluding international flights and visa-on-arrival. Final quotes follow consultation.</p>
          </details>
          <details>
            <summary>Do you handle flights from India?</summary>
            <p>We advise on best routes and fares from your departure city (direct and via Singapore/KL) and can book on request.</p>
          </details>
          <details>
            <summary>I run a business in Bali — how do I join?</summary>
            <p>Use our vendor onboarding form. We verify dietary capability, visit where possible, and onboard partners who meet our protocol standards.</p>
          </details>
        </div>
      </section>

      <section className="alt">
        <div className="wrap">
          <span className="tag">Traveler Stories</span>
          <h2>Groups like yours, fed like family</h2>
          <p className="sample">Sample testimonials for layout — replace with verified reviews before launch</p>
          <div className="grid g3" style={{ marginTop: "1.2rem" }}>
            <div className="card">
              <p className="quote">&quot;14 of us, all Jain. Not one meal worry in 6 days — even the boat-day lunch was protocol-perfect.&quot;</p>
              <p className="who">Mehta family group · Ahmedabad <span className="sample">(sample)</span></p>
            </div>
            <div className="card">
              <p className="quote">&quot;Our guide spoke Tamil with my parents and English with the kids. The temple mornings were beautifully planned.&quot;</p>
              <p className="who">Iyer group · Chennai <span className="sample">(sample)</span></p>
            </div>
            <div className="card">
              <p className="quote">&quot;The villa kitchen plus our own cook made it feel like a holiday, not a hunt for food.&quot;</p>
              <p className="who">Vegan friends&apos; group · Bengaluru <span className="sample">(sample)</span></p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
