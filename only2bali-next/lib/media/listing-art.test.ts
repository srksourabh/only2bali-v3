import { describe, expect, it } from "vitest";
import { listingCardImage, providerCoverImage } from "./listing-art";

describe("listingCardImage", () => {
  it("keeps a restaurant thali on the culinary plate shot", () => {
    expect(
      listingCardImage({
        serviceType: "restaurant",
        title: "Jain thali, group sitting",
        images: ["/Asset/culinary.png"],
      })
    ).toBe("/Asset/culinary.png");
  });

  it("gives cooking classes a distinct prep shot", () => {
    expect(
      listingCardImage({
        serviceType: "restaurant",
        title: "Cooking class — Balinese vegetarian",
        images: ["/Asset/culinary.png"],
      })
    ).toBe("/Asset/food-class.png");
  });

  it("does not reuse the shared food photo for a cook or a villa", () => {
    expect(
      listingCardImage({
        serviceType: "cook",
        title: "Accompanying Jain cook, per trip",
        images: ["/Asset/culinary.png"],
      })
    ).toBe("/Asset/food-kitchen.png");
    expect(
      listingCardImage({
        serviceType: "accommodation",
        title: "Three-bedroom private villa with kitchen",
        images: ["/Asset/D-card-img2.png"],
      })
    ).toBe("/Asset/villa-stay.png");
  });

  it("leaves a type-correct stored photo alone", () => {
    expect(
      listingCardImage({
        serviceType: "transport",
        title: "16-seater with driver, full day",
        images: ["/Asset/beaches.png"],
      })
    ).toBe("/Asset/beaches.png");
  });
});

describe("providerCoverImage", () => {
  it("maps a cook cover off the shared food photo", () => {
    expect(
      providerCoverImage({ vendorType: "cook", coverImage: "/Asset/culinary.png" })
    ).toBe("/Asset/food-kitchen.png");
  });
});
