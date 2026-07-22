import Link from "next/link";

export default function Terms() {
  return (
    <main>
      <header className="hero">
        <div className="wrap">
          <h1>Terms &amp; Conditions</h1>
          <p>Last updated: June 2026</p>
        </div>
      </header>

      <section>
        <div className="wrap" style={{ maxWidth: "800px" }}>
          <h2>1. Agreement to Terms</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            By accessing Only2Bali.com, you agree to comply with and be bound by these Terms &amp; Conditions.
          </p>

          <h2>2. Services &amp; Customization</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            All itineraries generated on the site are indicative recommendations. Final quotes, schedules, and custom dietary setups will be pre-agreed and locked during direct consultation with our coordinators.
          </p>

          <h2>3. Bring-a-Cook &amp; Group Requirements</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            Our accompanying chef program requires a minimum group size of 10 passengers. For groups smaller than 10, separate cook setup rates can be negotiated separately.
          </p>

          <h2>4. Vendor Partner Responsibilities</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            We audit local transport, hotels, and kitchens. However, local partners operate independently. Only2Bali acts as your coordinator to ensure protocol conformity.
          </p>

          <h2>5. Contact Information</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            For details about terms and bookings, please reach out to <a href="mailto:hello@only2bali.com" style={{ color: "var(--emerald)" }}>hello@only2bali.com</a>.
          </p>

          <Link href="/" className="btn btn-g" style={{ marginTop: "2rem" }}>Back to Home</Link>
        </div>
      </section>
    </main>
  );
}
