import { describe, expect, it } from "vitest";
import { EXPECTED_MIGRATION_COUNT, emptySchemaStatus, readSchemaStatus } from "./schema-status";

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
    expect(EXPECTED_MIGRATION_COUNT).toBe(8);
    expect(emptySchemaStatus().expected).toBe(8);
    expect(emptySchemaStatus().applied).toBeNull();
  });

  it("reports current when applied count and 0003/0004 probes succeed", async () => {
    const status = await readSchemaStatus(
      fakeDb([
        { ok: true, result: [{ n: 8 }] },
        { ok: true },
        { ok: true },
        { ok: true },
      ])
    );
    expect(status).toEqual({
      applied: 8,
      expected: 8,
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
      expected: 8,
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
        { ok: true, result: { rows: [{ n: "8" }] } },
        { ok: true },
        { ok: true },
        { ok: true },
      ])
    );
    expect(status.applied).toBe(8);
    expect(status.current).toBe(true);
  });
});
