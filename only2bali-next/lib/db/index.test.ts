import type { ConnectionOptions, PeerCertificate } from "node:tls";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sslConfig } from "./index";

const CERT = "-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----";
const KEY = "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----";

function configureMtls() {
  vi.stubEnv("PGSSL_CA", CERT);
  vi.stubEnv("PGSSL_CERT", CERT);
  vi.stubEnv("PGSSL_KEY", KEY);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("database TLS hostname verification", () => {
  it("checks an IP certificate against the DATABASE_URL host, not localhost", () => {
    configureMtls();
    const ssl = sslConfig(
      "postgres://user:pass@187.124.96.63:5433/only2bali",
    ) as ConnectionOptions;

    expect(ssl).toBeTypeOf("object");

    const certificate = { subjectaltname: "IP Address:187.124.96.63" } as PeerCertificate;
    expect(ssl.checkServerIdentity?.("localhost", certificate)).toBeUndefined();
  });

  it("rejects a certificate issued for a different IP", () => {
    configureMtls();
    const ssl = sslConfig(
      "postgres://user:pass@187.124.96.63:5433/only2bali",
    ) as ConnectionOptions;

    expect(ssl).toBeTypeOf("object");

    const certificate = { subjectaltname: "IP Address:203.0.113.10" } as PeerCertificate;
    expect(ssl.checkServerIdentity?.("localhost", certificate)).toBeInstanceOf(Error);
  });

  it("refuses a partial mTLS configuration", () => {
    vi.stubEnv("PGSSL_CA", CERT);
    expect(() => sslConfig("postgres://user:pass@db.example.com:5433/only2bali")).toThrow(
      "Partial TLS configuration",
    );
  });
});
