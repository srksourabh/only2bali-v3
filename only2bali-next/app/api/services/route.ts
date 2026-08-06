import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { listPublicServices } from "@/lib/repositories/listings-public";
import { listCompliantPublicServices } from "@/lib/repositories/compliance-match";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const region = url.searchParams.get("region");
    const serviceType = url.searchParams.get("type") ?? undefined;
    const priceMin = url.searchParams.get("priceMin");
    const priceMax = url.searchParams.get("priceMax");
    const protocol = url.searchParams.get("protocol");

    const regionFilter =
      region === "bali" || region === "jakarta" || region === "all" ? region : "all";

    if (protocol === "jain" || protocol === "vegetarian" || protocol === "vegan") {
      let services = await listCompliantPublicServices({
        protocol,
        region: regionFilter,
      });
      if (serviceType) services = services.filter((s) => s.serviceType === serviceType);
      if (priceMin) services = services.filter((s) => s.priceAmount >= Number(priceMin));
      if (priceMax) services = services.filter((s) => s.priceAmount <= Number(priceMax));
      return NextResponse.json({ success: true, data: { services, protocolHardFilter: true } });
    }

    const services = await listPublicServices({
      region: regionFilter,
      serviceType,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
    });

    return NextResponse.json({ success: true, data: { services } });
  } catch (err) {
    return apiError(err, "Could not load services.");
  }
}
