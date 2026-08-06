import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { acceptOffer, declineOffer } from "@/lib/repositories/marketplace";

export const dynamic = "force-dynamic";

const declineSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireRole("traveller", "admin");
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "accept";

    if (action === "decline") {
      const parsed = declineSchema.safeParse(await readJson(req).catch(() => ({})));
      if (!parsed.success) return validationError(parsed.error);
      const result = await declineOffer(user.accountId, id, parsed.data.reason);
      if (!result.ok) {
        const status = result.reason === "forbidden" ? 403 : 409;
        return NextResponse.json({ success: false, error: result.reason }, { status });
      }
      return NextResponse.json({ success: true, data: result });
    }

    const result = await acceptOffer(user.accountId, id);
    if (!result.ok) {
      const status = result.reason === "forbidden" ? 403 : result.reason === "offer_not_found" ? 404 : 409;
      return NextResponse.json({ success: false, error: result.reason }, { status });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return apiError(err, "Could not update offer.");
  }
}
