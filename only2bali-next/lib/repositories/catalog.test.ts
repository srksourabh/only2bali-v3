import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const DEAD_DB = "postgres://nobody:nobody@127.0.0.1:1/nothing";

function clearDbSingleton() {
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

  // A refused TCP connect on a loaded CI runner can take seconds before the
  // fallback kicks in; the assertion is about behavior, not speed.
  it("returns the curated fallback for a known package", { timeout: 20_000 }, async () => {
    vi.stubEnv("DATABASE_URL", DEAD_DB);
    const { getPackageBySlug } = await import("./catalog");

    const result = await getPackageBySlug("sattvik-serenity");
    expect(result?.slug).toBe("sattvik-serenity");
    expect(result?.itinerary.length).toBeGreaterThanOrEqual(5);
    expect(result?.departures.length).toBeGreaterThan(0);
  });

  it("keeps an unknown slug as a real not-found", async () => {
    vi.stubEnv("DATABASE_URL", DEAD_DB);
    const { getPackageBySlug } = await import("./catalog");

    await expect(getPackageBySlug("no-such-package")).resolves.toBeNull();
  });

  it("also falls back when no DATABASE_URL is set", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { getPackageBySlug } = await import("./catalog");

    const result = await getPackageBySlug("bali-veg-explorer");
    expect(result?.basePriceAmount).toBe(39_500 * 100);
  });
});

describe("the package page during a database outage", () => {
  beforeEach(() => {
    vi.resetModules();
    clearDbSingleton();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearDbSingleton();
  });

  it("renders a known package from fallback data", async () => {
    vi.stubEnv("DATABASE_URL", DEAD_DB);
    vi.doMock("@/lib/auth", () => ({
      getSessionUser: async () => null,
    }));
    const { default: PackagePage } = await import("@/app/[lang]/packages/[slug]/page");

    await expect(PackagePage({
      params: Promise.resolve({ lang: "en", slug: "sattvik-serenity" }),
    })).resolves.toBeTruthy();
  });
});
