import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getPublicServiceById } from "@/lib/repositories/listings-public";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const service = await getPublicServiceById(id);
    if (!service) {
      return NextResponse.json({ success: false, error: "Service not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { service } });
  } catch (err) {
    return apiError(err, "Could not load service.");
  }
}
