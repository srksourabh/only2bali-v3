import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { listSettingStatus, upsertSettings } from "@/lib/repositories/settings";
import { adminSettingsPatchSchema } from "@/lib/validators/settings";
import { GROUP_LABELS } from "@/lib/settings/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("admin");
    const settings = await listSettingStatus();
    return NextResponse.json(
      { success: true, data: { settings, groups: GROUP_LABELS } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return apiError(err, "Could not load integration settings.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole("admin");
    const body = adminSettingsPatchSchema.parse(await request.json());
    const result = await upsertSettings(body.values, user.accountId);
    const settings = await listSettingStatus();
    return NextResponse.json(
      { success: true, data: { ...result, settings } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return apiError(err, "Could not save integration settings.");
  }
}
