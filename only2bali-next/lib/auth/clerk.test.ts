import { describe, it, expect, afterEach } from "vitest";
import { clerkConfigured, pickVerifiedEmail } from "./clerk";

describe("clerkConfigured", () => {
  const prevPub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const prevSec = process.env.CLERK_SECRET_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = prevPub;
    process.env.CLERK_SECRET_KEY = prevSec;
  });

  it("is false when either key is missing", () => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
    expect(clerkConfigured()).toBe(false);

    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_x";
    delete process.env.CLERK_SECRET_KEY;
    expect(clerkConfigured()).toBe(false);
  });

  it("is true when both keys are set", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_x";
    process.env.CLERK_SECRET_KEY = "sk_test_x";
    expect(clerkConfigured()).toBe(true);
  });
});

const email = (id: string, address: string, status?: string | null) => ({
  id,
  emailAddress: address,
  verification: { status },
});

describe("pickVerifiedEmail", () => {
  it("returns the primary email only when it is verified", () => {
    const emails = [email("e1", "a@x.com", "verified"), email("e2", "b@x.com", "unverified")];
    expect(pickVerifiedEmail(emails, "e1")).toBe("a@x.com");
  });

  it("never returns an unverified primary even if it is the only one", () => {
    const emails = [email("e1", "b@x.com", "unverified")];
    expect(pickVerifiedEmail(emails, "e1")).toBeNull();
  });

  it("falls back to another verified address when the primary is unverified", () => {
    const emails = [email("e1", "primary@x.com", "unverified"), email("e2", "backup@x.com", "verified")];
    expect(pickVerifiedEmail(emails, "e1")).toBe("backup@x.com");
  });

  it("treats a missing verification object as unverified", () => {
    expect(pickVerifiedEmail([{ id: "e1", emailAddress: "x@x.com", verification: null }], "e1")).toBeNull();
    expect(
      pickVerifiedEmail([{ id: "e1", emailAddress: "x@x.com" }], "e1")
    ).toBeNull();
  });

  it("returns null for no addresses", () => {
    expect(pickVerifiedEmail(undefined, null)).toBeNull();
    expect(pickVerifiedEmail([], null)).toBeNull();
  });
});
