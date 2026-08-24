import { listingMatchesRegion, type RegionFilter } from "@/lib/marketplace-region";

const inr = (rupees: number) => rupees * 100;

export type FallbackService = {
  id: string;
  title: string;
  serviceType: string;
  description: string;
  area: string;
  city: string;
  addressLine1: string;
  capacityMin: number;
  capacityMax: number;
  tier: string;
  priceAmount: number;
  priceCurrency: "INR";
  priceUnit: string;
  images: string[];
  inclusions: string[];
  exclusions: string[];
  cancellationPolicy: string;
  serviceDetails: Record<string, string>;
  status: "active";
  active: true;
  vendorId: string;
  vendorSlug: string;
  businessName: string;
  vendorDescription: string;
  vendorArea: string;
  vendorCity: string;
  vendorType: string;
  verificationStatus: "verified";
  ratingAvg: string;
  ratingCount: number;
  coverImage: string;
  logo: string | null;
  languages: string[];
};

export type FallbackProvider = {
  id: string;
  slug: string;
  businessName: string;
  vendorType: string;
  description: string;
  baseArea: string;
  city: string;
  country: string;
  logo: string | null;
  coverImage: string;
  languages: string[];
  ratingAvg: string;
  ratingCount: number;
  verificationStatus: "verified";
  verifiedAt: Date;
  highlights: Array<{ id: string; text: string; icon: string | null; sortOrder: number }>;
  media: Array<{
    id: string;
    fileUrl: string;
    kind: string;
    altText: string;
    caption: string;
    sortOrder: number;
  }>;
  listings: Array<{
    id: string;
    title: string;
    serviceType: string;
    area: string;
    city: string;
    priceAmount: number;
    priceCurrency: string;
    priceUnit: string;
    images: string[];
    tier: string;
  }>;
  reviews: [];
};

const SERVICES: FallbackService[] = [
  {
    id: "sample-svc-jain-thali",
    title: "Jain and vegetarian group thali",
    serviceType: "restaurant",
    description: "Reserved group seating with Jain, vegetarian and vegan options labeled before service.",
    area: "Ubud",
    city: "Bali",
    addressLine1: "Jl. Hanoman 42, Ubud",
    capacityMin: 4,
    capacityMax: 55,
    tier: "comfort",
    priceAmount: inr(1450),
    priceCurrency: "INR",
    priceUnit: "per_person",
    images: ["/Asset/culinary.png"],
    inclusions: ["Thali", "Protocol labeling", "Group seating"],
    exclusions: ["Drinks", "Airport transfer"],
    cancellationPolicy: "Free cancellation 48 hours before.",
    serviceDetails: { kitchen: "dedicated_veg" },
    status: "active",
    active: true,
    vendorId: "sample-vendor-restaurant",
    vendorSlug: "sample-shuddh-bhojan-ubud",
    businessName: "Shuddh Bhojan Ubud",
    vendorDescription: "Pure vegetarian restaurant for Jain, vegetarian and vegan travellers.",
    vendorArea: "Ubud",
    vendorCity: "Bali",
    vendorType: "restaurant",
    verificationStatus: "verified",
    ratingAvg: "4.80",
    ratingCount: 74,
    coverImage: "/Asset/culinary.png",
    logo: null,
    languages: ["English", "Hindi", "Gujarati"],
  },
  {
    id: "sample-svc-ubud-villa",
    title: "Ubud villa stay for Indian groups",
    serviceType: "accommodation",
    description: "Pool villa with a vegetarian kitchen and rooms sized for family groups.",
    area: "Ubud",
    city: "Bali",
    addressLine1: "Jl. Raya Pengosekan, Ubud",
    capacityMin: 6,
    capacityMax: 16,
    tier: "premium",
    priceAmount: inr(18500),
    priceCurrency: "INR",
    priceUnit: "per_night",
    images: ["/Asset/villa-stay.png"],
    inclusions: ["Villa", "Kitchen access", "Airport welcome note"],
    exclusions: ["Chef", "Flights"],
    cancellationPolicy: "Free cancellation 7 days before.",
    serviceDetails: { rooms: "4" },
    status: "active",
    active: true,
    vendorId: "sample-vendor-stay",
    vendorSlug: "sample-ubud-family-villas",
    businessName: "Ubud Family Villas",
    vendorDescription: "Group villas with veg kitchens near Ubud.",
    vendorArea: "Ubud",
    vendorCity: "Bali",
    vendorType: "accommodation",
    verificationStatus: "verified",
    ratingAvg: "4.70",
    ratingCount: 31,
    coverImage: "/Asset/villa-stay.png",
    logo: null,
    languages: ["English", "Hindi"],
  },
  {
    id: "sample-svc-canggu-cook",
    title: "Private Jain cook for villa stays",
    serviceType: "cook",
    description: "A cook who prepares Jain and satvik meals in the villa kitchen, with a separate prep surface.",
    area: "Canggu",
    city: "Bali",
    addressLine1: "Canggu, Badung",
    capacityMin: 4,
    capacityMax: 20,
    tier: "comfort",
    priceAmount: inr(4200),
    priceCurrency: "INR",
    priceUnit: "per_day",
    images: ["/Asset/food-kitchen.png"],
    inclusions: ["Cook", "Menu planning", "Jain protocol"],
    exclusions: ["Ingredients", "Kitchen hire"],
    cancellationPolicy: "Free cancellation 24 hours before.",
    serviceDetails: { protocol: "jain" },
    status: "active",
    active: true,
    vendorId: "sample-vendor-cook",
    vendorSlug: "sample-satvik-cooks-bali",
    businessName: "Satvik Cooks Bali",
    vendorDescription: "In-villa cooks for Indian food protocol.",
    vendorArea: "Canggu",
    vendorCity: "Bali",
    vendorType: "cook",
    verificationStatus: "verified",
    ratingAvg: "4.90",
    ratingCount: 18,
    coverImage: "/Asset/food-kitchen.png",
    logo: null,
    languages: ["Hindi", "Gujarati", "English"],
  },
  {
    id: "sample-svc-jakarta-transfer",
    title: "Jakarta airport group transfer",
    serviceType: "transport",
    description: "Private vans from CGK for groups continuing to Bali or staying in Jakarta overnight.",
    area: "Menteng",
    city: "Jakarta",
    addressLine1: "Soekarno-Hatta International Airport",
    capacityMin: 4,
    capacityMax: 14,
    tier: "comfort",
    priceAmount: inr(6500),
    priceCurrency: "INR",
    priceUnit: "per_trip",
    images: ["/Asset/beaches.png"],
    inclusions: ["Meet and greet", "Van", "Driver"],
    exclusions: ["Tolls extras after midnight", "Flights"],
    cancellationPolicy: "Free cancellation 12 hours before.",
    serviceDetails: { vehicle: "van" },
    status: "active",
    active: true,
    vendorId: "sample-vendor-transport",
    vendorSlug: "sample-jakarta-airport-cars",
    businessName: "Jakarta Airport Cars",
    vendorDescription: "Airport logistics for Indian groups entering Indonesia.",
    vendorArea: "Menteng",
    vendorCity: "Jakarta",
    vendorType: "transport",
    verificationStatus: "verified",
    ratingAvg: "4.60",
    ratingCount: 22,
    coverImage: "/Asset/beaches.png",
    logo: null,
    languages: ["English", "Hindi", "Indonesian"],
  },
];

