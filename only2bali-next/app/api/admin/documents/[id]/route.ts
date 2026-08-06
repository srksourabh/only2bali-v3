import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { reviewVendorDocument } from "@/lib/repositories/vendor-documents";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireRole("admin");
    const { id } = await ctx.params;
    const parsed = reviewSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const document = await reviewVendorDocument({
      documentId: id,
      status: parsed.data.status,
      reviewerAccountId: user.accountId,
    });
    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found or already reviewed." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { document } });
  } catch (err) {
    return apiError(err, "Could not review document.");
  }
}
