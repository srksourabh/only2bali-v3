import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { payoutAccountSchema } from "@/lib/validators/provider";
import { getVendorByAccount, listProviderCatalog, upsertPayoutAccount } from "@/lib/repositories/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    const { payoutAccount } = await listProviderCatalog(provider.id);
    return NextResponse.json({ success: true, data: { payoutAccount } }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiError(err, "Could not load payout account.");
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });

    const parsed = payoutAccountSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const payoutAccount = await upsertPayoutAccount(provider.id, parsed.data);
    return NextResponse.json({ success: true, data: { payoutAccount } });
  } catch (err) {
    return apiError(err, "Could not save payout account.");
  }
}
