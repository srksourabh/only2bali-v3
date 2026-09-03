const SHARED_FOOD = "/Asset/culinary.png";

const ART_BY_TYPE: Record<string, string> = {
  restaurant: "/Asset/culinary.png",
  cook: "/Asset/food-kitchen.png",
  accommodation: "/Asset/villa-stay.png",
  transport: "/Asset/beaches.png",
  guide: "/Asset/TOURGUIDE.png",
  activity_operator: "/Asset/adventure.png",
  tour_agency: "/Asset/DP-Hero-img.png",
  produce: "/Asset/culinary.png",
  artisan: "/Asset/cultures.png",
};

function isCookingClass(title?: string | null): boolean {
  return /class|workshop|demonstration/i.test(title ?? "");
}

function artForService(serviceType: string, title?: string | null): string {
  if (isCookingClass(title)) return "/Asset/food-class.png";
  return ART_BY_TYPE[serviceType] ?? "/Asset/Heroimg.png";
}

function isSharedFoodPlaceholder(src: string): boolean {
  return src === SHARED_FOOD || src.endsWith(SHARED_FOOD);
}

/** Card image for a public listing. Shared seed food shots are remapped by type. */
export function listingCardImage(input: {
  serviceType: string;
  title?: string | null;
  images?: string[] | null;
  coverImage?: string | null;
}): string {
  const stored = (input.images?.[0] ?? input.coverImage ?? "").trim();
  const typed = artForService(input.serviceType, input.title);
  if (!stored) return typed;
  if (isCookingClass(input.title)) return typed;
  if (isSharedFoodPlaceholder(stored) && input.serviceType !== "restaurant") return typed;
  if (stored === "/Asset/D-card-img2.png" && input.serviceType === "accommodation") {
    return "/Asset/villa-stay.png";
  }
  return stored;
}

export function providerCoverImage(input: {
  vendorType?: string | null;
  coverImage?: string | null;
  businessName?: string | null;
}): string {
  return listingCardImage({
    serviceType: input.vendorType ?? "",
    title: input.businessName,
    coverImage: input.coverImage,
  });
}
