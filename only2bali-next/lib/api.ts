import { NextResponse } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth";

export async function readJson(req: Request, maxBytes = 16_384): Promise<unknown> {
  const raw = await req.text();
  if (raw.length > maxBytes) throw Object.assign(new Error("Request too large."), { status: 413 });
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error("Invalid JSON."), { status: 400 });
  }
}

export function validationError(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return NextResponse.json(
    {
      success: false,
      error: "Check the details and try again.",
      fields: error.issues.map((i) => ({ path: i.path.map(String).join("."), message: i.message })),
    },
    { status: 400 }
  );
}

export function apiError(err: unknown, fallback: string) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ success: false, error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ success: false, error: err.message }, { status: 403 });
  }
  if (err instanceof Error && "status" in err && typeof err.status === "number") {
    return NextResponse.json({ success: false, error: err.message }, { status: err.status });
  }
  console.error(fallback, err);
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}
