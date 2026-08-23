import { describe, expect, it } from "vitest";
import { apiError } from "./api";
import { SCHEMA_LAG_CODE, SCHEMA_LAG_MESSAGE } from "./db/schema-lag";

describe("apiError", () => {
  it("maps a Postgres schema-lag error to 503", async () => {
    const res = apiError(
      { code: "42703", message: 'column "username" does not exist' },
      "Could not sign in."
    );
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: SCHEMA_LAG_MESSAGE,
      code: SCHEMA_LAG_CODE,
    });
  });

  it("maps a missing oauth_account table to 503", async () => {
    const res = apiError(
      { code: "42P01", message: 'relation "oauth_account" does not exist' },
      "Could not bridge Clerk session."
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("schema_lag");
  });

  it("keeps unrelated failures as 500", async () => {
    const res = apiError(new Error("connection timed out"), "Could not sign in.");
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: "Could not sign in.",
    });
  });
});
