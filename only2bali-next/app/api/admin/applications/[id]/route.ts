import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { adminApplicationDecisionSchema } from "@/lib/validators/admin";
import { adminDecideApplication } from "@/lib/repositories/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("admin");
    const parsed = adminApplicationDecisionSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const application = await adminDecideApplication(user.accountId, id, parsed.data);
    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { application } });
  } catch (err) {
    return apiError(err, "Could not update application.");
  }
}
