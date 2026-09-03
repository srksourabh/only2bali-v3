import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { adminLeadStatusSchema } from "@/lib/validators/admin";
import { adminSetLeadStatus } from "@/lib/repositories/leads";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const parsed = adminLeadStatusSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const lead = await adminSetLeadStatus(id, parsed.data);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { lead } });
  } catch (err) {
    return apiError(err, "Could not update lead.");
  }
}
