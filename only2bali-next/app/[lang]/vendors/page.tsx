import { canDeliver } from "@/lib/auth/delivery";
import VendorApplyForm from "./VendorApplyForm";

export const dynamic = "force-dynamic";

export default function Vendors() {
  return (
    <main>
      <section>
        <div className="wrap">
          <span className="tag">Bali Vendor Onboarding</span>
          <h2>List my business as a provider</h2>
          <p className="sub">
            We onboard vegetarian restaurants, vegan cafés, Jain-capable kitchens, villas with
            kitchens, veg-supportive hotels, transport providers, Indian-language guides, chefs and
            activity partners.
          </p>
          <VendorApplyForm emailVerificationAvailable={canDeliver("email")} />
        </div>
      </section>
    </main>
  );
}
