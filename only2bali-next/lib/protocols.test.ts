import { describe, it, expect } from "vitest";
import {
  PROTOCOLS,
  PROTOCOL_DISPLAY_ORDER,
  PROTOCOL_FALLBACK_LABELS,
  VEGETARIAN_PROTOCOLS,
  isProtocol,
  isVegetarianProtocol,
} from "./protocols";
import { protocolOptions } from "./protocol-options";
import { protocol as protocolEnum } from "./db/schema/enums";
import { en } from "./i18n/dictionaries/en";

describe("the protocol list", () => {
  it("is the same list the database enum is built from", () => {
    expect([...protocolEnum.enumValues]).toEqual([...PROTOCOLS]);
  });

  it("stays in storage order, because Postgres can only append to an enum", () => {
    // Reordering this array silently reorders the generated enum, which turns
    // an additive migration into a destructive one.
    expect(PROTOCOLS.slice(0, 3)).toEqual(["jain", "vegetarian", "vegan"]);
  });

  it("shows every stored protocol to a traveller, and invents none", () => {
    expect([...PROTOCOL_DISPLAY_ORDER].sort()).toEqual([...PROTOCOLS].sort());
  });

  it("labels every protocol", () => {
    for (const p of PROTOCOLS) {
      expect(PROTOCOL_FALLBACK_LABELS[p]).toBeTruthy();
    }
  });

  it("recognises its own values and nothing else", () => {
    expect(isProtocol("jain")).toBe(true);
    expect(isProtocol("non_veg")).toBe(true);
    expect(isProtocol("non_vegetarian")).toBe(false);
    expect(isProtocol("")).toBe(false);
    expect(isProtocol(null)).toBe(false);
  });
});

describe("which protocols carry a vegetarian guarantee", () => {
  it("covers the strictly vegetarian ones", () => {
    for (const p of VEGETARIAN_PROTOCOLS) {
      expect(isVegetarianProtocol(p)).toBe(true);
    }
  });

  it("does not claim one for protocols that never promised it", () => {
    expect(isVegetarianProtocol("eggetarian")).toBe(false);
    expect(isVegetarianProtocol("halal")).toBe(false);
    expect(isVegetarianProtocol("non_veg")).toBe(false);
  });
});

describe("protocol options as a traveller sees them", () => {
  it("offers every protocol, in display order", () => {
    const options = protocolOptions(en.guarantee.protocols);
    expect(options.map((o) => o.value)).toEqual([...PROTOCOL_DISPLAY_ORDER]);
  });

  it("uses the dictionary where the keys disagree with the enum", () => {
    const options = protocolOptions(en.guarantee.protocols);
    // The dictionary has said `veg` since before `vegetarian` was a value.
    expect(options.find((o) => o.value === "vegetarian")?.label).toBe(en.guarantee.protocols.veg);
  });

  it("never renders a raw enum value when a translation is missing", () => {
    const options = protocolOptions({});
    expect(options.every((o) => o.label && !o.label.includes("_"))).toBe(true);
    expect(options.find((o) => o.value === "non_veg")?.label).toBe(
      PROTOCOL_FALLBACK_LABELS.non_veg
    );
  });
});
