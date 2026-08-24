import { describe, expect, it } from "vitest";
import {
  mapBusinessTypeToVendorType,
  planApplicationOnboarding,
  slugifyBusinessName,
  usernameFromEmail,
} from "./application-onboarding";

describe("slugifyBusinessName", () => {
  it("turns a kitchen name into a URL slug", () => {
    expect(slugifyBusinessName("Sattvik Kitchen Ubud")).toBe("sattvik-kitchen-ubud");
  });

  it("falls back when the name has no latin letters", () => {
    expect(slugifyBusinessName("***")).toMatch(/^provider-/);
  });
});

describe("usernameFromEmail", () => {
  it("uses the email local part", () => {
    expect(usernameFromEmail("kitchen.ubud@example.com")).toBe("kitchen.ubud");
  });

  it("strips characters the username schema refuses", () => {
    expect(usernameFromEmail("A B+C@example.com")).toBe("abc");
  });
});

describe("mapBusinessTypeToVendorType", () => {
  it("maps kitchen copy to restaurant", () => {
    expect(mapBusinessTypeToVendorType("Jain-capable kitchen")).toBe("restaurant");
  });

  it("maps villa copy to accommodation", () => {
    expect(mapBusinessTypeToVendorType("Private villa stay")).toBe("accommodation");
  });

  it("defaults unknown copy to tour_agency", () => {
    expect(mapBusinessTypeToVendorType("Something else")).toBe("tour_agency");
  });
});

describe("planApplicationOnboarding", () => {
  const base = {
    businessName: "Sattvik Kitchen",
    businessType: "Jain-capable kitchen",
    baseArea: "Ubud",
    whatsapp: "+6281234567890",
  };

  it("does nothing unless the admin verifies", () => {
    expect(
      planApplicationOnboarding({
        ...base,
        decision: "rejected",
        email: "kitchen@example.com",
        existingAccount: null,
      })
    ).toEqual({ kind: "skip" });
  });

  it("skips account creation when the application has no email", () => {
    expect(
      planApplicationOnboarding({
        ...base,
        decision: "verified",
        email: null,
        existingAccount: null,
      })
    ).toEqual({ kind: "skip" });
  });

  it("creates a vendor account when the applicant is new", () => {
    expect(
      planApplicationOnboarding({
        ...base,
        decision: "verified",
        email: "Kitchen@Example.com",
        existingAccount: null,
      })
    ).toEqual({
      kind: "create_account",
      email: "kitchen@example.com",
      username: "kitchen",
      businessName: "Sattvik Kitchen",
      vendorType: "restaurant",
      baseArea: "Ubud",
      whatsapp: "+6281234567890",
    });
  });

  it("promotes a traveller who later applied as a vendor", () => {
    expect(
      planApplicationOnboarding({
        ...base,
        decision: "verified",
        email: "priya@example.com",
        existingAccount: { id: "acct-1", role: "traveller" },
      })
    ).toMatchObject({
      kind: "promote_traveller",
      accountId: "acct-1",
      vendorType: "restaurant",
    });
  });

  it("verifies an existing vendor account on the same email", () => {
    expect(
      planApplicationOnboarding({
        ...base,
        decision: "verified",
        email: "kitchen@example.com",
        existingAccount: { id: "acct-2", role: "vendor" },
      })
    ).toEqual({ kind: "verify_vendor", accountId: "acct-2" });
  });

  it("never promotes an admin account into a vendor", () => {
    expect(
      planApplicationOnboarding({
        ...base,
        decision: "verified",
        email: "ops@example.com",
        existingAccount: { id: "acct-3", role: "admin" },
      })
    ).toEqual({ kind: "skip" });
  });
});
