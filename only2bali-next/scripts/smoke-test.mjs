#!/usr/bin/env node

/**
 * Read-only production smoke test. Run with:
 *   SMOKE_BASE_URL=https://only2bali.vercel.app npm run smoke
 * It intentionally never creates accounts, bookings, payments, or mutations.
 */
const base = (process.env.SMOKE_BASE_URL || "https://only2bali.vercel.app").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15_000);
const checks = [];

async function request(path, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        accept: "*/*",
        // Clerk development middleware requires a browser-like request for
        // its handshake; without this, Node is redirected before the app runs.
        "user-agent": "curl/8.0 (Only2BaliSmoke/1.0)",
        // Vercel's Clerk development middleware otherwise redirects a
        // non-browser smoke client to the handshake endpoint.
        "x-clerk-auth-reason": "dev-browser-missing",
        ...(init.headers || {}),
      },
    });
    const text = await response.text();
    return { response, text, ms: Math.round(performance.now() - started) };
  } finally {
    clearTimeout(timer);
  }
}

function check(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
}

async function main() {
  const health = await request("/api/health");
  let healthJson = null;
  try { healthJson = JSON.parse(health.text); } catch {}
  check("health returns 200", health.response.status === 200, `${health.response.status} in ${health.ms}ms`);
  check("database and schema are ready", healthJson?.status === "ok" && healthJson?.database === "connected" && healthJson?.schema?.current === true);
  check("Clerk is configured", healthJson?.clerk === true);
  check("functions are co-located with Neon", healthJson?.placement?.colocated === true, JSON.stringify(healthJson?.placement));

  for (const path of ["/en", "/en/login", "/en/services", "/en/providers", "/en/packages", "/en/inquiry", "/en/planner"]) {
    const page = await request(path);
    check(`${path} returns 200`, page.response.status === 200, `${page.ms}ms`);
    check(`${path} has product markup`, /<h[1-3][\s>]/i.test(page.text) && /Only2Bali/i.test(page.text));
    check(`${path} contains no internal test data`, !/TEST\s*--|dummy-data|Internal test/i.test(page.text));
  }

  for (const path of ["/api/messages", "/api/provider/catalog", "/api/admin/overview"]) {
    const response = await request(path);
    check(`${path} rejects anonymous access`, response.response.status === 401, `${response.response.status}`);
  }

  const options = await request("/api/payments/options");
  check("payment options endpoint responds", [200, 401].includes(options.response.status), `${options.response.status}`);

  const failed = checks.filter((item) => !item.ok);
  for (const item of checks) console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}${item.detail ? ` — ${item.detail}` : ""}`);
  console.log(`\n${checks.length - failed.length}/${checks.length} smoke checks passed against ${base}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`SMOKE TEST ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
