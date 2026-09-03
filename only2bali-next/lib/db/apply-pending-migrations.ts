import { existsSync } from "node:fs";
import { join } from "node:path";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { safeEqual } from "@/lib/auth/crypto";
import { resolveDatabaseUrl, sslConfig } from "./index";
import { readSchemaStatus, type SchemaStatus } from "./schema-status";

export const MIGRATE_TOKEN_MIN_LENGTH = 32;

export type MigrateResult = SchemaStatus & { skipped: boolean };

export function migrateTokenFrom(env?: { MIGRATE_TOKEN?: string }): string | null {
  const token = (env?.MIGRATE_TOKEN ?? process.env.MIGRATE_TOKEN)?.trim();
  if (!token || token.length < MIGRATE_TOKEN_MIN_LENGTH) return null;
  return token;
}

export function authorizeMigrate(authorization: string | null, token: string | null): boolean {
  if (!token) return false;
  if (!authorization?.startsWith("Bearer ")) return false;
  return safeEqual(authorization.slice("Bearer ".length), token);
}

export function resolveMigrationsFolder(cwd = process.cwd()): string {
  const candidates = [
    join(cwd, "lib/db/migrations"),
    join(cwd, "only2bali-next/lib/db/migrations"),
  ];
  for (const folder of candidates) {
    if (existsSync(join(folder, "meta/_journal.json"))) return folder;
  }
  throw new Error("Drizzle migrations folder was not bundled with this function.");
}

/**
 * Apply committed SQL that is ahead of `__drizzle_migrations`. Additive only
 * in this repo: 0003–0006 create tables/columns and replace one unique key.
 * Drizzle takes an advisory lock, so two overlapping invokes do not double-apply.
 */
export async function applyPendingMigrations(
  db: PostgresJsDatabase,
  folder = resolveMigrationsFolder(),
): Promise<MigrateResult> {
  const before = await readSchemaStatus(db);
  if (before.current) {
    return { ...before, skipped: true };
  }
  await migrate(db, { migrationsFolder: folder });
  const after = await readSchemaStatus(db);
  return { ...after, skipped: false };
}

/** Own client so the Drizzle migrator does not depend on the lazy `db` proxy. */
export async function catchUpProductionSchema(): Promise<MigrateResult> {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw Object.assign(new Error("DATABASE_URL is not set."), { status: 503 });
  }
  const client = postgres(url, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
    ssl: sslConfig(url),
  });
  try {
    return await applyPendingMigrations(drizzle(client));
  } finally {
    await client.end({ timeout: 5 });
  }
}
