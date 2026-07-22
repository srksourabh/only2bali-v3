import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance."
  );
}

/** Vercel env vars cannot hold raw newlines, so PEMs are stored base64-encoded. */
function pem(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = raw.includes("-----BEGIN")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  if (!value.includes("-----BEGIN")) {
    throw new Error(`${name} is set but is not a PEM (neither raw nor base64).`);
  }
  return value;
}

const ca = pem("PGSSL_CA");
const cert = pem("PGSSL_CERT");
const key = pem("PGSSL_KEY");

/**
 * The database lives on our own VPS and is reached across the public internet,
 * so the connection has to prove two things in both directions:
 *
 *   - the server is ours          → `ca` + rejectUnauthorized, so a MITM with a
 *                                   valid public certificate is still refused
 *   - the client is ours          → `cert` + `key`, which pg_hba.conf demands
 *                                   via clientcert=verify-full
 *
 * A stolen DATABASE_URL on its own is therefore not enough to connect.
 */
function sslConfig(): postgres.Options<{}>["ssl"] {
  if (ca && cert && key) {
    return { ca, cert, key, rejectUnauthorized: true };
  }

  if (ca || cert || key) {
    throw new Error(
      "Partial TLS configuration: PGSSL_CA, PGSSL_CERT and PGSSL_KEY must all be set, or none of them."
    );
  }

  // No certificates: only acceptable when Postgres is local (a dev container or
  // an SSH tunnel to loopback). Refuse to run unverified over the internet.
  const host = (() => {
    try {
      return new URL(url!).hostname;
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
 * One client per process. Next.js hot-reloads modules in development, which
 * would otherwise open a new pool on every edit until Postgres runs out of
 * connections.
 */
const globalForDb = globalThis as unknown as { __o2bSql?: ReturnType<typeof postgres> };

const client =
  globalForDb.__o2bSql ??
  postgres(url, {
    // Serverless: many short-lived instances, so keep each pool small and let
    // idle connections go rather than sitting on the server's 100-slot budget.
    max: Number(process.env.DATABASE_POOL_MAX ?? (process.env.VERCEL ? 3 : 10)),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // safe across poolers and repeated cold starts
    ssl: sslConfig(),
  });

if (process.env.NODE_ENV !== "production") globalForDb.__o2bSql = client;

export const db = drizzle(client, { schema });
export { schema };
export type Db = typeof db;
