import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { adminPromotionPatchSchema } from "@/lib/validators/admin";
import { adminPatchPromotion } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("admin");
    const parsed = adminPromotionPatchSchema.safeParse(await readJson(req, 24_576));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const promotion = await adminPatchPromotion(user.accountId, id, parsed.data);
    if (!promotion) return NextResponse.json({ success: false, error: "Offer not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: { promotion } });
  } catch (err) {
    return apiError(err, "Could not update offer.");
  }
}
