import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Production database is Neon (Vercel integration). Server TLS only.
 * Leftover Hostinger mTLS PEMs (PGSSL_*) are ignored so they cannot
 * attach client certificates to a Neon connection.
 */
export function sslConfig(url: string): postgres.Options<{}>["ssl"] {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();

  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (isLocal) {
    return process.env.DATABASE_SSL === "require" ? "require" : undefined;
  }

  return "require";
}

/** Neon Vercel integration writes `o2b_DATABASE_URL`. Prefer `DATABASE_URL`. */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const primary = env.DATABASE_URL?.trim();
  if (primary) return primary;
  return env.o2b_DATABASE_URL?.trim() || undefined;
}

/**
 * Connect lazily.
 *
 * Next.js imports every route module while collecting build output, so throwing
 * at import time would make the build require a reachable database. Failing on
 * first query instead keeps `next build` runnable in CI and on Vercel with no
 * database credentials present, while still failing loudly at runtime.
 *
 * One client per process: hot reload in development would otherwise open a new
 * pool on every edit until Postgres runs out of connections.
 */
const globalForDb = globalThis as unknown as {
  __o2bSql?: ReturnType<typeof postgres>;
  __o2bDb?: PostgresJsDatabase<typeof schema>;
};

function connect(): PostgresJsDatabase<typeof schema> {
  if (globalForDb.__o2bDb) return globalForDb.__o2bDb;

  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at Neon (sslmode=require)."
    );
  }

  const client =
    globalForDb.__o2bSql ??
    postgres(url, {
      // Serverless keeps many short-lived instances, so each pool stays small
      // rather than sitting on the server's 100-connection budget.
      max: Number(process.env.DATABASE_POOL_MAX ?? (process.env.VERCEL ? 3 : 10)),
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // safe across poolers and repeated cold starts
      ssl: sslConfig(url),
    });

  const instance = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__o2bSql = client;
    globalForDb.__o2bDb = instance;
  }

  return instance;
}

/**
 * Behaves like the Drizzle instance but defers connecting until the first
 * property access, so importing this module is free.
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(connect(), prop, receiver);
  },
});

export { schema };
export type Db = PostgresJsDatabase<typeof schema>;
