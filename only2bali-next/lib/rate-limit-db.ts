import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimit as rateLimitMemory, type RateLimitResult } from "./rate-limit";

/**
 * Rate limiting that every instance shares.
 *
 * One row per key in Postgres. The window is advanced by the same statement
 * that increments the counter, so two concurrent requests cannot both conclude
 * they opened the window — which is exactly what the in-memory limiter got
 * wrong once Vercel ran more than one lambda.
 *
 * If the database cannot be reached the in-memory limiter answers instead. That
 * is weaker, but a database blip should degrade the limit, not remove it and
 * not take the endpoint down.
 */
export async function rateLimitShared(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const resetAt = new Date(Date.now() + windowMs);

  try {
    const rows = (await db.execute(sql`
      insert into rate_limit (key, count, reset_at)
      values (${key}, 1, ${resetAt.toISOString()})
      on conflict (key) do update set
        count = case when rate_limit.reset_at <= now() then 1 else rate_limit.count + 1 end,
        reset_at = case when rate_limit.reset_at <= now() then excluded.reset_at else rate_limit.reset_at end
      returning count, reset_at
    `)) as unknown as Array<{ count: number; reset_at: string | Date }>;

    const row = rows[0];
    const count = Number(row.count);
    const windowEnds = new Date(row.reset_at).getTime();
    const retryAfterSeconds = Math.max(1, Math.ceil((windowEnds - Date.now()) / 1000));

    void sweep();

    if (count > limit) return { allowed: false, remaining: 0, retryAfterSeconds };
    return { allowed: true, remaining: limit - count, retryAfterSeconds: 0 };
  } catch (err) {
    console.warn("[rate-limit] Postgres counter unavailable, falling back to memory", err);
    return rateLimitMemory(key, limit, windowMs);
  }
}

/**
 * Drop expired rows occasionally rather than on every request.
 *
 * The table would otherwise grow one row per address per endpoint forever. One
 * sweep in roughly a hundred requests is enough to keep it small and costs
 * nothing measurable.
 */
async function sweep(): Promise<void> {
  if (Math.random() > 0.01) return;
  try {
    await db.execute(sql`delete from rate_limit where reset_at <= now() - interval '1 hour'`);
  } catch {
    /* housekeeping only — never let this affect the request */
  }
}
