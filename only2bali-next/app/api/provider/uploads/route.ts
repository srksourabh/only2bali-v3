import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { getVendorByAccount } from "@/lib/repositories/provider";
import {
  storeUpload,
  UploadSetupError,
  UploadValidationError,
  uploadsConfigured,
} from "@/lib/uploads/store";

export const dynamic = "force-dynamic";

/**
 * Multipart upload for provider media and KYC documents.
 * Form fields: `file` (required), `folder` = media | documents (default media).
 */
export async function POST(req: Request) {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) {
      return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    }
    if (!(await uploadsConfigured())) {
      throw new UploadSetupError(
        "File uploads are not configured. Set BLOB_READ_WRITE_TOKEN or paste it under Admin → Integration settings."
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Attach a file." }, { status: 400 });
    }
    const folderRaw = String(form.get("folder") ?? "media");
    const folder = folderRaw === "documents" ? "documents" : "media";

    const stored = await storeUpload(file, { folder, vendorId: provider.id });
    return NextResponse.json({ success: true, data: { upload: stored } }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadSetupError) {
      return NextResponse.json(
        { success: false, error: err.message, reason: "upload_setup_required" },
        { status: 503 }
      );
    }
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    return apiError(err, "Could not upload file.");
  }
}