function providerFromServices(slug: string, services: FallbackService[]): FallbackProvider | null {
  const rows = services.filter((s) => s.vendorSlug === slug);
  const first = rows[0];
  if (!first) return null;
  return {
    id: first.vendorId,
    slug: first.vendorSlug,
    businessName: first.businessName,
    vendorType: first.vendorType,
    description: first.vendorDescription,
    baseArea: first.vendorArea,
    city: first.vendorCity,
    country: first.vendorCity === "Jakarta" ? "Indonesia" : "Indonesia",
    logo: first.logo,
    coverImage: first.coverImage,
    languages: first.languages,
    ratingAvg: first.ratingAvg,
    ratingCount: first.ratingCount,
    verificationStatus: "verified",
    verifiedAt: new Date("2026-01-15T00:00:00.000Z"),
    highlights: [
      { id: `${first.vendorId}-h1`, text: "Verified by Only2Bali", icon: null, sortOrder: 0 },
    ],
    media: [
      {
        id: `${first.vendorId}-m1`,
        fileUrl: first.coverImage,
        kind: "cover",
        altText: first.businessName,
        caption: first.businessName,
        sortOrder: 0,
      },
    ],
    listings: rows.map((s) => ({
      id: s.id,
      title: s.title,
      serviceType: s.serviceType,
      area: s.area,
      city: s.city,
      priceAmount: s.priceAmount,
      priceCurrency: s.priceCurrency,
      priceUnit: s.priceUnit,
      images: s.images,
      tier: s.tier,
    })),
    reviews: [],
  };
}

export function isFallbackServiceId(id: string): boolean {
  return SERVICES.some((s) => s.id === id);
}

export function getFallbackServiceById(id: string): FallbackService | null {
  return SERVICES.find((s) => s.id === id) ?? null;
}

export function listFallbackServices(filters: {
  region?: RegionFilter;
  serviceType?: string;
  limit?: number;
} = {}): FallbackService[] {
  return SERVICES.filter(
    (s) =>
      listingMatchesRegion(s, filters.region) &&
      (!filters.serviceType || s.serviceType === filters.serviceType)
  ).slice(0, filters.limit ?? 60);
}

export function getFallbackProviderBySlug(slug: string): FallbackProvider | null {
  return providerFromServices(slug, SERVICES);
}

export function listFallbackProviders(filters: {
  region?: RegionFilter;
  limit?: number;
} = {}): Array<{
  slug: string;
  businessName: string;
  vendorType: string | null;
  description: string | null;
  city: string | null;
  baseArea: string | null;
  coverImage: string | null;
  logo: string | null;
  ratingCount: number;
  ratingAvg: string | number | null;
  languages: string[] | null;
}> {
  const seen = new Set<string>();
  const providers = [];
  for (const service of SERVICES) {
    if (seen.has(service.vendorSlug)) continue;
    seen.add(service.vendorSlug);
    if (
      !listingMatchesRegion(
        { city: service.vendorCity, area: service.vendorArea, vendorArea: service.vendorArea, vendorCity: service.vendorCity },
        filters.region
      )
    ) {
      continue;
    }
    providers.push({
      slug: service.vendorSlug,
      businessName: service.businessName,
      vendorType: service.vendorType,
      description: service.vendorDescription,
      city: service.vendorCity,
      baseArea: service.vendorArea,
      coverImage: service.coverImage,
      logo: service.logo,
      ratingCount: service.ratingCount,
      ratingAvg: service.ratingAvg,
      languages: service.languages,
    });
  }
  return providers.slice(0, filters.limit ?? 60);
}
