import { describe, it, expect, afterEach } from "vitest";
import { clerkConfigured } from "./clerk";

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
