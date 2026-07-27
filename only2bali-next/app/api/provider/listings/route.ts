import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { serviceListingSchema } from "@/lib/validators/provider";
import { createProviderListing, getVendorByAccount, listProviderCatalog } from "@/lib/repositories/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    const { listings } = await listProviderCatalog(provider.id);
    return NextResponse.json({ success: true, data: { listings } }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiError(err, "Could not load provider listings.");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });

    const parsed = serviceListingSchema.safeParse(await readJson(req, 32_768));
    if (!parsed.success) return validationError(parsed.error);

    const listing = await createProviderListing(provider.id, parsed.data);
    return NextResponse.json({ success: true, data: { listing } }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not create provider listing.");
  }
}
