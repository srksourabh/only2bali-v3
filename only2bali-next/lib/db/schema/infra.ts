import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Rate-limit counters, shared across every serverless instance.
 *
 * The previous limiter kept counters in module memory. On Vercel that means one
 * bucket per warm lambda, so an attacker spreading requests across instances got
 * a multiple of the intended limit — and each OTP costs real money to send.
 *
 * One row per key. The window is advanced by the same statement that increments
 * the counter, so two concurrent requests cannot both believe they are first.
 */
export const rateLimitCounter = pgTable(
  "rate_limit",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("rate_limit_reset_idx").on(t.resetAt)]
);
