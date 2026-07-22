import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { clientKey, rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("k", 3, 1000).allowed).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 1000);
    const blocked = rateLimit("k", 3, 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keys are independent", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 1000);
    expect(rateLimit("a", 3, 1000).allowed).toBe(false);
    expect(rateLimit("b", 3, 1000).allowed).toBe(true);
  });

  it("allows again after the window elapses", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 1000);
    expect(rateLimit("k", 3, 1000).allowed).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit("k", 3, 1000).allowed).toBe(true);
  });

  it("reports remaining budget", () => {
    expect(rateLimit("k", 3, 1000).remaining).toBe(2);
    expect(rateLimit("k", 3, 1000).remaining).toBe(1);
  });
});

describe("clientKey", () => {
  it("takes the first address from x-forwarded-for", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    expect(clientKey(req)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://x.test", { headers: { "x-real-ip": "203.0.113.9" } });
    expect(clientKey(req)).toBe("203.0.113.9");
  });

  it("returns a stable placeholder when no address header is present", () => {
    expect(clientKey(new Request("https://x.test"))).toBe("unknown");
  });
});
