import { describe, expect, it } from "vitest";
import { uniqueConstraintName } from "./unique-violation";

describe("uniqueConstraintName", () => {
  it("reads a postgres.js unique violation", () => {
    expect(
      uniqueConstraintName({ code: "23505", constraint_name: "account_email_unique" })
    ).toBe("account_email_unique");
  });

  it("walks a wrapped cause", () => {
    expect(
      uniqueConstraintName({
        message: "Failed query",
        cause: { code: "23505", constraint: "account_username_unique" },
      })
    ).toBe("account_username_unique");
  });

  it("ignores other sql errors", () => {
    expect(uniqueConstraintName({ code: "23503", constraint_name: "booking_listing_fk" })).toBeNull();
    expect(uniqueConstraintName(new Error("nope"))).toBeNull();
  });
});
