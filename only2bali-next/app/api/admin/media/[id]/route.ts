import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { adminContentStatusSchema } from "@/lib/validators/admin";
import { adminPatchMedia } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("admin");
    const parsed = adminContentStatusSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const media = await adminPatchMedia(user.accountId, id, parsed.data);
    if (!media) return NextResponse.json({ success: false, error: "Media not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: { media } });
  } catch (err) {
    return apiError(err, "Could not update media.");
  }
}
