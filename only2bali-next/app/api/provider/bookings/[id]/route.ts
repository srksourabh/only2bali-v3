import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { updateProviderBookingStatus } from "@/lib/repositories/provider-bookings";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["in_progress", "completed"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("vendor", "admin");
    const parsed = patchSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const booking = await updateProviderBookingStatus(user.accountId, id, parsed.data.status);
    return NextResponse.json({ success: true, data: { booking } });
  } catch (err) {
    return apiError(err, "Could not update booking.");
  }
}
