/**
 * Apply committed Drizzle SQL using the app mTLS helper.
 *
 * `drizzle-kit migrate` does not send PGSSL_CA / CERT / KEY, so it cannot
 * reach production Postgres. This script uses the same TLS path as the app.
 *
 *   npx tsx scripts/migrate-mtls.ts --check
 *   npx tsx scripts/migrate-mtls.ts --production --check
 *   npx tsx scripts/migrate-mtls.ts --production
 *
 * Prints applied/expected only. Never prints connection strings.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { sslConfig } from "../lib/db";
import { readSchemaStatus } from "../lib/db/schema-status";

function readEnvText(filePath: string): string {
  const buf = readFileSync(filePath);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString("utf16le").replace(/^\uFEFF/, "");
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    const swapped = Buffer.alloc(buf.length - 2);
    for (let i = 2; i + 1 < buf.length; i += 2) {
      swapped[i - 2] = buf[i + 1];
      swapped[i - 1] = buf[i];
    }
    return swapped.toString("utf16le");
  }
  const asUtf8 = buf.toString("utf8").replace(/^\uFEFF/, "");
  if (asUtf8.includes("\0")) {
    return buf.toString("utf16le").replace(/^\uFEFF/, "");
  }
  return asUtf8;
}

/** Vercel `env pull` writes quoted multiline PEMs that Node `--env-file` skips. */
function applyEnvFile(filePath: string, overwrite = false): number {
  if (!existsSync(filePath)) return 0;
  const src = readEnvText(filePath);
  let i = 0;
  let loaded = 0;
  const set = (key: string, value: string) => {
    if (!value) return;
    if (overwrite || !process.env[key]) {
      process.env[key] = value;
      loaded += 1;
    }
  };
  while (i < src.length) {
    if (src[i] === "\r") {
      i += 1;
      continue;
    }
    if (src[i] === "\n" || src[i] === "#") {
      const nl = src.indexOf("\n", i);
      i = nl === -1 ? src.length : nl + 1;
      continue;
    }
    const eq = src.indexOf("=", i);
    if (eq === -1) break;
    const key = src.slice(i, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      const nl = src.indexOf("\n", i);
      i = nl === -1 ? src.length : nl + 1;
      continue;
    }
    i = eq + 1;
    if (src[i] === '"' || src[i] === "'") {
      const q = src[i];
      i += 1;
      let value = "";
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\" && i + 1 < src.length) {
          const next = src[i + 1];
          value += next === "n" ? "\n" : next === "r" ? "\r" : next === "t" ? "\t" : next;
          i += 2;
          continue;
        }
        value += src[i];
        i += 1;
      }
      if (src[i] === q) i += 1;
      set(key, value);
      const nl = src.indexOf("\n", i);
      i = nl === -1 ? src.length : nl + 1;
    } else {
      const nl = src.indexOf("\n", i);
      const end = nl === -1 ? src.length : nl;
      set(key, src.slice(i, end).trim());
      i = end + 1;
    }
  }
  return loaded;
}

function targetKind(url: string): "local" | "remote" {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1" ? "local" : "remote";
}

async function main() {
  const productionOnly = process.argv.includes("--production");
  const prodPath = join(process.cwd(), ".env.production");
  const localPath = join(process.cwd(), ".env.local");
  let loaded = 0;
  if (productionOnly) {
    loaded = applyEnvFile(prodPath, true);
  } else {
    loaded += applyEnvFile(localPath);
    loaded += applyEnvFile(prodPath);
  }
  if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is empty. Vercel production lists it as Encrypted, but env pull/run decrypts to an empty string. Cannot migrate until the dashboard value is a real postgres URL."
    );
    process.exit(1);
  }

  const checkOnly = process.argv.includes("--check");
  const client = postgres(url, { max: 1, ssl: sslConfig(url) });
  const db = drizzle(client);

  try {
    const before = await readSchemaStatus(db);
    console.log(
      `target=${targetKind(url)} applied=${before.applied} expected=${before.expected} authReady=${before.authReady} current=${before.current}`
    );

    if (checkOnly || before.current) {
      return;
    }

    await migrate(db, { migrationsFolder: join(process.cwd(), "lib/db/migrations") });
    const after = await readSchemaStatus(db);
    console.log(
      `after applied=${after.applied} expected=${after.expected} authReady=${after.authReady} current=${after.current}`
    );
    if (!after.current) process.exit(1);
  } finally {
    await client.end({ timeout: 5 });
  }
}

function redactedChain(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  for (let i = 0; i < 6 && current; i++) {
    if (typeof current !== "object") {
      parts.push(String(current));
      break;
    }
    const e = current as { code?: string; message?: string; cause?: unknown };
    const raw = `${e.code ?? ""} ${e.message ?? ""}`.trim();
    parts.push(raw.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://redacted").slice(0, 240));
    current = e.cause;
  }
  return parts.filter(Boolean).join(" | ");
}

main().catch((err) => {
  console.error(redactedChain(err) || "migrate failed");
  process.exit(1);
});
