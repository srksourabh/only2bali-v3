import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { listProviderBookings } from "@/lib/repositories/provider-bookings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole("vendor", "admin");
    const data = await listProviderBookings(user.accountId);
    if (!data) {
      return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return apiError(err, "Could not load bookings.");
  }
}
