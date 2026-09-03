import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { verifyMobileConfirmSchema } from "@/lib/validators/auth";
import { confirmMobileVerification } from "@/lib/auth/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = verifyMobileConfirmSchema.safeParse(await readJson(req, 2048));
    if (!parsed.success) return validationError(parsed.error);

    const result = await confirmMobileVerification(user.accountId, parsed.data.mobile, parsed.data.code);
    if (!result.ok) {
      const status = result.reason === "mobile_taken" ? 409 : 400;
      const error =
        result.reason === "mobile_taken"
          ? "That mobile number is already used on another account."
          : result.reason === "locked"
            ? "Too many incorrect attempts. Request a new code."
            : result.reason === "expired"
              ? "That code has expired. Request a new one."
              : "That code is not valid.";
      return NextResponse.json({ success: false, error, reason: result.reason }, { status });
    }

    return NextResponse.json({ success: true, data: { verified: true } });
  } catch (err) {
    return apiError(err, "Could not verify that mobile number.");
  }
}
