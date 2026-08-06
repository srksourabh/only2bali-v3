import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { adminPatchDisbursement } from "@/lib/repositories/disbursements";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  action: z.enum(["release_hold", "approve", "mark_paid", "fail"]),
  failureMessage: z.string().trim().max(500).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireRole("admin");
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const result = await adminPatchDisbursement(user.accountId, id, parsed.data.action, {
      failureMessage: parsed.data.failureMessage,
    });
    if (!result) {
      return NextResponse.json({ success: false, error: "Disbursement not found." }, { status: 404 });
    }
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.reason }, { status: 409 });
    }
    return NextResponse.json({ success: true, data: { disbursement: result.disbursement } });
  } catch (err) {
    return apiError(err, "Could not update disbursement.");
  }
}
