import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { adminListingPatchSchema } from "@/lib/validators/admin";
import { adminPatchListing } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("admin");
    const parsed = adminListingPatchSchema.safeParse(await readJson(req, 24_576));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const listing = await adminPatchListing(user.accountId, id, parsed.data);
    if (!listing) return NextResponse.json({ success: false, error: "Listing not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: { listing } });
  } catch (err) {
    return apiError(err, "Could not update listing.");
  }
}
