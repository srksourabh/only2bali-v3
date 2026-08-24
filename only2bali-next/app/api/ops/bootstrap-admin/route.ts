import { NextResponse } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api";
import { authorizeMigrate, migrateTokenFrom } from "@/lib/db/apply-pending-migrations";
import { upsertAdminAccount } from "@/lib/repositories/admin";
import { bootstrapAdminSchema } from "@/lib/validators/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Create or reset a password admin using the production DATABASE_URL already
 * in the Vercel runtime. Fail-closed without MIGRATE_TOKEN (>=32 chars).
 * Same gate as POST /api/ops/migrate. There is no public admin signup.
 */
export async function POST(req: Request) {
  const token = migrateTokenFrom();
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Admin bootstrap is not configured." },
      { status: 503 },
    );
  }
  if (!authorizeMigrate(req.headers.get("authorization"), token)) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const parsed = bootstrapAdminSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);
    const result = await upsertAdminAccount(parsed.data);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return apiError(err, "Could not create admin.");
  }
}
