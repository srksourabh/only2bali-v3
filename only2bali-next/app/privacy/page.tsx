import Link from "next/link";

export default function Privacy() {
  return (
    <main>
      <header className="hero">
        <div className="wrap">
          <h1>Privacy Policy</h1>
          <p>Last updated: June 2026</p>
        </div>
      </header>

      <section>
        <div className="wrap" style={{ maxWidth: "800px" }}>
          <h2>1. Information We Collect</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            We collect information you provide directly to us when planning a trip or applying as a vendor. This includes your name, email address, phone/WhatsApp number, departure city, group size, and specific food protocols (Jain, vegetarian, or vegan).
          </p>

          <h2>2. How We Use Your Information</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            We use the information we collect to create customized travel itineraries, coordinate with verified local Bali vendors, send booking confirmations, and connect you with travel coordinators.
          </p>

          <h2>3. Data Protection &amp; Sharing</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            We do not sell your personal data. We only share essential details with handpicked vendor partners in Bali (hotels, transport, chefs) to service your booking requests.
          </p>

          <h2>4. Contact Us</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            For questions about this policy, email us at <a href="mailto:hello@only2bali.com" style={{ color: "var(--emerald)" }}>hello@only2bali.com</a>.
          </p>

          <Link href="/" className="btn btn-g" style={{ marginTop: "2rem" }}>Back to Home</Link>
        </div>
      </section>
    </main>
  );
}
