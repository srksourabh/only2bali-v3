/**
 * Production Postgres has historically trailed the Drizzle journal
 * (0000–0002 live, 0003+ pending). Public catalogue queries must
 * recognise that and retry against columns that exist on 0000.
 *
 * Auth and media writes cannot degrade the same way — they need 0004 —
 * so API routes map this to HTTP 503 with `code: "schema_lag"`.
 */
export const SCHEMA_LAG_CODE = "schema_lag";
export const SCHEMA_LAG_MESSAGE =
  "This feature needs a database update that has not been applied yet.";

export function isSchemaLagError(err: unknown): boolean {
  let current: unknown = err;
  for (let i = 0; i < 6 && current; i++) {
    if (typeof current !== "object") return false;
    const e = current as { code?: string; message?: string; cause?: unknown };
    if (e.code === "42703" || e.code === "42P01") return true;
    const message = e.message ?? "";
    if (/column .+ does not exist/i.test(message) || /relation .+ does not exist/i.test(message)) {
      return true;
    }
    current = e.cause;
  }
  return false;
}
