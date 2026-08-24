import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveDatabaseUrl, sslConfig } from "./index";

const CERT = "-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----";
const KEY = `${["-----BEGIN", "PRIVATE KEY-----"].join(" ")}\ntest\n-----END PRIVATE KEY-----`;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("database TLS", () => {
  it("uses server TLS for Neon and ignores leftover Hostinger PEMs", () => {
    vi.stubEnv("PGSSL_CA", CERT);
    vi.stubEnv("PGSSL_CERT", CERT);
    vi.stubEnv("PGSSL_KEY", KEY);
    expect(sslConfig("postgres://user:pass@ep-x.ap-southeast-1.aws.neon.tech/neondb")).toBe(
      "require",
    );
  });

  it("uses server TLS for any remote host without client certificates", () => {
    expect(sslConfig("postgres://user:pass@db.example.com:5432/only2bali")).toBe("require");
  });

  it("leaves local Docker unencrypted unless DATABASE_SSL=require", () => {
    expect(sslConfig("postgres://user:pass@127.0.0.1:5432/only2bali")).toBeUndefined();
    vi.stubEnv("DATABASE_SSL", "require");
    expect(sslConfig("postgres://user:pass@127.0.0.1:5432/only2bali")).toBe("require");
  });
});

describe("resolveDatabaseUrl", () => {
  it("prefers DATABASE_URL over the Neon integration alias", () => {
    expect(
      resolveDatabaseUrl({
        NODE_ENV: "test",
        DATABASE_URL: "postgres://primary",
        o2b_DATABASE_URL: "postgres://neon-alias",
      }),
    ).toBe("postgres://primary");
  });

  it("falls back to o2b_DATABASE_URL when DATABASE_URL is empty", () => {
    expect(
      resolveDatabaseUrl({ NODE_ENV: "test", o2b_DATABASE_URL: "postgres://neon-alias" }),
    ).toBe(
      "postgres://neon-alias",
    );
  });
});
