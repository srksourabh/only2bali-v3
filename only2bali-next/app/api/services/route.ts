import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { listPublicServices } from "@/lib/repositories/listings-public";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const region = url.searchParams.get("region");
    const serviceType = url.searchParams.get("type") ?? undefined;
    const priceMin = url.searchParams.get("priceMin");
    const priceMax = url.searchParams.get("priceMax");

    const services = await listPublicServices({
      region:
        region === "bali" || region === "jakarta" || region === "all"
          ? region
          : "all",
      serviceType,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
    });

    return NextResponse.json({ success: true, data: { services } });
  } catch (err) {
    return apiError(err, "Could not load services.");
  }
}
