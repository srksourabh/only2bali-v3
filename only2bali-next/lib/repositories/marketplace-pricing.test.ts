import { describe, it, expect } from "vitest";
import { deriveTravellerTotal, maskContacts } from "./marketplace";

describe("deriveTravellerTotal", () => {
  it("derives gross from vendor net and commission", () => {
    expect(deriveTravellerTotal(8500_00, 0.15)).toBe(Math.ceil(8500_00 / 0.85));
  });

  it("never lets the vendor set traveller price directly", () => {
    const net = 1000_00;
    const total = deriveTravellerTotal(net, 0.15);
    expect(total).toBeGreaterThan(net);
  });
});

describe("maskContacts", () => {
  it("strips phone, email and urls before booking", () => {
    const { masked, detected } = maskContacts("Call +91 98765 43210 or me@x.com https://wa.me/1");
    expect(detected).toBe(true);
    expect(masked).not.toMatch(/\+91/);
    expect(masked).not.toMatch(/me@x\.com/);
    expect(masked).toContain("[phone hidden until booking]");
  });
});
