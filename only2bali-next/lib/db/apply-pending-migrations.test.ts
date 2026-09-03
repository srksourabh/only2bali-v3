import { describe, expect, it } from "vitest";
import {
  authorizeMigrate,
  migrateTokenFrom,
  resolveMigrationsFolder,
} from "./apply-pending-migrations";

const token = "a".repeat(32);

describe("migrateTokenFrom", () => {
  it("rejects missing and short tokens", () => {
    expect(migrateTokenFrom({})).toBeNull();
    expect(migrateTokenFrom({ MIGRATE_TOKEN: "short" })).toBeNull();
    expect(migrateTokenFrom({ MIGRATE_TOKEN: `  ${token}  ` })).toBe(token);
  });
});

describe("authorizeMigrate", () => {
  it("refuses when the token is unset", () => {
    expect(authorizeMigrate(`Bearer ${token}`, null)).toBe(false);
  });

  it("refuses a missing or non-bearer header", () => {
    expect(authorizeMigrate(null, token)).toBe(false);
    expect(authorizeMigrate(token, token)).toBe(false);
  });

  it("accepts an exact bearer match and rejects a mismatch", () => {
    expect(authorizeMigrate(`Bearer ${token}`, token)).toBe(true);
    expect(authorizeMigrate(`Bearer ${"b".repeat(32)}`, token)).toBe(false);
  });
});

describe("resolveMigrationsFolder", () => {
  it("finds the committed journal from the app cwd", () => {
    expect(resolveMigrationsFolder()).toMatch(/lib[\\/]db[\\/]migrations$/);
  });
});
