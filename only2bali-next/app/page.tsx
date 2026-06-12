"use client";
import React, { useState } from "react";
import Link from "next/link";
import { CATALOG } from "@/lib/catalog";
import { wa } from "@/lib/config";

export default function Home() {
  const [filter, setFilter] = useState("all");

  const filteredCatalog = CATALOG.filter((p) => {
    if (filter === "all") return true;
    if (filter === "economical" || filter === "premium") return p.tier === filter;
    return p.protocols.includes(filter as any);
  });

  return (
    <main>
      <header className="hero">
        <div className="wrap">
          <span className="tag" style={{ background: "rgba(255,255,255,.12)", color: "#f6b85a" }}>
            India&apos;s first 100% vegetarian Bali travel platform
          </span>
          <h1>
            Bali, the way your family eats.<br />
            <em>Pure veg. Jain. Vegan. Always.</em>
          </h1>
          <p>
            Customized group tours from India with Jain-protocol kitchens, Indian-language guides,
            villas with private cooking facilities — and your own accompanying cook for groups of 10 or more.
          </p>
          <div className="cta">
            <Link className="btn btn-p" href="/planner">Get My Custom Itinerary</Link>
            <Link className="btn btn-o" style={{ borderColor: "#f6b85a", color: "#f6b85a" }} href="/vendors">
              Partner With Us (Bali Vendors)
            </Link>
          </div>
          <div className="trust">
            <div>🥗 <span><b>100%</b> veg-only kitchens</span></div>
            <div>🙏 <span><b>Jain protocol</b> — no onion, garlic or root veg</span></div>
            <div>🗣️ <span>Guides in <b>7 Indian languages</b></span></div>
            <div>👨‍🍳 <span><b>Bring-a-cook</b> for 10+ pax groups</span></div>
          </div>
        </div>
      </header>

      <section id="why">
        <div className="wrap">
          <span className="tag">Why Only2Bali</span>
          <h2>Generic Bali tours weren&apos;t built for you. This one is.</h2>
          <p className="sub">
            Most Bali operators add a &quot;veg option&quot; as an afterthought. We built the entire platform
            around it — every restaurant verified, every kitchen audited, every itinerary planned around
            how your group actually eats, prays and travels.
          </p>
          <div className="grid g3">
            <div className="card"><h3>🍛 Food-first planning</h3><p>Indian, Indonesian and Chinese vegetarian, Jain and vegan menus — pre-confirmed before you fly, meal by meal.</p></div>
            <div className="card"><h3>🛕 Culturally fluent</h3><p>Temple-friendly schedules, satvik options for Brahmin travelers, sunset-meal timing for Jain groups, and festival-aware planning.</p></div>
            <div className="card"><h3>✨ Economical to premium</h3><p>Honest banded pricing from value group trips to private-villa celebrations. Customized, never cookie-cutter.</p></div>
          </div>
        </div>
      </section>

      <section id="packages" className="alt">
        <div className="wrap">
          <span className="tag">Curated Packages</span>
          <h2>Vegetarian Bali packages, by protocol &amp; budget</h2>
          <p className="sub">Filter by your food protocol. Every package below is indicative and fully customizable — final itineraries are tailored to your group on consultation.</p>
          
          <div className="filters" id="pkgFilters" role="group" aria-label="Filter packages">
            {(["all", "jain", "vegetarian", "vegan", "economical", "premium"] as const).map((f) => (
              <button
                key={f}
                className={`fbtn ${filter === f ? "on" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid g3">
            {filteredCatalog.map((p) => (
              <div className="card" key={p.id}>
                <span className="band">{p.tier} · {p.days} days</span>
                <h3>{p.name}</h3>
                <div className="price">{p.band} <small>ex-flights · indicative</small></div>
                <p style={{ fontSize: ".9rem", color: "var(--muted)" }}>{p.blurb}</p>
                <div className="chips">
                  {p.protocols.map((x) => (
                    <span className="chip" key={x}>
                      {x === "jain" ? "Jain ✓" : x.charAt(0).toUpperCase() + x.slice(1) + " ✓"}
                    </span>
                  ))}
                  {p.kitchen && <span className="chip">Kitchen stay</span>}
                  {p.cookReady && <span className="chip">Cook option</span>}
                </div>
                <a className="btn btn-o" style={{ marginTop: ".6rem", fontSize: ".85rem", padding: ".5rem 1.1rem" }}
                   href={wa(`Hi Only2Bali! I'm interested in the ${p.name} package. Please share details.`)}
                   target="_blank" rel="noopener noreferrer">
                  Enquire on WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="food" className="alt">
        <div className="wrap">
          <span className="tag">Food Preferences</span>
          <h2>Three cuisines. Three protocols. Zero compromise.</h2>
          <p className="sub">Every meal on your itinerary is pre-planned and confirmed with our verified kitchen partners across Bali.</p>
          <div className="grid g3">
            <div className="card">
              <h3>Jain</h3>
              <p className="quote" style={{ fontStyle: "normal" }}>No onion, no garlic, no root vegetables. Sunset-meal timing on request. Dedicated Jain-trained kitchens in Ubud, Kuta and Nusa Dua areas.</p>
              <div className="chips">
                <span className="chip">Gujarati thali</span>
                <span className="chip">Jain Indonesian nasi</span>
                <span className="chip">Jain Chinese</span>
              </div>
            </div>
            <div className="card">
              <h3>Vegetarian</h3>
              <p className="quote" style={{ fontStyle: "normal" }}>Strict veg — no egg by default, dairy welcome. Satvik options for Brahmin community travelers, including temple-day meal plans.</p>
              <div className="chips">
                <span className="chip">North &amp; South Indian</span>
                <span className="chip">Veg gado-gado</span>
                <span className="chip">Veg dim sum</span>
              </div>
            </div>
            <div className="card">
              <h3>Vegan</h3>
              <p className="quote" style={{ fontStyle: "normal" }}>Bali is one of Asia&apos;s best vegan destinations — we curate its finest plant-based cafés alongside vegan Indian and Chinese meals.</p>
              <div className="chips">
                <span className="chip">Vegan warungs</span>
                <span className="chip">Plant-based Indian</span>
                <span className="chip">Raw &amp; smoothie bars</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stays">
        <div className="wrap">
          <span className="tag">Stays, Kitchens &amp; Your Own Cook</span>
          <h2>Villas with kitchens. Hotels with veg meal support. Or bring a cook.</h2>
          <div className="grid g3">
            <div className="card">
              <h3>🏡 Private villas with kitchens</h3>
              <p className="quote" style={{ fontStyle: "normal" }}>Group villas (4–30 pax) with full cooking facilities, utensils suited to Indian cooking, and grocery pre-stocking on request.</p>
            </div>
            <div className="card">
              <h3>🏨 Veg-supportive hotels</h3>
              <p className="quote" style={{ fontStyle: "normal" }}>Hotels whose kitchens we&apos;ve personally verified for separate veg preparation and Jain-protocol capability.</p>
            </div>
            <div className="card" style={{ border: "2px solid var(--saffron)" }}>
              <h3>👨‍🍳 Bring-a-cook (10+ pax)</h3>
              <p className="quote" style={{ fontStyle: "normal" }}>For groups of 10 or more, request a dedicated accompanying cook — Indian-cuisine trained, Jain-protocol aware — for your entire stay.</p>
              <Link className="btn btn-p" style={{ marginTop: ".8rem" }} href="/inquiry">Request a Cook</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="guides" className="alt">
        <div className="wrap">
          <span className="tag">Guides Who Speak Your Language</span>
          <h2>Explore Bali in Hindi, Tamil, Gujarati, Telugu, Kannada or Marathi</h2>
          <p className="sub">Our Bali guide network includes Indian-language speakers who understand both cultures — temple etiquette, food sensitivities and family travel rhythms included.</p>
          <div className="chips" style={{ fontSize: "1rem" }}>
            <span className="chip">हिन्दी Hindi</span>
            <span className="chip">தமிழ் Tamil</span>
            <span className="chip">ગુજરાતી Gujarati</span>
            <span className="chip">తెలుగు Telugu</span>
            <span className="chip">ಕನ್ನಡ Kannada</span>
            <span className="chip">मराठी Marathi</span>
            <span className="chip">English</span>
          </div>
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

      <section id="faq">
        <div className="wrap">
          <span className="tag">FAQ</span>
          <h2>Common questions</h2>
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
            <p>Use the vendor form above. We verify dietary capability, visit where possible, and onboard partners who meet our protocol standards.</p>
          </details>
        </div>
      </section>

      <section>
        <div className="wrap">
          <span className="tag">Plan Your Trip</span>
          <h2>Ready for a custom plan?</h2>
          <p className="sub">Use the itinerary planner for instant matched suggestions, or send a group inquiry and our travel designer will call you back.</p>
          <Link className="btn btn-g" href="/planner">Open the Itinerary Planner →</Link>{" "}
          <Link className="btn btn-o" href="/inquiry">Send a Group Inquiry</Link>
        </div>
      </section>
    </main>
  );
}
