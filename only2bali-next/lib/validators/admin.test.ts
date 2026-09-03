import { describe, expect, it } from "vitest";
import { adminVendorVerificationSchema, bootstrapAdminSchema, platformFeePatchSchema } from "./admin";

describe("bootstrapAdminSchema", () => {
  it("normalises username and accepts a long enough password", () => {
    const parsed = bootstrapAdminSchema.safeParse({
      username: " O2B.Admin ",
      password: "tencharsxx",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.username).toBe("o2b.admin");
      expect(parsed.data.password).toBe("tencharsxx");
    }
  });

  it("rejects a short password", () => {
    expect(
      bootstrapAdminSchema.safeParse({ username: "o2badmin", password: "short" }).success
    ).toBe(false);
  });

  it("rejects an invalid username", () => {
    expect(
      bootstrapAdminSchema.safeParse({ username: "Nope Space", password: "tencharsxx" }).success
    ).toBe(false);
  });
});

describe("adminVendorVerificationSchema", () => {
  it("accepts assigning a developer without changing verification", () => {
    expect(
      adminVendorVerificationSchema.safeParse({
        assignedTo: "11111111-1111-4111-8111-111111111111",
      }).success
    ).toBe(true);
  });

  it("accepts unassigning a developer", () => {
    expect(adminVendorVerificationSchema.safeParse({ assignedTo: null }).success).toBe(true);
  });

  it("rejects a patch with neither verification nor assignment", () => {
    expect(adminVendorVerificationSchema.safeParse({}).success).toBe(false);
  });
});

describe("platformFeePatchSchema", () => {
  it("accepts the default 10 percent take", () => {
    expect(platformFeePatchSchema.safeParse({ platformFeePercent: 10 }).success).toBe(true);
  });

  it("rejects a fee above 50 percent", () => {
    expect(platformFeePatchSchema.safeParse({ platformFeePercent: 51 }).success).toBe(false);
  });
});

