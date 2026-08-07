"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type SettingRow = {
  key: string;
  label: string;
  group: string;
  secret: boolean;
  help?: string;
  configured: boolean;
  source: "database" | "env" | "none";
  displayValue: string | null;
  updatedAt: string | null;
};

type Groups = Record<string, string>;

export default function AdminSettingsForm({ lang }: { lang: string }) {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [groups, setGroups] = useState<Groups>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [clearFlags, setClearFlags] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Failed to load settings.");
    setSettings(json.data.settings);
    setGroups(json.data.groups);
    setDrafts({});
    setClearFlags({});
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const byGroup = useMemo(() => {
    const map = new Map<string, SettingRow[]>();
    for (const row of settings) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    return map;
  }, [settings]);

  const save = async () => {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const values: Record<string, string | null> = {};
      for (const row of settings) {
        if (clearFlags[row.key]) {
          values[row.key] = null;
          continue;
        }
        if (drafts[row.key] !== undefined) {
          values[row.key] = drafts[row.key];
        }
      }
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Save failed.");
      setSettings(json.data.settings);
      setDrafts({});
      setClearFlags({});
      const parts = [];
      if (json.data.saved?.length) parts.push(`saved ${json.data.saved.length}`);
      if (json.data.cleared?.length) parts.push(`cleared ${json.data.cleared.length}`);
      setSaved(parts.length ? `Updated (${parts.join(", ")}).` : "No changes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="accountpage">
      <div className="o2b-wrap">
        <header className="accounthead">
          <div>
            <span className="eyebrow">Admin control</span>
            <h1>Integration settings</h1>
            <p className="empty">
              Paste API keys here. Secrets are encrypted in Postgres. Blank secret fields keep the current value.
              Env vars on Vercel remain the fallback until you save a database value.
            </p>
            <p className="empty">
              <Link href={`/${lang}/admin`}>← Back to admin dashboard</Link>
            </p>
          </div>
        </header>

        {error && (
          <p className="errmsg" role="alert">
            {error}
          </p>
        )}
        {saved && <p className="okbox">{saved}</p>}

        <div className="accountgrid admin-grid">
          {[...byGroup.entries()].map(([group, rows]) => (
            <section className="acard" key={group}>
              <h2>{groups[group] ?? group}</h2>
              {group === "crm" && (
                <p className="empty">
                  Zoho CRM was removed from the product. Keys stored here do not enable any live call — they are for a future connector only. Rotate compromised Zoho tokens at the provider.
                </p>
              )}
              <ul className="admin-list settings-list">
                {rows.map((row) => (
                  <li key={row.key}>
                    <label htmlFor={`setting-${row.key}`}>
                      <b>{row.label}</b>
                      <span>
                        {row.configured
                          ? `Configured via ${row.source}${row.displayValue ? ` · ${row.displayValue}` : ""}`
                          : "Not configured"}
                      </span>
                    </label>
                    {row.help && <p className="empty">{row.help}</p>}
                    <input
                      id={`setting-${row.key}`}
                      type={row.secret ? "password" : "text"}
                      autoComplete="off"
                      placeholder={
                        row.secret
                          ? row.configured
                            ? "Leave blank to keep current"
                            : "Paste secret"
                          : row.displayValue ?? ""
                      }
                      value={drafts[row.key] ?? ""}
                      disabled={Boolean(clearFlags[row.key])}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [row.key]: e.target.value }))
                      }
                    />
                    <label className="settings-clear">
                      <input
                        type="checkbox"
                        checked={Boolean(clearFlags[row.key])}
                        onChange={(e) =>
                          setClearFlags((c) => ({ ...c, [row.key]: e.target.checked }))
                        }
                      />
                      Clear database value
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mini-actions" style={{ marginTop: "1.5rem" }}>
          <button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </main>
  );
}
