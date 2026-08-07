import { describe, it, expect } from "vitest";
import { SETTING_DEFS, SETTING_KEYS } from "./catalog";
import { adminSettingsPatchSchema } from "@/lib/validators/settings";

describe("settings catalog", () => {
  it("includes otp, ai, payments, and stores zoho without wiring claim", () => {
    expect(SETTING_KEYS).toContain("resend.api_key");
    expect(SETTING_KEYS).toContain("gemini.api_key");
    expect(SETTING_KEYS).toContain("razorpay.key_secret");
    expect(SETTING_KEYS).toContain("zoho.refresh_token");
    const zoho = SETTING_DEFS.find((d) => d.key === "zoho.client_id");
    expect(zoho?.help?.toLowerCase()).toContain("not wired");
  });
});

describe("adminSettingsPatchSchema", () => {
  it("accepts known keys and null clears", () => {
    const parsed = adminSettingsPatchSchema.parse({
      values: {
        "resend.api_key": "re_test",
        "gemini.api_key": null,
      },
    });
    expect(parsed.values["resend.api_key"]).toBe("re_test");
    expect(parsed.values["gemini.api_key"]).toBeNull();
  });

  it("rejects unknown keys", () => {
    expect(() =>
      adminSettingsPatchSchema.parse({ values: { "not.a.key": "x" } })
    ).toThrow();
  });
});
