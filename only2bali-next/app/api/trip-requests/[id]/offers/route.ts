import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { listOffersForRequest } from "@/lib/repositories/marketplace";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const result = await listOffersForRequest(id, user.accountId, user.role);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: { offers: result.offers } }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return apiError(err, "Could not load offers.");
  }
}
