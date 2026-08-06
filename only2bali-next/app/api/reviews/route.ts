import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { createReviewSchema } from "@/lib/validators/reviews";
import { createReview, listPublishedVendorReviews } from "@/lib/repositories/reviews";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const vendorId = new URL(req.url).searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendorId is required." }, { status: 400 });
    }
    const reviews = await listPublishedVendorReviews(vendorId);
    return NextResponse.json({ success: true, data: { reviews } });
  } catch (err) {
    return apiError(err, "Could not load reviews.");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole("traveller", "vendor", "admin");
    const parsed = createReviewSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);
    const review = await createReview(user.accountId, user.role, parsed.data);
    return NextResponse.json({ success: true, data: { review } }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not save review.");
  }
}
