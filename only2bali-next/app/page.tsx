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
      {/* ── 1. HERO SECTION ── */}
      <header className="hero-custom">
        <div className="wrap">
          <span className="tag" style={{ background: "rgba(255,255,255,.15)", color: "#f6b85a", fontSize: "0.8rem" }}>
            India&apos;s First Bali Trip Planner For Indian Travelers
          </span>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, lineHeight: 1.1, textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
            Only2Bali.com
          </h1>
          <p style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", color: "#f6b85a", fontWeight: 500, margin: "0.5rem 0 1.5rem" }}>
            Your Bali Dream, Perfectly Crafted
          </p>
          <p style={{ maxWidth: "660px", color: "#dcebe6", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2.2rem" }}>
            Create your ideal Balinese adventure. We connect you with local experts to design a culturally immersive experience uniquely suited to your Indian vegetarian, Jain, and vegan preferences.
          </p>
          <div className="cta" style={{ display: "flex", gap: "1.2rem" }}>
            <Link className="btn btn-p" href="/planner" style={{ padding: "0.9rem 2rem", fontSize: "1.02rem" }}>
              Plan My Trip &darr;
            </Link>
            <Link className="btn btn-o" style={{ borderColor: "#f6b85a", color: "#f6b85a", padding: "0.9rem 2rem" }} href="/vendors">
              Partner With Us
            </Link>
          </div>
          
          <div className="trust" style={{ marginTop: "3rem" }}>
            <div>🥗 <span><b>100%</b> veg-only kitchens</span></div>
            <div>🙏 <span><b>Jain protocol</b> — no onion, garlic or root veg</span></div>
            <div>🗣️ <span>Guides in <b>7 Indian languages</b></span></div>
            <div>👨‍🍳 <span><b>Accompanying Cook</b> setup for 10+ pax</span></div>
          </div>
        </div>
      </header>

      {/* ── 2. NEW OVERLAPPING ABOUT US SECTION ── */}
      <section className="about-custom" id="about">
        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "3rem", alignItems: "center" }}>
            
            <div className="about-textbox">
              <span className="tag">About Us</span>
              <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#4b352d", marginBottom: "1rem" }}>
                The 1st Bali Trip Planner for Indian Travelers
              </h2>
              <p style={{ color: "#4b352d", fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.2rem", textAlign: "justify" }}>
                Planning a Bali trip should be exciting, not overwhelming. At Only2Bali, <span className="about-p-span">the only Bali trip planner built exclusively for India</span>, we take the stress out of planning by connecting you with trusted local experts who create your ideal Balinese getaway. Think of us as more than a booking platform—we&apos;re your personal travel companions!
              </p>
              <p style={{ color: "#4b352d", fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.8rem", textAlign: "justify" }}>
                As a dedicated platform for <span className="about-p-span">Indian travelers</span>, we deeply understand your preferences. Our curated selection of local partners ensures culturally sensitive experiences, from accommodations tailored to your needs to activities that reflect your interests. <b>We cater strictly to vegetarian, Jain, and vegan lifestyles.</b> Let&apos;s create unforgettable memories together!
              </p>
              <Link className="btn btn-g" href="/planner" style={{ background: "#4b352d", borderColor: "#4b352d" }}>
                Create Your Memories &darr;
              </Link>
            </div>

            <div className="about-images-group">
              <img src="/Asset/aboutusgrp.png" alt="Bali group vacation" className="about-image-1" />
              <img src="/Asset/aboutusimg.png" alt="Balinese traditional scenery" className="about-image-2" />
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. UPGRADED WHY US SECTION (WITH LEGACY BOX ASSETS) ── */}
      <section className="whyus-custom" id="whyus">
        <div className="wrap" style={{ textAlign: "center" }}>
          <span className="tag">Why Us</span>
          <h2 style={{ fontSize: "2.3rem", fontWeight: 800, color: "#4b352d", marginBottom: "0.4rem" }}>
            We&apos;re not a booking platform, we&apos;re your personal travel friends
          </h2>
          <p className="sub" style={{ color: "#4b352d", margin: "0 auto 2.5rem", maxWidth: "600px" }}>
            Generic Bali operators add a &quot;veg option&quot; as an afterthought. We built our entire platform around Indian travel sensibilities.
          </p>

          <div className="whyus-box">
            <div className="whyus-card">
              <img src="/Asset/Whyusbox1.png" alt="Culturally Sensitive" className="whyus-card-img" />
              <div className="whyus-card-content">
                <h3 className="whyus-card-title">Culturally Sensitive Experiences</h3>
                <p className="whyus-card-desc">
                  Indian preferences are rich in culture. Our partnerships with local Balinese experts ensure your trip is not just enjoyable but also respectful and culturally enriching.
                </p>
              </div>
            </div>

            <div className="whyus-card">
              <img src="/Asset/Whyusbox2.png" alt="Trusted Local Partner" className="whyus-card-img" />
              <div className="whyus-card-content">
                <h3 className="whyus-card-title">Trusted Local Partner</h3>
                <p className="whyus-card-desc">
                  Trust is a must. We only work with vetted and reliable partners in Bali, ensuring a seamless and stress-free experience from beginning to end.
                </p>
              </div>
            </div>

            <div className="whyus-card">
              <img src="/Asset/Whyusbox3.png" alt="Highly Customizable" className="whyus-card-img" />
              <div className="whyus-card-content">
                <h3 className="whyus-card-title">Highly Customizable Itineraries</h3>
                <p className="whyus-card-desc">
                  We don&apos;t believe in one-size-fits-all travel. Work with us to create an itinerary that perfectly aligns with your interests, budget, and group size (families, retreats, or honeymoons).
                </p>
              </div>
            </div>

            <div className="whyus-card">
              <img src="/Asset/Whyusbox4.png" alt="Dedicated Support" className="whyus-card-img" />
              <div className="whyus-card-content">
                <h3 className="whyus-card-title">Dedicated Support</h3>
                <p className="whyus-card-desc">
                  We assist you like your closest friends. Our team is here to support you every step of the way, offering personalized adjustments and answering queries instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SIGHTSEEING DESTINATIONS SECTION (WITH SLIDE ASSETS) ── */}
      <section className="destinations-custom" id="destinations">
        <div className="wrap" style={{ textAlign: "center" }}>
          <span className="tag">Destinations</span>
          <h2 style={{ fontSize: "2.3rem", fontWeight: 800, color: "#4b352d", marginBottom: "0.4rem" }}>
            Your Personalized Bali Awaits
          </h2>
          <p className="sub" style={{ color: "#4b352d", margin: "0 auto 2.5rem" }}>
            Discover Bali&apos;s wonders designed for Indian family groups and couples.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            <div className="card" style={{ padding: 0, overflow: "hidden", border: "1.5px solid var(--line)" }}>
              <img src="/Asset/D-card-img1.png" alt="Natural beauty" style={{ width: "100%", height: "200px", objectFit: "cover" }} />
              <div style={{ padding: "1.2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4b352d" }}>Natural Beauty and Beaches</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "justify", marginTop: "0.5rem" }}>
                  Relax and Explore - Enjoy beautiful beaches like Nusa Dua, peaceful rice paddies in Tegallalang, and stunning cliff views at Uluwatu Temple.
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden", border: "1.5px solid var(--line)" }}>
              <img src="/Asset/D-card-img2.png" alt="Culture" style={{ width: "100%", height: "200px", objectFit: "cover" }} />
              <div style={{ padding: "1.2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4b352d" }}>Local Culture & Traditions</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "justify", marginTop: "0.5rem" }}>
                  Experience Bali&apos;s Heart - Explore the Ubud Monkey Forest, see the holy Tanah Lot sea temple, and enjoy a traditional Balinese dance performance.
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden", border: "1.5px solid var(--line)" }}>
              <img src="/Asset/D-card-img3.png" alt="Wellness" style={{ width: "100%", height: "200px", objectFit: "cover" }} />
              <div style={{ padding: "1.2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4b352d" }}>Wellness & Relaxation</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "justify", marginTop: "0.5rem" }}>
                  Unwind and Rejuvenate - Relax with luxurious flower-bath spas in Ubud, yoga overlooking Canggu beaches, or a traditional therapeutic massage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. CURATED PACKAGES SECTION (FUSION WITH DYNAMIC FILTERS) ── */}
      <section id="packages" className="alt" style={{ padding: "80px 0" }}>
        <div className="wrap">
          <span className="tag">Custom Group Packages</span>
          <h2>Vegetarian Bali Packages, By Protocol &amp; Budget</h2>
          <p className="sub">
            Filter by your food protocol. Every package below is indicative and fully customizable — final itineraries are dynamically compiled by the AI planner or tailored on call.
          </p>
          
          <div className="filters" id="pkgFilters" role="group" aria-label="Filter packages" style={{ justifyContent: "center" }}>
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
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.8rem" }}>
                  <a className="btn btn-o" style={{ fontSize: ".85rem", padding: ".5rem 1.1rem" }}
                     href={wa(`Hi Only2Bali! I'm interested in the ${p.name} package. Please share details.`)}
                     target="_blank" rel="noopener noreferrer">
                    Enquire on WhatsApp
                  </a>
                  <Link className="btn btn-p" style={{ fontSize: ".85rem", padding: ".5rem 1.1rem", border: "1.5px solid var(--emerald)", background: "var(--emerald)", color: "#fff" }}
                        href={`/planner?package=${p.id}`}>
                    Customize with AI ✨
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FOOD PROTOCOLS DETAILED ── */}
      <section id="food" style={{ padding: "80px 0" }}>
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

      {/* ── 7. STAYS & ACCOMPANYING INDIAN COOK (WITH BOY/GIRL COOK GRAPHIC) ── */}
      <section id="stays" className="alt" style={{ padding: "80px 0" }}>
        <div className="wrap">
          <span className="tag">Stays, Kitchens &amp; Your Own Cook</span>
          <h2>Villas with kitchens. Hotels with veg support. Or bring a cook.</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "3rem", alignItems: "center", marginTop: "2rem" }}>
            <div className="grid g2">
              <div className="card">
                <h3>🏡 Private villas with kitchens</h3>
                <p className="quote" style={{ fontStyle: "normal", fontSize: "0.9rem" }}>Group villas (4–30 pax) with full cooking facilities, utensils suited to Indian cooking, and grocery pre-stocking on request.</p>
              </div>
              <div className="card">
                <h3>🏨 Veg-supportive hotels</h3>
                <p className="quote" style={{ fontStyle: "normal", fontSize: "0.9rem" }}>Hotels whose kitchens we&apos;ve personally verified for separate veg preparation and Jain-protocol capability.</p>
              </div>
              <div className="card" style={{ border: "2px solid var(--saffron)", gridColumn: "span 2" }}>
                <h3>👨&zwj;🍳 Bring-a-cook (10+ pax)</h3>
                <p className="quote" style={{ fontStyle: "normal", fontSize: "0.9rem" }}>
                  For groups of 10 or more, request a dedicated accompanying cook — Indian-cuisine trained, Jain-protocol aware — for your entire stay. We secure raw ingredients and kitchenware.
                </p>
                <Link className="btn btn-p" style={{ marginTop: ".8rem" }} href="/inquiry">Request a Cook</Link>
              </div>
            </div>

            {/* FUSION GRAPHIC: Chef boy/girl illustration */}
            <div style={{ textAlign: "center" }}>
              <img src="/Asset/COOK.png" alt="Balinese Chef Illustration" style={{ width: "100%", maxHeight: "350px", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.15))" }} />
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.5rem", fontStyle: "italic" }}>Balinese &amp; Indian style culinary expert setup</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. INDIAN LANGUAGE GUIDES (WITH BOY/GIRL TOUR GUIDE GRAPHIC) ── */}
      <section id="guides" style={{ padding: "80px 0" }}>
        <div className="wrap">
          <span className="tag">Guides Who Speak Your Language</span>
          <h2>Explore Bali in Hindi, Tamil, Gujarati, Telugu, Kannada or Marathi</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "3rem", alignItems: "center", marginTop: "2rem" }}>
            {/* FUSION GRAPHIC: Guide boy/girl illustration */}
            <div style={{ textAlign: "center" }}>
              <img src="/Asset/TOURGUIDE.png" alt="Balinese Local Guide Illustration" style={{ width: "100%", maxHeight: "350px", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.15))" }} />
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.5rem", fontStyle: "italic" }}>Your friendly local Balinese travel buddy</p>
            </div>

            <div>
              <p className="sub" style={{ width: "100%", marginBottom: "1.5rem" }}>
                Our Bali guide network includes Indian-language speakers who understand both cultures — temple etiquette, food sensitivities, and family travel rhythms included.
              </p>
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
          </div>
        </div>
      </section>

      {/* ── 9. TRAVELER STORIES ── */}
      <section className="alt" style={{ padding: "80px 0" }}>
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

      {/* ── 10. FAQ SECTION ── */}
      <section id="faq" style={{ padding: "80px 0" }}>
        <div className="wrap">
          <span className="tag">FAQ</span>
          <h2>Common Questions</h2>
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
        </div>
      </section>

      {/* ── 11. GET STARTED BANNER SECTION ── */}
      <section className="getstarted-custom">
        <div className="wrap">
          <h2 className="getstarted-title">
            Get Your Itinerary<br /> in Just a Few Minutes
          </h2>
          <p style={{ color: "#4b352d", fontSize: "1.05rem", fontWeight: 600, marginBottom: "2rem" }}>
            Fusing local Balinese expertise with strict Indian dietary protocols.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link className="btn btn-g" href="/planner" style={{ background: "#4b352d", borderColor: "#4b352d", padding: "0.9rem 2.2rem" }}>
              Open Itinerary Planner →
            </Link>
            <Link className="btn btn-o" href="/inquiry" style={{ borderColor: "#4b352d", color: "#4b352d", padding: "0.9rem 2.2rem" }}>
              Send a Group Inquiry
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
