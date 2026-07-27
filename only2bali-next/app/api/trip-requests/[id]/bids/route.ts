import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { providerBidSchema } from "@/lib/validators/marketplace";
import { createProviderBid, findVendorIdForAccount } from "@/lib/repositories/marketplace";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("vendor");
    const vendorId = await findVendorIdForAccount(user.accountId);
    if (!vendorId) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });

    const parsed = providerBidSchema.safeParse(await readJson(req, 32_768));
    if (!parsed.success) return validationError(parsed.error);

    const { id } = await params;
    const result = await createProviderBid(vendorId, id, parsed.data);
    if (!result.ok) {
      const status = result.reason === "request_not_found" ? 404 : 409;
      return NextResponse.json({ success: false, error: result.reason }, { status });
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not submit provider bid.");
  }
}
