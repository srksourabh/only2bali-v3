import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { refundBookingFromPlatform } from "@/lib/repositories/disbursements";

export const dynamic = "force-dynamic";

const refundSchema = z.object({
  amount: z.number().int().positive().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireRole("admin");
    const { id } = await ctx.params;
    const parsed = refundSchema.safeParse((await readJson(req).catch(() => ({}))) ?? {});
    if (!parsed.success) return validationError(parsed.error);

    const result = await refundBookingFromPlatform(user.accountId, id, parsed.data.amount);
    if (!result.ok) {
      const status = result.reason === "payment_not_found" ? 404 : 409;
      return NextResponse.json({ success: false, error: result.reason }, { status });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return apiError(err, "Could not refund payment.");
  }
}
