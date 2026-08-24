import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveDatabaseUrl, sslConfig } from "./index";

const postgresMock = vi.hoisted(() => vi.fn());
vi.mock("postgres", () => ({ default: postgresMock }));
vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: (client: unknown) => ({ __client: client, select: () => undefined }),
}));

const CERT = "-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----";
const KEY = `${["-----BEGIN", "PRIVATE KEY-----"].join(" ")}\ntest\n-----END PRIVATE KEY-----`;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("database TLS", () => {
  it("uses server TLS for Neon and ignores leftover Hostinger PEMs", () => {
    vi.stubEnv("PGSSL_CA", CERT);
    vi.stubEnv("PGSSL_CERT", CERT);
    vi.stubEnv("PGSSL_KEY", KEY);
    expect(sslConfig("postgres://user:pass@ep-x.ap-southeast-1.aws.neon.tech/neondb")).toBe(
      "require",
    );
  });

  it("uses server TLS for any remote host without client certificates", () => {
    expect(sslConfig("postgres://user:pass@db.example.com:5432/only2bali")).toBe("require");
  });

  it("leaves local Docker unencrypted unless DATABASE_SSL=require", () => {
    expect(sslConfig("postgres://user:pass@127.0.0.1:5432/only2bali")).toBeUndefined();
    vi.stubEnv("DATABASE_SSL", "require");
    expect(sslConfig("postgres://user:pass@127.0.0.1:5432/only2bali")).toBe("require");
  });
});

describe("resolveDatabaseUrl", () => {
  it("prefers DATABASE_URL over the Neon integration alias", () => {
    expect(
      resolveDatabaseUrl({
        NODE_ENV: "test",
        DATABASE_URL: "postgres://primary",
        o2b_DATABASE_URL: "postgres://neon-alias",
      }),
    ).toBe("postgres://primary");
  });

  it("falls back to o2b_DATABASE_URL when DATABASE_URL is empty", () => {
    expect(
      resolveDatabaseUrl({ NODE_ENV: "test", o2b_DATABASE_URL: "postgres://neon-alias" }),
    ).toBe(
      "postgres://neon-alias",
    );
  });
});

/**
 * The pool must be built once per process and then reused.
 *
 * This was guarded by `NODE_ENV !== "production"`, so production cached nothing
 * and the `db` Proxy opened a fresh connection - handshake, TLS, auth - for
 * every query. Nothing failed; it was merely slow, which is why it survived so
 * long. Assert the reuse rather than the environment, in production most of all.
 */
describe("connection reuse", () => {
  beforeEach(() => {
    postgresMock.mockReset();
    postgresMock.mockImplementation(() => ({ tag: Math.random() }));
    for (const key of ["__o2bSql", "__o2bDb"]) {
      delete (globalThis as Record<string, unknown>)[key];
    }
  });

  async function freshDb() {
    vi.resetModules();
    return (await import("./index")).db;
  }

  it("opens one pool for many queries in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@ep-x.aws.neon.tech/neondb");

    const db = await freshDb();
    // Every property access goes through the Proxy, which is what used to
    // build a new pool each time.
    void db.select;
    void db.select;
    void db.select;

    expect(postgresMock).toHaveBeenCalledTimes(1);
  });

  it("opens one pool in development too", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@127.0.0.1:5432/only2bali");

    const db = await freshDb();
    void db.select;
    void db.select;

    expect(postgresMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the pool small on Vercel so many instances cannot exhaust the server", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@ep-x.aws.neon.tech/neondb");

    const db = await freshDb();
    void db.select;

    expect(postgresMock.mock.calls[0]?.[1]).toMatchObject({ max: 3, prepare: false });
  });
});
