import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/api";
import { providerDocumentSchema } from "@/lib/validators/provider";
import { getVendorByAccount } from "@/lib/repositories/provider";
import { addVendorDocument, listDocumentsForVendor } from "@/lib/repositories/vendor-documents";

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

    const document = await addVendorDocument({
      vendorId: provider.id,
      kind: parsed.data.kind,
      fileUrl: parsed.data.fileUrl,
    });
    return NextResponse.json({ success: true, data: { document } }, { status: 201 });
  } catch (err) {
    return apiError(err, "Could not save document.");
  }
}
