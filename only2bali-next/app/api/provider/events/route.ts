import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { providerEventSchema } from "@/lib/validators/provider";
import { createProviderEvent, getVendorByAccount, listProviderCatalog } from "@/lib/repositories/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    const { events } = await listProviderCatalog(provider.id);
    return NextResponse.json({ success: true, data: { events } }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiError(err, "Could not load provider events.");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });

    const parsed = providerEventSchema.safeParse(await readJson(req, 32_768));
    if (!parsed.success) return validationError(parsed.error);

    const event = await createProviderEvent(provider.id, parsed.data);
    return NextResponse.json({ success: true, data: { event } }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not save provider event.");
  }
}
