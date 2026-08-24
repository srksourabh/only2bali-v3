import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import {
  authorizeMigrate,
  catchUpProductionSchema,
  migrateTokenFrom,
} from "@/lib/db/apply-pending-migrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Explicit apply of committed Drizzle SQL using the production DATABASE_URL
 * already present in the Vercel runtime. Fail-closed without MIGRATE_TOKEN
 * (>=32 chars). POST + Bearer only.
 *
 * GET /api/health also catch-up when schema.current is false, so this route
 * is the retry lever if health times out mid-migrate.
 */
export async function POST(req: Request) {
  const token = migrateTokenFrom();
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Migrate endpoint is not configured." },
      { status: 503 },
    );
  }
  if (!authorizeMigrate(req.headers.get("authorization"), token)) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await catchUpProductionSchema();
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return apiError(err, "Could not apply migrations.");
  }
}
