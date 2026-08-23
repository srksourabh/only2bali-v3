/**
 * Production Postgres has historically trailed the Drizzle journal
 * (0000–0002 live, 0003+ pending). Public catalogue queries must
 * recognise that and retry against columns that exist on 0000.
 */
export function isSchemaLagError(err: unknown): boolean {
  if (!err || typeof err !== "object") {
    return false;
  }
  const e = err as { code?: string; message?: string; cause?: { code?: string; message?: string } };
  const code = e.code ?? e.cause?.code;
  if (code === "42703" || code === "42P01") return true;
  const message = `${e.message ?? ""} ${e.cause?.message ?? ""}`;
  return /column .+ does not exist/i.test(message) || /relation .+ does not exist/i.test(message);
}
