import { describe, it, expect } from "vitest";
import {
  canReleaseEscrow,
  DISBURSEMENT_PURPOSE_CODE,
  escrowStatusAfterCapture,
  isSimulatedRazorpayPaymentId,
} from "./disbursements";
import { isComplianceActive, passesComplianceHardFilter } from "./compliance-match";

describe("escrow policy", () => {
  it("holds disbursements on capture", () => {
    expect(escrowStatusAfterCapture()).toBe("held");
  });

  it("only releases from held", () => {
    expect(canReleaseEscrow("held")).toBe(true);
    expect(canReleaseEscrow("pending")).toBe(false);
  });

  it("uses a travel purpose code on the ledger", () => {
    expect(DISBURSEMENT_PURPOSE_CODE).toMatch(/^S\d+/);
  });
});

describe("simulated Razorpay payment ids", () => {
  it("recognises e2e checkout ids that never hit the gateway", () => {
    expect(isSimulatedRazorpayPaymentId("pay_e2e_abc123")).toBe(true);
    expect(isSimulatedRazorpayPaymentId("pay_e2e_offer_abc123")).toBe(true);
  });

  it("leaves live Razorpay payment ids on the gateway path", () => {
    expect(isSimulatedRazorpayPaymentId("pay_NGrsM1TYPBbXQz")).toBe(false);
  });
});

describe("compliance hard filter", () => {
  it("rejects red ratings", () => {
    expect(passesComplianceHardFilter("green")).toBe(true);
    expect(passesComplianceHardFilter("amber")).toBe(true);
    expect(passesComplianceHardFilter("red")).toBe(false);
  });

  it("treats expired compliance as inactive", () => {
    expect(isComplianceActive(new Date(Date.now() + 86_400_000))).toBe(true);
    expect(isComplianceActive(new Date(Date.now() - 1000))).toBe(false);
    expect(isComplianceActive(null)).toBe(true);
  });
});
