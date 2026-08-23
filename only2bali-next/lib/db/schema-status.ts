import { sql, type SQL } from "drizzle-orm";
import journal from "./migrations/meta/_journal.json";
import { isSchemaLagError } from "./schema-lag";

export const EXPECTED_MIGRATION_COUNT = journal.entries.length;

export type SchemaStatus = {
  applied: number | null;
  expected: number;
  current: boolean;
  authReady: boolean;
  catalogueColumns: boolean;
};

export type SchemaQueryable = {
  execute: (query: SQL) => Promise<unknown>;
};

export function emptySchemaStatus(): SchemaStatus {
  return {
    applied: null,
    expected: EXPECTED_MIGRATION_COUNT,
    current: false,
    authReady: false,
    catalogueColumns: false,
  };
}

function asRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: Record<string, unknown>[] }).rows;
  }
  return [];
}

async function columnOrTableExists(db: SchemaQueryable, query: SQL): Promise<boolean> {
  try {
    await db.execute(query);
    return true;
  } catch (err) {
    if (isSchemaLagError(err)) return false;
    throw err;
  }
}

/**
 * Cheap probes for operators. Does not change the health pass/fail verdict:
 * a lagged catalogue still serves listings via the 0000 retry path.
 */
export async function readSchemaStatus(db: SchemaQueryable): Promise<SchemaStatus> {
  const expected = EXPECTED_MIGRATION_COUNT;
  let applied: number | null = null;

  try {
    const result = await db.execute(sql`select count(*)::int as n from drizzle."__drizzle_migrations"`);
    const raw = asRows(result)[0]?.n;
    const n = typeof raw === "number" ? raw : Number(raw);
    applied = Number.isFinite(n) ? n : 0;
  } catch (err) {
    if (isSchemaLagError(err)) {
      applied = 0;
    } else {
      throw err;
    }
  }

  const catalogueColumns = await columnOrTableExists(db, sql`select city from vendor limit 0`);
  const usernameReady = await columnOrTableExists(
    db,
    sql`select username, password_hash from account limit 0`
  );
  const oauthReady = await columnOrTableExists(db, sql`select 1 from oauth_account limit 0`);
  const authReady = usernameReady && oauthReady;
  const current = applied !== null && applied >= expected && catalogueColumns && authReady;

  return { applied, expected, current, authReady, catalogueColumns };
}
