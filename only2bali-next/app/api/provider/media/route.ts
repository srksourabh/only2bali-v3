import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { providerMediaSchema } from "@/lib/validators/provider";
import { addProviderMedia, getVendorByAccount } from "@/lib/repositories/provider";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });

    const parsed = providerMediaSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const media = await addProviderMedia(provider.id, parsed.data);
    if (!media) return NextResponse.json({ success: false, error: "Listing not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: { media } }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not save provider media.");
  }
}
