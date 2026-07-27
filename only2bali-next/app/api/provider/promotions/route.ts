import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { providerPromotionSchema } from "@/lib/validators/provider";
import { createProviderPromotion, getVendorByAccount, listProviderCatalog } from "@/lib/repositories/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    const { promotions } = await listProviderCatalog(provider.id);
    return NextResponse.json({ success: true, data: { promotions } }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiError(err, "Could not load provider offers.");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });

    const parsed = providerPromotionSchema.safeParse(await readJson(req, 32_768));
    if (!parsed.success) return validationError(parsed.error);

    const promotion = await createProviderPromotion(provider.id, parsed.data);
    if (!promotion) return NextResponse.json({ success: false, error: "Listing not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: { promotion } }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not save provider offer.");
  }
}
