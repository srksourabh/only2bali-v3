import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { adminVendorVerificationSchema } from "@/lib/validators/admin";
import { adminSetVendorVerification } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("admin");
    const parsed = adminVendorVerificationSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const vendor = await adminSetVendorVerification(user.accountId, id, parsed.data);
    if (!vendor) {
      return NextResponse.json({ success: false, error: "Provider not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { vendor } });
  } catch (err) {
    return apiError(err, "Could not update provider verification.");
  }
}
