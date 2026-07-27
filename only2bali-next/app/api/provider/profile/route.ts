import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { providerProfileSchema } from "@/lib/validators/provider";
import { getVendorByAccount, updateProviderProfile } from "@/lib/repositories/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: { provider } }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiError(err, "Could not load provider profile.");
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireRole("vendor");
    const parsed = providerProfileSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const provider = await updateProviderProfile(user.accountId, parsed.data);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: { provider } });
  } catch (err) {
    return apiError(err, "Could not update provider profile.");
  }
}
