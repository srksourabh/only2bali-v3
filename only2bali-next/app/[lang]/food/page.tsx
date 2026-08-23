import Link from "next/link";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Food protocols — Only2Bali",
  description:
    "Jain, vegetarian and vegan kitchen protocols audited at every partner restaurant, villa and hotel.",
};

export default async function Food({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;

  return (
    <main>
      <header className="hero">
        <div className="wrap">
          <span className="tag" style={{ background: "rgba(255,255,255,.12)", color: "#f6b85a" }}>
            Food Security
          </span>
          <h1>Three Cuisines. Three Protocols. Zero Compromise.</h1>
          <p>
            No hidden animal fats, no cross-contamination, separate oils and utensils. Enjoy local Indonesian specialties alongside familiar Indian home tastes.
          </p>
          <div className="cta">
            <Link className="btn btn-p" href={`/${lang}/planner`}>Plan My Diet Plan</Link>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <span className="tag">Our Dietary Protocols</span>
          <h2>We audit the kitchens so you can enjoy the holiday</h2>
          <p className="sub">Whether you observe Jain protocol, strict vegetarianism (no egg), or require plant-based vegan meals, we ensure strict compliance at every partner warung, restaurant, and hotel.</p>

          <div className="grid g3">
            <div className="card">
              <h3>Jain Protocol</h3>
              <p>Strictly excludes onion, garlic, potatoes, carrots, radishes, ginger, and other root vegetables. Prepared in sterilized, separate pans with fresh oils. Sunset meals pre-scheduled upon request.</p>
              <div className="chips">
                <span className="chip">Jain Gujarati thali</span>
                <span className="chip">Jain Nasi Goreng</span>
                <span className="chip">Jain Chinese dim sum</span>
              </div>
            </div>

            <div className="card">
              <h3>Strict Vegetarian</h3>
              <p>100% vegetarian. Excludes eggs, gelatin, bone dust filters, and animal-derived thickeners. Separated storage and prep surfaces. Satvik/Brahmin options available.</p>
              <div className="chips">
                <span className="chip">North Indian paneer</span>
                <span className="chip">South Indian idli/dosa</span>
                <span className="chip">Vegetarian gado-gado</span>
              </div>
            </div>

            <div className="card">
              <h3>100% Vegan</h3>
              <p>Plant-based meals. Excludes dairy, honey, ghee, and all animal products. Bali boasts some of the finest raw vegan cafés in Southeast Asia, which we curate for you.</p>
              <div className="chips">
                <span className="chip">Vegan smoothie bowls</span>
                <span className="chip">Plant-based curries</span>
                <span className="chip">Tofu &amp; tempeh warungs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="alt">
        <div className="wrap">
          <span className="tag">Kitchen Certifications</span>
          <h2>How we audit our Bali partners</h2>
          <p className="sub">Every kitchen we onboard goes through a rigorous inspection by our local operations lead in Bali.</p>
          <div className="grid g2">
            <div className="card">
              <h3>Multi-Step Auditing</h3>
              <p>We inspect: raw material sourcing, oil containers, utensils, separate workspaces, staff knowledge of Jain restrictions, and dish-washing protocols to prevent cross-contamination.</p>
            </div>
            <div className="card">
              <h3>Custom Catering</h3>
              <p>If your group has highly specific requirements (e.g. Satvik food without onions, prepared by Brahmin chefs), we can arrange private catering and kitchen setups in your rented villa.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
