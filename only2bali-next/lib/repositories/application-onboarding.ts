import type { vendorType } from "@/lib/db/schema/enums";

export type VendorType = (typeof vendorType.enumValues)[number];

export type ApplicationOnboardingPlan =
  | { kind: "skip" }
  | {
      kind: "create_account";
      email: string;
      username: string;
      businessName: string;
      vendorType: VendorType;
      baseArea: string;
      whatsapp: string;
    }
  | {
      kind: "promote_traveller";
      accountId: string;
      businessName: string;
      vendorType: VendorType;
      baseArea: string;
      whatsapp: string;
    }
  | { kind: "verify_vendor"; accountId: string };

export function slugifyBusinessName(value: string): string {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return base || `provider-${Date.now()}`;
}

export function usernameFromEmail(email: string): string {
  const local = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 32);
  return local.length >= 3 ? local : `vendor${Date.now().toString(36)}`;
}

export function mapBusinessTypeToVendorType(businessType: string): VendorType {
  const text = businessType.trim().toLowerCase();
  if (/(restaurant|kitchen|warung|cafe|dining|food)/.test(text)) return "restaurant";
  if (/(villa|hotel|stay|accommodation|homestay)/.test(text)) return "accommodation";
  if (/(transport|driver|car|transfer|fleet)/.test(text)) return "transport";
  if (/(guide|concierge)/.test(text)) return "guide";
  if (/(cook|chef)/.test(text)) return "cook";
  if (/(produce|farm)/.test(text)) return "produce";
  if (/(artisan|craft)/.test(text)) return "artisan";
  if (/(activity|adventure|tour operator)/.test(text)) return "activity_operator";
  return "tour_agency";
}

export function planApplicationOnboarding(input: {
  decision: "verified" | "rejected" | "in_review";
  email: string | null | undefined;
  businessName: string;
  businessType: string;
  baseArea: string;
  whatsapp: string;
  existingAccount: { id: string; role: string } | null;
}): ApplicationOnboardingPlan {
  if (input.decision !== "verified") return { kind: "skip" };

  const email = input.email?.trim().toLowerCase() || null;
  if (!email) return { kind: "skip" };

  const vendorType = mapBusinessTypeToVendorType(input.businessType);
  const profile = {
    businessName: input.businessName,
    vendorType,
    baseArea: input.baseArea,
    whatsapp: input.whatsapp,
  };

  if (!input.existingAccount) {
    return {
      kind: "create_account",
      email,
      username: usernameFromEmail(email),
      ...profile,
    };
  }

  if (input.existingAccount.role === "traveller") {
    return {
      kind: "promote_traveller",
      accountId: input.existingAccount.id,
      ...profile,
    };
  }

  if (input.existingAccount.role === "vendor") {
    return { kind: "verify_vendor", accountId: input.existingAccount.id };
  }

  return { kind: "skip" };
}
