import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CFG is computed at module load from the environment, so each case needs a
 * fresh import rather than a stubbed value.
 */
async function loadConfig(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) vi.stubEnv(key, "");
    else vi.stubEnv(key, value);
  }
  return (await import("./config")).CFG;
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("contact details", () => {
  it("accepts a real address and number", async () => {
    const cfg = await loadConfig({
      NEXT_PUBLIC_CONTACT_EMAIL: "trips@only2bali.com",
      NEXT_PUBLIC_WHATSAPP_NUMBER: "+62 812 3456 7890",
    });
    expect(cfg.email).toBe("trips@only2bali.com");
    expect(cfg.whatsapp).toBe("6281234567890"); // digits only, for wa.me
    expect(cfg.configured).toBe(true);
  });

  /**
   * The regression that prompted this file. The sentinel was
   * `hello@only2bali.com` - the most likely real address for this business -
   * so setting it in Vercel produced a site that looked configured and showed
   * no contact link at all.
   */
  it("accepts the business's own natural address", async () => {
    const cfg = await loadConfig({ NEXT_PUBLIC_CONTACT_EMAIL: "hello@only2bali.com" });
    expect(cfg.email).toBe("hello@only2bali.com");
    expect(cfg.configured).toBe(true);
  });

  it("still refuses a pasted example", async () => {
    const cfg = await loadConfig({
      NEXT_PUBLIC_CONTACT_EMAIL: "you@example.com",
      NEXT_PUBLIC_WHATSAPP_NUMBER: "6281200000000",
    });
    expect(cfg.email).toBeNull();
    expect(cfg.whatsapp).toBeNull();
    expect(cfg.configured).toBe(false);
  });

  it("refuses nonsense rather than rendering a broken link", async () => {
    const cfg = await loadConfig({
      NEXT_PUBLIC_CONTACT_EMAIL: "not-an-address",
      NEXT_PUBLIC_WHATSAPP_NUMBER: "123",
    });
    expect(cfg.email).toBeNull();
    expect(cfg.whatsapp).toBeNull();
    expect(cfg.configured).toBe(false);
  });

  it("counts as configured when only one channel is real", async () => {
    const cfg = await loadConfig({
      NEXT_PUBLIC_CONTACT_EMAIL: "trips@only2bali.com",
      NEXT_PUBLIC_WHATSAPP_NUMBER: undefined,
    });
    expect(cfg.whatsapp).toBeNull();
    expect(cfg.configured).toBe(true);
  });
});

describe("link builders", () => {
  it("return null rather than a link to nowhere when unconfigured", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "");
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "");
    const { wa, mailto } = await import("./config");
    expect(wa("hello")).toBeNull();
    expect(mailto("subject", "body")).toBeNull();
  });

  it("escape what they put in a URL", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "trips@only2bali.com");
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "6281234567890");
    const { wa, mailto } = await import("./config");
    expect(wa("Jain trip & 4 people")).toContain("Jain%20trip%20%26%204%20people");
    expect(mailto("Jain & vegan", "a=b")).toContain("Jain%20%26%20vegan");
  });
});
