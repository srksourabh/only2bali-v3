import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { providerDocumentSchema } from "@/lib/validators/provider";
import { getVendorByAccount } from "@/lib/repositories/provider";
import { addVendorDocument, listDocumentsForVendor } from "@/lib/repositories/vendor-documents";
import { verifyDocumentHandle } from "@/lib/uploads/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });
    const documents = await listDocumentsForVendor(provider.id);
    return NextResponse.json({ success: true, data: { documents } });
  } catch (err) {
    return apiError(err, "Could not load documents.");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole("vendor");
    const provider = await getVendorByAccount(user.accountId);
    if (!provider) return NextResponse.json({ success: false, error: "Provider profile not found." }, { status: 404 });

    const parsed = providerDocumentSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    const handle = verifyDocumentHandle(parsed.data.handle, provider.id);
    if (!handle || handle.p !== parsed.data.ref) {
      return NextResponse.json(
        { success: false, error: "Upload handle invalid or expired. Upload the file again." },
        { status: 400 }
      );
    }

    const document = await addVendorDocument({
      vendorId: provider.id,
      kind: parsed.data.kind,
      fileUrl: handle.p,
    });
    return NextResponse.json({ success: true, data: { document } }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not save document.");
  }
}
