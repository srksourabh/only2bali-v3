import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { getAdminOverview } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("admin");
    const overview = await getAdminOverview();
    return NextResponse.json({ success: true, data: overview }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiError(err, "Could not load admin overview.");
  }
}
