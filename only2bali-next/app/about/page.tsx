import Link from "next/link";

export default function About() {
  return (
    <main>
      <header className="hero">
        <div className="wrap">
          <span className="tag" style={{ background: "rgba(255,255,255,.12)", color: "#f6b85a" }}>
            Why Only2Bali
          </span>
          <h1>Generic Bali tours weren&apos;t built for Indian families. We are.</h1>
          <p>
            Learn about our core pillars of food security, kitchen access, private cooks, and local guides who speak your language.
          </p>
          <div className="cta">
            <Link className="btn btn-p" href="/inquiry">Request a Custom Trip Proposal</Link>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <span className="tag">Our Story</span>
          <h2>Zero food anxiety. Full travel delight.</h2>
          <p className="sub" style={{ maxWidth: "800px" }}>
            Only2Bali was founded when we realized how hard it is for pure vegetarian, Jain, and vegan groups from India to find food security in Bali. Vacation is a time to relax, not to worry about cross-contamination or hidden ingredients. 
          </p>
          <p style={{ maxWidth: "800px", marginBottom: "2rem" }}>
            We hand-select and audit every single villa, hotel kitchen, and catering partner to ensure they comply strictly with our protocols. When we say Jain, we mean 100% no onion, garlic, or root vegetables prepared in separate, sterilized vessels.
          </p>
        </div>
      </section>

      <section id="stays" className="alt">
        <div className="wrap">
          <span className="tag">Accommodations</span>
          <h2>Stays built around how you live &amp; travel</h2>
          <p className="sub">Whether you prefer luxury private villa estates with your own kitchen facilities or verified veg-supportive resort hotels, we have curated options for every budget.</p>
          <div className="grid g3">
            <div className="card">
              <h3>🏡 Villa Estates with Kitchens</h3>
              <p>For groups of 4 to 30 travelers, we book private villa estates featuring separate, fully equipped kitchen facilities, complete with spices, grains, and cookware suitable for Indian cooking.</p>
            </div>
            <div className="card">
              <h3>🏨 Audited Resort Hotels</h3>
              <p>For individuals and couples, we work with hotels that separate veg and non-veg prep, oils, and cookware. You get stress-free breakfast buffets and pre-vetted dining options.</p>
            </div>
            <div className="card" style={{ border: "2px solid var(--saffron)" }}>
              <h3>👨‍🍳 Bring-A-Cook Program (10+ Pax)</h3>
              <p>For groups of 10 or more, we arrange an experienced Indian-cuisine chef who accompanies your group throughout the trip to handle all grocery shopping and prepare home-style satvik or Jain meals.</p>
              <Link className="btn btn-p" style={{ marginTop: "1rem" }} href="/inquiry">
                Enquire for Group Cooking
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="guides">
        <div className="wrap">
          <span className="tag">Indian-Language Guides</span>
          <h2>Your cultural bridge in Bali</h2>
          <p className="sub">Language barriers can turn a smooth tour into a struggle. Our handpicked Bali guide network includes native speakers of major Indian languages.</p>
          <div className="grid g3">
            <div className="card">
              <h3>🗣️ Multi-Lingual Support</h3>
              <p>Our tour guides speak fluent Hindi, Tamil, Gujarati, Telugu, Kannada, or Marathi. They are experts in explaining Balinese culture, history, and Hindu connections.</p>
            </div>
            <div className="card">
              <h3>🙏 Protocol &amp; Etiquette Aware</h3>
              <p>Guides are pre-trained on Indian dietary protocols and temple etiquettes, ensuring your elderly parents or group members feel safe, respected, and understood.</p>
            </div>
            <div className="card">
              <h3>❤️ Family Travel Rhythm</h3>
              <p>We design schedules that leave room for rest, early dinners (Jain sunset timings), and temple-day fasting preferences.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
