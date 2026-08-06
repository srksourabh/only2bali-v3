import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { listDisbursements } from "@/lib/repositories/disbursements";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("admin");
    const disbursements = await listDisbursements();
    return NextResponse.json(
      { success: true, data: { disbursements } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return apiError(err, "Could not load disbursements.");
  }
}
