import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * The contract the package page depends on.
 *
 * On 2026-07-23 every package page in production returned 404 while the
 * database was unreachable, and nothing was logged, because the page caught the
 * failure and called notFound(). The page no longer catches — which is only
 * safe if a failed query rejects rather than quietly resolving to null.
 *
 * These tests pin that down. They need no database: the point is what happens
 * when there is not one.
 */
const DEAD_DB = "postgres://nobody:nobody@127.0.0.1:1/nothing";

function clearDbSingleton() {
  // lib/db caches one client on globalThis outside production so that hot
  // reload cannot exhaust the connection pool. Left in place it would defeat
  // resetModules and hand back a client pointed at the previous URL.
  const g = globalThis as Record<string, unknown>;
  delete g.__o2bSql;
  delete g.__o2bDb;
}

describe("getPackageBySlug when the database cannot be reached", () => {
  beforeEach(() => {
    vi.resetModules();
    clearDbSingleton();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearDbSingleton();
  });

  it("rejects rather than resolving to null", async () => {
    vi.stubEnv("DATABASE_URL", DEAD_DB);
    const { getPackageBySlug } = await import("./catalog");

    // Resolving null here is the bug: the caller cannot tell it apart from a
    // slug that genuinely does not exist, and answers 404 either way.
    await expect(getPackageBySlug("sattvik-serenity")).rejects.toThrow();
  });

  it("rejects for an unknown slug too — an outage is not a 404", async () => {
    vi.stubEnv("DATABASE_URL", DEAD_DB);
    const { getPackageBySlug } = await import("./catalog");

    await expect(getPackageBySlug("no-such-package")).rejects.toThrow();
  });

  it("refuses to connect at all with no DATABASE_URL set", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { getPackageBySlug } = await import("./catalog");

    await expect(getPackageBySlug("sattvik-serenity")).rejects.toThrow(/DATABASE_URL/);
  });
});

/**
 * The regression itself.
 *
 * The tests above pin the repository's contract, but the bug was one layer up:
 * the page caught the failure and called notFound(). This renders the page with
 * no database and insists the failure it produces is a database failure and not
 * a 404 — so re-adding `.catch(() => null)` fails the suite.
 */
describe("the package page during a database outage", () => {
  beforeEach(() => {
    vi.resetModules();
    clearDbSingleton();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearDbSingleton();
  });

  it("fails loudly instead of claiming the package does not exist", async () => {
    vi.stubEnv("DATABASE_URL", DEAD_DB);
    const { default: PackagePage } = await import("@/app/[lang]/packages/[slug]/page");

    const rendering = PackagePage({
      params: Promise.resolve({ lang: "en", slug: "sattvik-serenity" }),
    });

    const error = await rendering.then(
      () => null,
      (e: unknown) => e
    );

    expect(error, "rendering should have failed with no database").not.toBeNull();

    // notFound() throws an error carrying this digest. Seeing it here would mean
    // the outage had been reported to the visitor, and to Google, as a 404.
    const digest = (error as { digest?: string }).digest ?? "";
    expect(digest).not.toContain("404");
  });
});
