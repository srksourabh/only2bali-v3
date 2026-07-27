import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { getVendorByAccount, listProviderCatalog } from "@/lib/repositories/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });

    const catalog = await listProviderCatalog(provider.id);
    return NextResponse.json(
      { success: true, data: { provider, ...catalog } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return apiError(err, "Could not load provider catalog.");
  }
}
