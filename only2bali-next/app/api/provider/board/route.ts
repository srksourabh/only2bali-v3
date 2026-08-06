import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { findVendorIdForAccount, listOpenRequestBoard } from "@/lib/repositories/marketplace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole("vendor");
    const vendorId = await findVendorIdForAccount(user.accountId);
    if (!vendorId) {
      return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    }
    const requests = await listOpenRequestBoard(vendorId);
    return NextResponse.json({ success: true, data: { requests } }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiError(err, "Could not load request board.");
  }
}
