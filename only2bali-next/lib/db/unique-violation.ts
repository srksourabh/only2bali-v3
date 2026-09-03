/**
 * Postgres unique_violation. Drizzle/postgres.js may wrap the driver error,
 * so we walk `cause` rather than assuming the top object is the pg error.
 */
export function uniqueConstraintName(err: unknown): string | null {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth++) {
    const row = current as {
      code?: unknown;
      constraint?: unknown;
      constraint_name?: unknown;
      cause?: unknown;
    };
    if (row.code === "23505") {
      if (typeof row.constraint_name === "string" && row.constraint_name) return row.constraint_name;
      if (typeof row.constraint === "string" && row.constraint) return row.constraint;
      return "";
    }
    current = row.cause;
  }
  return null;
}
