/**
 * Launch readiness, read from the deployment itself.
 *
 *   npm run verify:launch
 *   npm run verify:launch -- https://staging.example.com
 *
 * Every item in docs/launch-checklist.md is a switch somewhere outside this
 * repository — a Vercel variable, a Clerk toggle, a provider dashboard. None of
 * them can be proven by reading the code, so this asks the running deployment
 * what it actually has, and exits non-zero while anything is still open.
 *
 * Deliberately not part of `npm test`: it talks to a live deployment.
 */

const DEFAULT_BASE = "https://only2bali.vercel.app";
const BASE = (process.argv[2] ?? process.env.LAUNCH_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");

type Health = {
  status?: string;
  database?: string;
  otpDelivery?: string[];
  schema?: { applied?: number; expected?: number; current?: boolean; authReady?: boolean };
  contact?: { whatsapp?: boolean; email?: boolean };
  uploads?: { media?: string; documents?: string };
  payments?: {
    mode?: string;
    acceptingPayments?: boolean;
    razorpay?: { mode?: string; acceptingPayments?: boolean };
    stripe?: { mode?: string; acceptingPayments?: boolean };
  };
  clerk?: boolean;
  latencyMs?: number;
};

let openCount = 0;
let done = 0;

function ready(item: string, detail = ""): void {
  done++;
  console.log(`  \x1b[1;32mready\x1b[0m  ${item}${detail ? ` — ${detail}` : ""}`);
}

function blocked(item: string, detail: string, fix: string): void {
  openCount++;
  console.log(`  \x1b[1;31mopen \x1b[0m  ${item} — ${detail}`);
  console.log(`         ${fix}`);
}

function warn(item: string, detail: string): void {
  console.log(`  \x1b[1;33mcheck\x1b[0m  ${item} — ${detail}`);
}

async function main(): Promise<void> {
  console.log(`\nLaunch readiness for ${BASE}\n`);

  let health: Health;
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(30_000) });
    health = (await res.json()) as Health;
  } catch (err) {
    console.error(`Could not reach ${BASE}/api/health — ${err instanceof Error ? err.message : err}\n`);
    process.exit(1);
  }

  if (res.status !== 200) {
    blocked("the deployment answers", `HTTP ${res.status}`, "Nothing below is meaningful until this passes.");
    process.exit(1);
  }

  // ---------- database ----------
  if (health.database === "connected") {
    ready("database reachable", `schema ${health.schema?.applied}/${health.schema?.expected}`);
  } else {
    blocked("database reachable", String(health.database), "Check DATABASE_URL in Vercel.");
  }

  if (health.schema?.current === true) {
    ready("schema current");
  } else {
    blocked(
      "schema current",
      `applied ${health.schema?.applied} of ${health.schema?.expected}`,
      "Run the migrate endpoint, or `npm run db:migrate` against production.",
    );
  }

  // ---------- 1: live payments behind the only working login ----------
  const payMode = health.payments?.razorpay?.mode ?? health.payments?.mode;
  const taking = health.payments?.acceptingPayments === true;
  const otp = health.otpDelivery ?? [];
  const otpWorks = otp.length > 0 && !otp.includes("none");
  const googleOnlyDoor = health.clerk === true && !otpWorks;

  if (taking && payMode === "live" && googleOnlyDoor) {
    blocked(
      "live payments are not sitting behind an unverified login",
      "live Razorpay keys, and Google is the only working way in",
      "docs/launch-checklist.md item 1 — hold payments (test keys) or hold the door (disable Google).",
    );
  } else if (taking && payMode === "live") {
    warn("live payments are on", "walk a real sign-in through to a booking before opening this up");
    ready("payments configured", `${payMode}, accepting`);
  } else if (taking) {
    ready("payments configured", `${payMode}, accepting`);
  } else {
    warn("payments", "not accepting — checkout fails closed, which is fine before launch");
  }

  // ---------- 2: sign-in delivery ----------
  if (otpWorks) {
    ready("a sign-in code can reach a person", otp.join(","));
  } else {
    blocked(
      "a sign-in code can reach a person",
      `otpDelivery: ${JSON.stringify(otp)}`,
      "docs/launch-checklist.md item 2 — set RESEND_API_KEY and EMAIL_FROM in Vercel.",
    );
  }

  // ---------- 3: uploads ----------
  const media = health.uploads?.media;
  const documents = health.uploads?.documents;

  if (media && media !== "none") ready("public media storage", media);
  else blocked("public media storage", String(media), "Set BLOB_READ_WRITE_TOKEN — vendor photos cannot be stored.");

  if (documents && documents !== "none") ready("private document storage", documents);
  else
    blocked(
      "private document storage",
      String(documents),
      "Set BLOB_PRIVATE_READ_WRITE_TOKEN — KYC documents cannot be stored.",
    );

  // ---------- 4: contact ----------
  if (health.contact?.whatsapp && health.contact?.email) {
    ready("contact details set");
  } else {
    blocked(
      "contact details set",
      `whatsapp=${health.contact?.whatsapp} email=${health.contact?.email}`,
      "Set NEXT_PUBLIC_WHATSAPP_NUMBER and NEXT_PUBLIC_CONTACT_EMAIL.",
    );
  }

  // ---------- 6: demo data ----------
  // Only visible from the database, so this is a reminder rather than a probe.
  warn("demo marketplace data removed", "run the two statements in docs/launch-checklist.md item 6");

  // ---------- 5: leaked credentials ----------
  warn(
    "Zoho and SpringEdge credentials revoked",
    "cannot be checked from here — confirm at the providers, item 5",
  );

  // ---------- 7: latency ----------
  const ms = Number(health.latencyMs ?? 0);
  if (ms > 2000) {
    warn(
      "database latency",
      `${(ms / 1000).toFixed(1)}s on this probe — check DATABASE_URL uses Neon's pooled host (-pooler)`,
    );
  } else if (ms > 0) {
    ready("database latency", `${ms}ms`);
  }

  // ---------- login surface ----------
  try {
    const login = await fetch(`${BASE}/en/login`, { signal: AbortSignal.timeout(30_000) });
    const html = await login.text();
    const google = /Continue with Google/i.test(html);
    const disabled = /class="btn btn-primary authsubmit" type="submit" disabled/.test(html);

    if (!otpWorks && !disabled) {
      blocked(
        "the login form is honest about delivery",
        "the code form is enabled but no channel can deliver",
        "A visitor would ask for a code that is never sent.",
      );
    } else if (!otpWorks && disabled) {
      ready("the login form fails closed", "code form disabled while no channel can deliver");
    }

    if (google && !otpWorks) {
      warn("Google is the only working sign-in", "untested end to end — see item 1");
    }
  } catch {
    warn("login surface", "could not be read");
  }

  console.log(`\n${done} ready, ${openCount} open\n`);
  if (openCount > 0) {
    console.log("See docs/launch-checklist.md.\n");
  }
  process.exit(openCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
