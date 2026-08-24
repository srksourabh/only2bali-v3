import { describe, it, expect } from "vitest";
import {
  requestOtpSchema,
  verifyOtpSchema,
  toIdentifier,
  verifyMobileRequestSchema,
  verifyMobileConfirmSchema,
} from "./auth";

describe("requestOtpSchema", () => {
  it("accepts an email on its own", () => {
    const r = requestOtpSchema.safeParse({ email: "Traveller@Example.COM" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("traveller@example.com"); // normalised
  });

  it("accepts a mobile on its own and strips formatting", () => {
    const r = requestOtpSchema.safeParse({ mobile: "+91 98765-43210" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.mobile).toBe("+919876543210");
  });

  it("rejects both together", () => {
    expect(requestOtpSchema.safeParse({ email: "a@b.com", mobile: "+919876543210" }).success).toBe(false);
  });

  it("rejects neither", () => {
    expect(requestOtpSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(requestOtpSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it.each(["12", "abcdefghij", "+0123456789", "++919876543210"])(
    "rejects malformed mobile %s",
    (mobile) => {
      expect(requestOtpSchema.safeParse({ mobile }).success).toBe(false);
    }
  );

  it("rejects an absurdly long email rather than passing it to a provider", () => {
    expect(requestOtpSchema.safeParse({ email: "a".repeat(300) + "@b.com" }).success).toBe(false);
  });
});

describe("verifyOtpSchema", () => {
  it("accepts exactly six digits", () => {
    expect(verifyOtpSchema.safeParse({ email: "a@b.com", code: "012345" }).success).toBe(true);
  });

  it.each(["1234", "1234567", "abcdef", "12 34 56", ""])(
    "rejects code %s",
    (code) => {
      expect(verifyOtpSchema.safeParse({ email: "a@b.com", code }).success).toBe(false);
    }
  );
});

describe("verifyMobileRequestSchema", () => {
  it("accepts a formatted mobile and strips it", () => {
    const parsed = verifyMobileRequestSchema.safeParse({ mobile: "+91 98765-43210" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.mobile).toBe("+919876543210");
  });

  it("rejects an email-only payload", () => {
    expect(verifyMobileRequestSchema.safeParse({ email: "a@b.com" }).success).toBe(false);
  });
});

describe("verifyMobileConfirmSchema", () => {
  it("requires a six-digit code with the mobile", () => {
    expect(
      verifyMobileConfirmSchema.safeParse({ mobile: "+919876543210", code: "012345" }).success
    ).toBe(true);
    expect(verifyMobileConfirmSchema.safeParse({ mobile: "+919876543210", code: "12" }).success).toBe(
      false
    );
  });
});

describe("toIdentifier", () => {
  it("namespaces by channel so email and mobile cannot collide", () => {
    expect(toIdentifier({ email: "a@b.com" })).toBe("email:a@b.com");
    expect(toIdentifier({ mobile: "+919876543210" })).toBe("mobile:+919876543210");
  });
});
