import { describe, expect, it } from "vitest";
import { DEFAULT_FROM, emailBackend, emailConfigured, smtpSecureForPort } from "./email-transport";

/**
 * Sign-in used to require one named vendor. These pin the property that
 * matters: any configured mail path counts, and none of them is special.
 */
describe("choosing a mail path", () => {
  it("uses Resend when its key is set", () => {
    expect(emailBackend({ RESEND_API_KEY: "re_live_x" })).toBe("resend");
  });

  it("uses SMTP when a full set of credentials is present", () => {
    expect(
      emailBackend({
        SMTP_HOST: "smtp-relay.brevo.com",
        SMTP_USER: "user",
        SMTP_PASSWORD: "pass",
      })
    ).toBe("smtp");
  });

  it("refuses a half-configured SMTP rather than failing at send time", () => {
    expect(emailBackend({ SMTP_HOST: "smtp.gmail.com" })).toBe("none");
    expect(emailBackend({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "me" })).toBe("none");
    expect(emailConfigured({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "me" })).toBe(false);
  });

  it("treats whitespace as unset", () => {
    expect(emailBackend({ RESEND_API_KEY: "   " })).toBe("none");
    expect(
      emailBackend({ SMTP_HOST: " ", SMTP_USER: "user", SMTP_PASSWORD: "pass" })
    ).toBe("none");
  });

  it("reports nothing configured as nothing configured", () => {
    expect(emailBackend({})).toBe("none");
    expect(emailConfigured({})).toBe(false);
  });
});

/**
 * The most common SMTP misconfiguration there is, and it surfaces as a
 * timeout rather than an error, so it is derived rather than asked for.
 */
describe("implicit TLS versus STARTTLS", () => {
  it("uses implicit TLS on 465 only", () => {
    expect(smtpSecureForPort(465)).toBe(true);
    expect(smtpSecureForPort(587)).toBe(false);
    expect(smtpSecureForPort(25)).toBe(false);
    expect(smtpSecureForPort(2525)).toBe(false);
  });
});

describe("the sender address", () => {
  it("has a default so a missing EMAIL_FROM cannot silently send from nobody", () => {
    expect(DEFAULT_FROM).toMatch(/@only2bali\.com>$/);
  });
});
