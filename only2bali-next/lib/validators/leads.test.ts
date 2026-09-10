import { describe, it, expect } from "vitest";
import { leadSchema, vendorApplicationSchema, toProtocol } from "./leads";

const validLead = {
  name: "Meera Shah",
  mobile: "+91 98200 12345",
  departureCity: "Ahmedabad",
  groupSize: 14,
  protocol: "jain" as const,
};

describe("leadSchema", () => {
  it("accepts the minimum a travel designer can act on", () => {
    expect(leadSchema.safeParse(validLead).success).toBe(true);
  });

  it("takes the group size as a number even when the form sends a string", () => {
    const parsed = leadSchema.parse({ ...validLead, groupSize: "14" });
    expect(parsed.groupSize).toBe(14);
  });

  it("refuses an enquiry with no way to reply", () => {
    const { mobile, ...noPhone } = validLead;
    expect(leadSchema.safeParse(noPhone).success).toBe(false);
  });

  it("refuses a phone number too short to dial", () => {
    expect(leadSchema.safeParse({ ...validLead, mobile: "12345" }).success).toBe(false);
  });

  it("allows a protocol the enum does not cover, as null", () => {
    const parsed = leadSchema.parse({
      ...validLead,
      protocol: null,
      protocolLabel: "Mixed (veg household)",
    });
    expect(parsed.protocol).toBeNull();
    expect(parsed.protocolLabel).toBe("Mixed (veg household)");
  });

  it("refuses a protocol outside the database enum", () => {
    expect(leadSchema.safeParse({ ...validLead, protocol: "not_a_protocol" }).success).toBe(false);
  });

  it("caps the free-text message so one submission cannot fill the table", () => {
    expect(leadSchema.safeParse({ ...validLead, message: "x".repeat(2001) }).success).toBe(false);
  });

  it("treats a blank email as absent rather than invalid", () => {
    expect(leadSchema.safeParse({ ...validLead, email: "" }).success).toBe(true);
  });

  it("lowercases the email so two spellings are one address", () => {
    const parsed = leadSchema.parse({ ...validLead, email: "Meera@Example.COM" });
    expect(parsed.email).toBe("meera@example.com");
  });
});

describe("vendorApplicationSchema", () => {
  const validVendor = {
    businessName: "Sattvik Kitchen",
    businessType: "Jain-capable kitchen",
    baseArea: "Ubud",
    capabilities: ["Jain", "Vegetarian"],
    whatsapp: "9876543210",
    email: "kitchen@ubudgreen.com",
    emailCode: "012345",
  };

  it("accepts a complete application and stores +91 on the 10-digit mobile", () => {
    const parsed = vendorApplicationSchema.parse(validVendor);
    expect(parsed.whatsapp).toBe("+919876543210");
    expect(parsed.email).toBe("kitchen@ubudgreen.com");
  });

  it("accepts a pasted +91 prefix as long as the local number is 10 digits", () => {
    const parsed = vendorApplicationSchema.parse({ ...validVendor, whatsapp: "+91 98765-43210" });
    expect(parsed.whatsapp).toBe("+919876543210");
  });

  it("refuses a 13-digit mobile", () => {
    expect(vendorApplicationSchema.safeParse({ ...validVendor, whatsapp: "9876543210123" }).success).toBe(false);
  });

  it("refuses a placeholder email such as test@test.com", () => {
    expect(vendorApplicationSchema.safeParse({ ...validVendor, email: "test@test.com" }).success).toBe(false);
  });

  it("accepts a real-looking mailbox including the e2e .test TLD", () => {
    expect(vendorApplicationSchema.safeParse({ ...validVendor, email: "kitchen@only2bali.test" }).success).toBe(true);
  });

  it("refuses a missing email rather than treating it as optional", () => {
    const { email, ...noEmail } = validVendor;
    expect(vendorApplicationSchema.safeParse(noEmail).success).toBe(false);
  });

  it("refuses an application without the email verification code", () => {
    const { emailCode, ...noCode } = validVendor;
    expect(vendorApplicationSchema.safeParse(noCode).success).toBe(false);
  });

  it("refuses an application claiming no dietary capability at all", () => {
    expect(vendorApplicationSchema.safeParse({ ...validVendor, capabilities: [] }).success).toBe(false);
  });

  it("refuses a business with no name", () => {
    expect(vendorApplicationSchema.safeParse({ ...validVendor, businessName: "  " }).success).toBe(false);
  });
});

describe("toProtocol", () => {
  it("maps the form labels onto the database enum", () => {
    expect(toProtocol("Jain")).toBe("jain");
    expect(toProtocol("vegetarian")).toBe("vegetarian");
    expect(toProtocol(" Vegan ")).toBe("vegan");
  });

  it("returns null rather than guessing for anything else", () => {
    expect(toProtocol("Mixed (veg household)")).toBeNull();
    expect(toProtocol("")).toBeNull();
  });
});
