import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { adminThreadStatusSchema } from "@/lib/validators/admin";
import { adminSetThreadStatus } from "@/lib/repositories/marketplace";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const parsed = adminThreadStatusSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const thread = await adminSetThreadStatus(id, parsed.data.status);
    if (!thread) {
      return NextResponse.json({ success: false, error: "Thread not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { thread } });
  } catch (err) {
    return apiError(err, "Could not update thread.");
  }
}
