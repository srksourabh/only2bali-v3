import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { db } from "@/lib/db";
import { vendor } from "@/lib/db/schema";
import { getVendorDocumentById } from "@/lib/repositories/vendor-documents";
import { readDocumentBytes } from "@/lib/uploads/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * The only way a KYC document's bytes leave the server. Raw storage locations
 * are never client-visible; this route enforces that the requester is an
 * admin or the vendor who uploaded the file.
 */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;

    const document = await getVendorDocumentById(id);
    if (!document) return NextResponse.json({ success: false, error: "Document not found." }, { status: 404 });

    if (user.role !== "admin") {
      const [owner] = await db
        .select({ accountId: vendor.accountId })
        .from(vendor)
        .where(eq(vendor.id, document.vendorId))
        .limit(1);
      if (!owner || owner.accountId !== user.accountId) throw new ForbiddenError();
    }

    const stored = await readDocumentBytes(document.fileUrl);
    if (!stored) return NextResponse.json({ success: false, error: "File missing from storage." }, { status: 404 });

    return new Response(new Uint8Array(stored.bytes), {
      status: 200,
      headers: {
        "content-type": stored.contentType,
        "content-disposition": `attachment; filename="${document.kind}-${document.id.slice(0, 8)}"`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: "Could not load document." }, { status: 500 });
  }
}
