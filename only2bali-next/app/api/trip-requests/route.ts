import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { tripRequestCreateSchema } from "@/lib/validators/marketplace";
import { createTravellerRequest } from "@/lib/repositories/marketplace";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireRole("traveller", "admin");
    const parsed = tripRequestCreateSchema.safeParse(await readJson(req, 24_576));
    if (!parsed.success) return validationError(parsed.error);

    const result = await createTravellerRequest(user.accountId, Boolean(user.mobile), parsed.data);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not create trip request.");
  }
}
