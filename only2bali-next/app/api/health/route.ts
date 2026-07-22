import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Liveness plus a real database round-trip. Used by the container healthcheck
 * and by uptime monitoring, so it must stay cheap and must never be cached.
 */
export async function GET() {
  const started = Date.now();
  let database: "connected" | "unreachable" = "unreachable";

  try {
    const { db } = await import("@/lib/db");
    await db.execute(sql`select 1`);
    database = "connected";
  } catch (err) {
    console.error("health: database check failed", err);
  }

  const ok = database === "connected";

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      database,
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - started,
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
