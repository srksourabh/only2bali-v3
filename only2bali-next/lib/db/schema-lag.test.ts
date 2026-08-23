import { describe, expect, it } from "vitest";
import { isSchemaLagError } from "./schema-lag";

describe("isSchemaLagError", () => {
  it("matches Postgres undefined_column", () => {
    expect(isSchemaLagError({ code: "42703", message: 'column "city" does not exist' })).toBe(true);
  });

  it("matches Postgres undefined_table", () => {
    expect(isSchemaLagError({ code: "42P01", message: 'relation "vendor_media" does not exist' })).toBe(
      true
    );
  });

  it("matches node-pg message text without a code", () => {
    expect(isSchemaLagError({ message: 'column vendor.city does not exist' })).toBe(true);
  });

  it("ignores unrelated failures", () => {
    expect(isSchemaLagError({ code: "ECONNREFUSED", message: "connect ECONNREFUSED" })).toBe(false);
    expect(isSchemaLagError(new Error("timeout"))).toBe(false);
    expect(isSchemaLagError("nope")).toBe(false);
  });
});
