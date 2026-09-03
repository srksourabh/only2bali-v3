import { describe, expect, it } from "vitest";
import { EXPECTED_MIGRATION_COUNT, emptySchemaStatus, readSchemaStatus } from "./schema-status";
import journal from "./migrations/meta/_journal.json";

/** Every migration added moved this. Read it from the journal, as the code does. */
const COUNT = journal.entries.length;

const lag = { code: "42703", message: 'column "city" does not exist' };
const missingTable = { code: "42P01", message: 'relation "oauth_account" does not exist' };

function fakeDb(script: Array<{ ok: true; result?: unknown } | { ok: false; err: unknown }>) {
  let i = 0;
  return {
    execute: async () => {
      const step = script[i++];
      if (!step) throw new Error(`unexpected execute #${i}`);
      if (!step.ok) throw step.err;
      return step.result ?? [];
    },
  };
}

describe("readSchemaStatus", () => {
  it("reads the journal length as the expected count", () => {
    expect(EXPECTED_MIGRATION_COUNT).toBe(COUNT);
    expect(emptySchemaStatus().expected).toBe(COUNT);
    // A journal that failed to load would read as zero and quietly make every
    // deployment look up to date.
    expect(COUNT).toBeGreaterThanOrEqual(8);
    expect(emptySchemaStatus().applied).toBeNull();
  });

  it("reports current when applied count and 0003/0004 probes succeed", async () => {
    const status = await readSchemaStatus(
      fakeDb([
        { ok: true, result: [{ n: COUNT }] },
        { ok: true },
        { ok: true },
        { ok: true },
      ])
    );
    expect(status).toEqual({
      applied: COUNT,
      expected: COUNT,
      current: true,
      authReady: true,
      catalogueColumns: true,
    });
  });

  it("reports the production lag: 0000–0002 only", async () => {
    const status = await readSchemaStatus(
      fakeDb([
        { ok: true, result: [{ n: 3 }] },
        { ok: false, err: lag },
        { ok: false, err: lag },
        { ok: false, err: missingTable },
      ])
    );
    expect(status).toEqual({
      applied: 3,
      expected: COUNT,
      current: false,
      authReady: false,
      catalogueColumns: false,
    });
  });

  it("treats a missing drizzle journal table as zero applied", async () => {
    const status = await readSchemaStatus(
      fakeDb([
        { ok: false, err: missingTable },
        { ok: true },
        { ok: true },
        { ok: true },
      ])
    );
    expect(status.applied).toBe(0);
    expect(status.current).toBe(false);
    expect(status.authReady).toBe(true);
    expect(status.catalogueColumns).toBe(true);
  });

  it("accepts drizzle-kit { rows } execute shape", async () => {
    const status = await readSchemaStatus(
      fakeDb([
        { ok: true, result: { rows: [{ n: String(COUNT) }] } },
        { ok: true },
        { ok: true },
        { ok: true },
      ])
    );
    expect(status.applied).toBe(COUNT);
    expect(status.current).toBe(true);
  });
});
