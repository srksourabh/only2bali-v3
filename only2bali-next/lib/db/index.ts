import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/** Vercel env vars cannot hold raw newlines, so PEMs are stored base64-encoded. */
function pem(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = raw.includes("-----BEGIN") ? raw : Buffer.from(raw, "base64").toString("utf8");
  if (!value.includes("-----BEGIN")) {
    throw new Error(`${name} is set but is not a PEM (neither raw nor base64).`);
  }
  return value;
}

/**
 * The database lives on our own VPS and is reached across the public internet,
 * so the connection proves two things in both directions:
 *
 *   - the server is ours  → `ca` + rejectUnauthorized, so a MITM holding a
 *                           valid public certificate is still refused
 *   - the client is ours  → `cert` + `key`, which pg_hba.conf demands via
 *                           clientcert=verify-full
 *
 * A stolen DATABASE_URL on its own is therefore not enough to connect.
 */
function sslConfig(url: string): postgres.Options<{}>["ssl"] {
  const ca = pem("PGSSL_CA");
  const cert = pem("PGSSL_CERT");
  const key = pem("PGSSL_KEY");

  if (ca && cert && key) return { ca, cert, key, rejectUnauthorized: true };

  if (ca || cert || key) {
    throw new Error(
      "Partial TLS configuration: PGSSL_CA, PGSSL_CERT and PGSSL_KEY must all be set, or none of them."
    );
  }

  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";

  if (!isLocal && process.env.NODE_ENV === "production") {
    throw new Error(
      `Refusing to connect to ${host} without client certificates. ` +
        "Set PGSSL_CA, PGSSL_CERT and PGSSL_KEY, or tunnel to 127.0.0.1."
    );
  }

  return process.env.DATABASE_SSL === "require" ? "require" : undefined;
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

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance."
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
