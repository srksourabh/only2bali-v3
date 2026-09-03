import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { platformFeePatchSchema } from "@/lib/validators/admin";
import { getPlatformFeeSetting, setPlatformFeePercent } from "@/lib/repositories/platform-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("admin");
    const fee = await getPlatformFeeSetting();
    return NextResponse.json(
      { success: true, data: { platformFee: fee } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return apiError(err, "Could not load platform settings.");
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireRole("admin");
    const parsed = platformFeePatchSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const fee = await setPlatformFeePercent(parsed.data.platformFeePercent, user.accountId);
    return NextResponse.json({ success: true, data: { platformFee: fee } });
  } catch (err) {
    return apiError(err, "Could not save platform fee.");
  }
}
