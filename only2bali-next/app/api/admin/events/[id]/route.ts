import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { adminContentStatusSchema } from "@/lib/validators/admin";
import { adminPatchEvent } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("admin");
    const parsed = adminContentStatusSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const event = await adminPatchEvent(user.accountId, id, parsed.data);
    if (!event) return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: { event } });
  } catch (err) {
    return apiError(err, "Could not update event.");
  }
}
