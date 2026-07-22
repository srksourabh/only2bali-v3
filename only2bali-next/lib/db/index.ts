import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance."
  );
}

/**
 * One client per process. Next.js hot-reloads modules in development, which
 * would otherwise open a new pool on every edit until the server runs out of
 * connections.
 */
const globalForDb = globalThis as unknown as { __o2bSql?: ReturnType<typeof postgres> };

const client =
  globalForDb.__o2bSql ??
  postgres(url, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    // Self-hosted Postgres reached over a tunnel still speaks TLS if configured;
    // set DATABASE_SSL=require in the environment to demand it.
    ssl: process.env.DATABASE_SSL === "require" ? "require" : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__o2bSql = client;

export const db = drizzle(client, { schema });
export { schema };
export type Db = typeof db;
