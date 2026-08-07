import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSetting, auditLog } from "@/lib/db/schema";
import { SETTING_BY_KEY, SETTING_DEFS, type SettingDef } from "@/lib/settings/catalog";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/settings/secret-box";

export type SettingStatus = {
  key: string;
  label: string;
  group: SettingDef["group"];
  secret: boolean;
  help?: string;
  configured: boolean;
  source: "database" | "env" | "none";
  /** Masked hint when configured; never full secret. Plain fields may show full value. */
  displayValue: string | null;
  updatedAt: string | null;
};

type CacheEntry = { value: string | null; source: "database" | "env" | "none"; at: number };
const CACHE_TTL_MS = 15_000;
const cache = new Map<string, CacheEntry>();

export function clearSettingsCache(): void {
  cache.clear();
}

function envFallback(def: SettingDef): string | null {
  if (!def.envFallback) return null;
  const v = process.env[def.envFallback];
  return v && v.trim() ? v.trim() : null;
}

async function readRow(key: string): Promise<{ plaintext: string; updatedAt: Date } | null> {
  const rows = await db
    .select({
      valueEnc: appSetting.valueEnc,
      updatedAt: appSetting.updatedAt,
    })
    .from(appSetting)
    .where(eq(appSetting.key, key))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { plaintext: decryptSecret(row.valueEnc), updatedAt: row.updatedAt };
}

/**
 * Resolve a setting: database ciphertext wins, then env fallback.
 * Short in-memory cache so OTP / payment hot paths do not hit Postgres every call.
 */
export async function getSetting(key: string): Promise<string | null> {
  const def = SETTING_BY_KEY[key];
  if (!def) return null;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  let value: string | null = null;
  let source: CacheEntry["source"] = "none";
  try {
    const row = await readRow(key);
    if (row?.plaintext) {
      value = row.plaintext;
      source = "database";
    }
  } catch (err) {
    // Missing table / AUTH_SECRET / decrypt failure — fall through to env.
    console.warn("[settings] database read failed for", key, err instanceof Error ? err.message : err);
  }

  if (!value) {
    value = envFallback(def);
    source = value ? "env" : "none";
  }

  cache.set(key, { value, source, at: Date.now() });
  return value;
}

export async function listSettingStatus(): Promise<SettingStatus[]> {
  const out: SettingStatus[] = [];
  for (const def of SETTING_DEFS) {
    let configured = false;
    let source: SettingStatus["source"] = "none";
    let displayValue: string | null = null;
    let updatedAt: string | null = null;

    try {
      const row = await readRow(def.key);
      if (row?.plaintext) {
        configured = true;
        source = "database";
        updatedAt = row.updatedAt.toISOString();
        displayValue = def.secret ? maskSecret(row.plaintext) : row.plaintext;
      }
    } catch {
      // ignore — try env
    }

    if (!configured) {
      const env = envFallback(def);
      if (env) {
        configured = true;
        source = "env";
        displayValue = def.secret ? maskSecret(env) : env;
      }
    }

    out.push({
      key: def.key,
      label: def.label,
      group: def.group,
      secret: def.secret,
      help: def.help,
      configured,
      source,
      displayValue,
      updatedAt,
    });
  }
  return out;
}

/**
 * Upsert or clear settings. Empty string for a secret means "keep existing".
 * Explicit `null` clears. Plain fields may be set to empty to clear.
 */
export async function upsertSettings(
  updates: Record<string, string | null>,
  actorAccountId: string
): Promise<{ saved: string[]; cleared: string[]; skipped: string[] }> {
  const saved: string[] = [];
  const cleared: string[] = [];
  const skipped: string[] = [];

  for (const [key, raw] of Object.entries(updates)) {
    const def = SETTING_BY_KEY[key];
    if (!def) {
      skipped.push(key);
      continue;
    }

    if (raw === null) {
      await db.delete(appSetting).where(eq(appSetting.key, key));
      cleared.push(key);
      cache.delete(key);
      await db.insert(auditLog).values({
        accountId: actorAccountId,
        action: "settings.clear",
        resourceType: "app_setting",
        resourceId: key,
        details: { key },
      });
      continue;
    }

    const value = raw.trim();
    if (!value) {
      // Blank secret on the form = keep current DB/env value.
      if (def.secret) {
        skipped.push(key);
        continue;
      }
      await db.delete(appSetting).where(eq(appSetting.key, key));
      cleared.push(key);
      cache.delete(key);
      continue;
    }

    // Reject accidental re-submit of a masked display value.
    if (def.secret && value.startsWith("••••")) {
      skipped.push(key);
      continue;
    }

    const valueEnc = encryptSecret(value);
    await db
      .insert(appSetting)
      .values({
        key,
        valueEnc,
        updatedBy: actorAccountId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appSetting.key,
        set: {
          valueEnc,
          updatedBy: actorAccountId,
          updatedAt: new Date(),
        },
      });

    saved.push(key);
    cache.delete(key);
    await db.insert(auditLog).values({
      accountId: actorAccountId,
      action: "settings.upsert",
      resourceType: "app_setting",
      resourceId: key,
      details: { key, secret: def.secret },
    });
  }

  return { saved, cleared, skipped };
}
