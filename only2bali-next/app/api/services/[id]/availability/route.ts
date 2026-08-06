import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { listListingAvailability } from "@/lib/repositories/listings-public";

export const dynamic = "force-dynamic";

/** Network-only: availability must never be cached at the edge. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const data = await listListingAvailability(id, {
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });
    if (!data) {
      return NextResponse.json({ success: false, error: "Service not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return apiError(err, "Could not load availability.");
  }
}
