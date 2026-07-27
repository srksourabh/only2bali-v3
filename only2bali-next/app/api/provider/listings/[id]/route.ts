import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { serviceListingPatchSchema } from "@/lib/validators/provider";
import { getVendorByAccount, updateProviderListing } from "@/lib/repositories/provider";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });

    const parsed = serviceListingPatchSchema.safeParse(await readJson(req, 32_768));
    if (!parsed.success) return validationError(parsed.error);

    const { id } = await params;
    const listing = await updateProviderListing(provider.id, id, parsed.data);
    if (!listing) return NextResponse.json({ success: false, error: "Listing not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: { listing } });
  } catch (err) {
    return apiError(err, "Could not update provider listing.");
  }
}
