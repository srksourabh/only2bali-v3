/**
 * End-to-end test.
 *
 * Drives the running application over HTTP exactly as a browser would — no
 * mocks, no direct calls into the service layer — and checks the database
 * afterwards to prove the side effects are real.
 *
 * It is normally started by `npm run test:e2e`, which brings up Postgres and a
 * dev server first. To point it at an already-running instance:
 *
 *   E2E_BASE_URL=http://127.0.0.1:3000 \
 *   E2E_SERVER_LOG=/path/to/server.log \
 *   DATABASE_URL=postgres://… npx tsx scripts/e2e.ts
 *
 * The OTP is read from the server's own log because no provider is wired yet
 * and development deliberately prints the code rather than sending it. That is
 * also why this cannot run against production, and should not.
 *
 * Everything it creates is keyed to a unique throwaway identifier and deleted
 * at the end.
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { SESSION_COOKIE } from "../lib/auth";
import { hashSessionToken } from "../lib/auth/crypto";
import { razorpayPaymentSignature } from "../lib/payments/razorpay";
import { PROTOCOLS } from "../lib/protocols";

/** Matches the test-only key exported by scripts/e2e.sh. Not a live secret. */
const E2E_RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "e2e-only2bali-razorpay-key-secret";

const BASE = (process.env.E2E_BASE_URL ?? "").replace(/\/$/, "");
const SERVER_LOG = process.env.E2E_SERVER_LOG ?? "";
const REQUEST_TIMEOUT_MS = Number(process.env.E2E_REQUEST_TIMEOUT_MS ?? 120_000);

if (!BASE) {
  console.error("E2E_BASE_URL is not set. Run `npm run test:e2e` instead of calling this directly.");
  process.exit(1);
}

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = ""): boolean {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
  return ok;
}

/**
 * A distinct forwarded address per concern.
 *
 * The rate limiter keys on the client address, so without this a second run
 * inside the same 15-minute window would inherit the first run's counters and
 * fail for the wrong reason.
 */
const run = Date.now().toString(36);
const IP_MAIN = `203.0.113.${(Number(`0x${run.slice(-2)}`) % 200) + 1}`;
const IP_FLOOD = `198.51.100.${(Number(`0x${run.slice(-2)}`) % 200) + 1}`;

const EMAIL = `e2e-${run}@only2bali.test`;
const FLOOD_EMAIL = `e2e-flood-${run}@only2bali.test`;
const VENDOR_EMAIL = `e2e-vendor-${run}@only2bali.test`;
const VENDOR_USERNAME = `vendor-${run}`;
const VENDOR_PASSWORD = `Only2Bali-${run}-Secure!`;
const VENDOR_BUSINESS = `E2E Jain Kitchen ${run}`;
const MARKETPLACE_LISTING = `E2E Jain Dining ${run}`;
const ADMIN_EMAIL = `e2e-admin-${run}@only2bali.test`;
const ADMIN_USERNAME = `admin-${run}`;
const APPLICANT_EMAIL = `e2e-applicant-${run}@only2bali.test`;
const APPLICANT_BUSINESS = `E2E Applicant Kitchen ${run}`;
/** Run-unique so a half-cleaned earlier run cannot collide on the unique index. */
const MOBILE = `+9198${String(Date.now()).slice(-8)}`;
/** What the provider asks to be paid. The traveller's price is derived from it. */
const BID_NET_AMOUNT = 6_000_000;

let sessionCookie = "";
let vendorCookie = "";
let adminCookie = "";
let marketplaceListingId = "";
let marketplaceBookingId = "";
let applicantApplicationId = "";
let boardRequestId = "";
let acceptedOfferId = "";
let rivalOfferId = "";
let bidThreadId = "";
let offerBookingId = "";
let offerPaymentId = "";
let disbursementId = "";
let documentRef = "";
let documentHandle = "";
let documentId = "";
/** Set once a booking has taken seats, so cleanup can give them back. */
let bookedDepartureId = "";

interface CallOptions {
  ip?: string;
  cookie?: string;
  body?: unknown;
  method?: string;
}

async function call(path: string, opts: CallOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "x-forwarded-for": opts.ip ?? IP_MAIN,
    "user-agent": "only2bali-e2e",
  };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.cookie) headers.cookie = opts.cookie;

  return fetch(`${BASE}${path}`, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function json(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * The dev server writes the code to stdout asynchronously, so the line can lag
 * the HTTP response by a few hundred milliseconds. Poll rather than assume.
 */
async function otpFromLog(email: string, timeoutMs = 15_000): Promise<string | null> {
  if (!SERVER_LOG) return null;
  const pattern = new RegExp(`OTP for ${email.replace(/[.+*?^$()[\]{}|\\]/g, "\\$&")}: (\\d{6})`, "g");
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    let text = "";
    try {
      text = readFileSync(SERVER_LOG, "utf8");
    } catch {
      /* the file may not exist yet */
    }
    const matches = [...text.matchAll(pattern)];
    if (matches.length) return matches[matches.length - 1][1];
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

function cookieFrom(res: Response): string {
  for (const raw of res.headers.getSetCookie()) {
    if (raw.startsWith(`${SESSION_COOKIE}=`)) return raw.split(";")[0];
  }
  return "";
}

/**
 * Ask for each page once, ignoring the answer.
 *
 * The dev server compiles a route the first time it is requested, and a build
 * left in `.next` by `npm run build` makes that first compile slower still.
 * Paying it here rather than inside an assertion keeps a slow machine from
 * looking like a broken application.
 */
async function warmUp(): Promise<void> {
  const paths = [
    "/en",
    "/hi",
    "/en/account",
    "/en/packages",
    "/en/packages/none",
    "/en/providers",
    "/en/food",
    "/api/auth/session",
  ];
  for (const path of paths) {
    await call(path).catch(() => null);
  }
}

async function main() {
  console.log(`\nEnd-to-end run against ${BASE}\n`);
  await warmUp();

  // ---------- the app is up and talking to Postgres ----------
  console.log("Service");
  {
    const res = await call("/api/health");
    const body = await json(res);
    check("health endpoint answers", res.status === 200, `HTTP ${res.status}`);
    check("health reports the database connected", body?.database === "connected", body?.status);
    check("health is never cached", res.headers.get("cache-control") === "no-store");
    check(
      "health reports whether a sign-in code can be delivered",
      Array.isArray(body?.otpDelivery) && body.otpDelivery.length > 0,
      Array.isArray(body?.otpDelivery) ? body.otpDelivery.join(",") : "missing"
    );
    check(
      "health reports whether contact details are configured",
      typeof body?.contact?.whatsapp === "boolean" && typeof body?.contact?.email === "boolean",
      `whatsapp=${body?.contact?.whatsapp} email=${body?.contact?.email}`
    );
    check(
      "health separates public media from private documents",
      ["vercel_blob", "local", "none"].includes(body?.uploads?.media) &&
        ["vercel_blob", "local", "none"].includes(body?.uploads?.documents),
      `media=${body?.uploads?.media} documents=${body?.uploads?.documents}`
    );
    check(
      "health reports how far Postgres trails the Drizzle journal",
      Number(body?.schema?.expected) >= 6 && typeof body?.schema?.current === "boolean",
      `applied=${body?.schema?.applied} expected=${body?.schema?.expected} current=${body?.schema?.current}`
    );
    check(
      "local Postgres has every committed migration",
      body?.schema?.current === true && body?.schema?.authReady === true,
      `applied=${body?.schema?.applied}/${body?.schema?.expected} authReady=${body?.schema?.authReady}`
    );
  }

  // ---------- routing and language ----------
  console.log("\nRouting and language");
  {
    const res = await call("/");
    const location = res.headers.get("location") ?? "";
    check(
      "a bare path redirects into a locale",
      [307, 308].includes(res.status) && /\/(en|hi|ta|gu|te|kn|mr)$/.test(location),
      `HTTP ${res.status} → ${location || "(none)"}`
    );

    /**
     * The target depends on the visitor's cookie and Accept-Language, so a
     * shared cache must never reuse it. It shipped `public` with no Vary,
     * which let a browser pin one answer and stop asking - a bare domain that
     * would not open while every other path worked.
     */
    const cache = res.headers.get("cache-control") ?? "";
    check(
      "the locale redirect is never stored by a shared cache",
      /no-store/.test(cache) && !/public/.test(cache),
      cache || "(no cache-control)"
    );
    check(
      "and it says what it varies on",
      /accept-language/i.test(res.headers.get("vary") ?? ""),
      res.headers.get("vary") || "(no vary)"
    );
  }
  {
    const res = await call("/en");
    const html = await res.text();
    check("the English homepage renders", res.status === 200, `HTTP ${res.status}`);
    check("it declares itself English", /<html[^>]*lang="en(-[A-Za-z]+)?"/.test(html));

    const [pkg] = (await db.execute(sql`
      select name from package where status = 'published' order by name limit 1
    `)) as unknown as [{ name: string } | undefined];
    check(
      "the page carries catalogue data from Postgres",
      Boolean(pkg) && html.includes(pkg!.name),
      pkg?.name ?? "no published package seeded"
    );
  }
  {
    const [pkg] = (await db.execute(sql`
      select name from package where status = 'published' order by name limit 1
    `)) as unknown as [{ name: string } | undefined];
    const res = await call("/en/packages");
    const html = await res.text();
    check("the packages index renders", res.status === 200, `HTTP ${res.status}`);
    check(
      "the packages index lists a published package",
      Boolean(pkg) && html.includes(pkg!.name),
      pkg?.name ?? "no published package seeded"
    );
    check("the packages nav points at the index, not a homepage hash", html.includes('href="/en/packages"'));
  }
  {
    const res = await call("/en/providers");
    const html = await res.text();
    check("the providers directory renders", res.status === 200, `HTTP ${res.status}`);
  }
  {
    const res = await call("/en/food");
    const html = await res.text();
    check("the food page renders", res.status === 200, `HTTP ${res.status}`);
    check("the food planner CTA is locale-prefixed", html.includes('href="/en/planner"'));
    check("the food page does not use a bare /planner href", !html.includes('href="/planner"'));
  }
  {
    const res = await call("/hi");
    const html = await res.text();
    check(
      "a second locale renders with the right lang attribute",
      res.status === 200 && /<html[^>]*lang="hi"/.test(html),
      `HTTP ${res.status}`
    );
  }
  {
    // A path with no locale is prefixed with one first, so the 404 is served
    // one hop later. Check both halves — a redirect that never terminates in a
    // 404 would mean unknown URLs answer 200, which is what the legacy SPA did.
    const hop = await call("/xx");
    const location = hop.headers.get("location") ?? "";
    check(
      "an unknown path is sent to a locale first",
      [307, 308].includes(hop.status) && /\/(en|hi|ta|gu|te|kn|mr)\/xx$/.test(location),
      `HTTP ${hop.status} → ${location || "(none)"}`
    );
    const res = await call("/en/xx");
    check("and then answers 404, never a blank 200", res.status === 404, `HTTP ${res.status}`);
  }

  // ---------- the page the product rests on ----------
  console.log("\nPackage detail");
  {
    const [row] = (await db.execute(sql`
      select slug, name from package where status = 'published' order by name limit 1
    `)) as unknown as [{ slug: string; name: string } | undefined];

    if (!check("a published package exists to open", Boolean(row))) {
      console.log("        seed the catalogue first: npm run db:seed");
    } else {
      const res = await call(`/en/packages/${row!.slug}`);
      const html = await res.text();
      check("its page renders", res.status === 200, `HTTP ${res.status}`);
      check("it names the package", html.includes(row!.name));
      check("it shows the day-by-day itinerary", /Day by day/i.test(html));

      const [meals] = (await db.execute(sql`
        select count(*)::int as n from package_day_meal m
        join package_day d on d.id = m.package_day_id
        join package p on p.id = d.package_id
        where p.slug = ${row!.slug}
      `)) as unknown as [{ n: number }];
      check(
        "every meal's compliance rating reaches the page",
        Number(meals.n) === 0 || /Meal compliance across this itinerary/i.test(html),
        `${meals.n} meals stored`
      );
    }
  }
  {
    const res = await call("/en/packages/no-such-package");
    check("an unknown slug is a 404", res.status === 404, `HTTP ${res.status}`);
  }

  // ---------- enquiries survive the visitor closing the tab ----------
  console.log("\nEnquiries and applications");
  {
    const res = await call("/api/leads", { body: { name: "x" } });
    check("an incomplete enquiry is refused", res.status === 400, `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/leads", {
      body: {
        name: `E2E ${run}`,
        mobile: "+919812345678",
        departureCity: "Ahmedabad",
        groupSize: 12,
        protocol: "jain",
        protocolLabel: "Jain",
        travelMonth: "October 2026",
        message: "e2e test enquiry",
      },
    });
    const body = await json(res);
    check("a complete enquiry is accepted", res.status === 201 && body?.success === true, `HTTP ${res.status}`);

    const [row] = (await db.execute(sql`
      select name, group_size, protocol, departure_city from lead where name = ${`E2E ${run}`}
    `)) as unknown as [{ name: string; group_size: number; protocol: string; departure_city: string } | undefined];
    check("it is stored in Postgres, not only sent to WhatsApp", Boolean(row));
    check(
      "the structured fields are columns, not prose",
      Boolean(row) && Number(row!.group_size) === 12 && row!.protocol === "jain",
      row ? `group_size=${row.group_size} protocol=${row.protocol}` : ""
    );
  }
  {
    const res = await call("/api/vendor-applications", {
      body: {
        businessName: `E2E Kitchen ${run}`,
        businessType: "Jain-capable kitchen",
        baseArea: "Ubud",
        capabilities: ["Jain", "Vegetarian"],
        languages: "English, Hindi",
        whatsapp: "+6281234567890",
      },
    });
    check("a vendor application is accepted", res.status === 201, `HTTP ${res.status}`);

    const [row] = (await db.execute(sql`
      select status, capabilities from vendor_application where business_name = ${`E2E Kitchen ${run}`}
    `)) as unknown as [{ status: string; capabilities: string[] } | undefined];
    check("it is stored for review rather than lost", Boolean(row));
    check("it arrives pending, not verified", Boolean(row) && row!.status === "pending", row?.status);
  }
  {
    const res = await call("/api/vendor-applications", {
      body: { businessName: "No capabilities", businessType: "x", baseArea: "y", capabilities: [], whatsapp: "+6281234567890" },
    });
    check("an application with no dietary capability is refused", res.status === 400, `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/vendor-applications", {
      body: {
        businessName: APPLICANT_BUSINESS,
        businessType: "Jain-capable kitchen",
        baseArea: "Ubud",
        capabilities: ["Jain", "Vegetarian"],
        languages: "English, Hindi",
        whatsapp: "+6281234567891",
        email: APPLICANT_EMAIL,
      },
    });
    const body = await json(res);
    applicantApplicationId = body?.data?.id ?? body?.data?.application?.id ?? "";
    check("an application with an email is accepted", res.status === 201 && Boolean(applicantApplicationId), `HTTP ${res.status}`);
  }

  // ---------- the account page is guarded ----------
  console.log("\nAccess control");
  {
    const res = await call("/en/account");
    const location = res.headers.get("location") ?? "";
    check(
      "a signed-out visitor cannot open /en/account",
      [307, 308].includes(res.status) && location.includes("/login"),
      `HTTP ${res.status} → ${location || "(none)"}`
    );
  }

  // ---------- input is rejected at the boundary ----------
  console.log("\nSign-in — input validation");
  {
    const res = await call("/api/auth/request-otp", { body: { email: "not-an-email" } });
    check("a malformed email is refused", res.status === 400, `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/auth/request-otp", {
      body: { email: EMAIL, mobile: "+919812345678" },
    });
    check("email and mobile together are refused", res.status === 400, `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/auth/verify-otp", { body: { email: EMAIL, code: "12" } });
    check("a short code is refused", res.status === 400, `HTTP ${res.status}`);
  }

  // ---------- the real round trip ----------
  console.log("\nSign-in — round trip");
  {
    const res = await call("/api/auth/request-otp", { body: { email: EMAIL } });
    const body = await json(res);
    check("requesting a code succeeds", res.status === 200 && body?.success === true, `HTTP ${res.status}`);
    check(
      "the reply does not reveal whether the account exists",
      typeof body?.data?.message === "string" && /if that contact is valid/i.test(body.data.message)
    );
  }

  const [stored] = (await db.execute(sql`
    select code_hash, attempts, consumed_at, expires_at
    from otp_code where identifier = ${`email:${EMAIL}`}
    order by created_at desc limit 1
  `)) as unknown as [{ code_hash: string; attempts: number; consumed_at: string | null; expires_at: string } | undefined];

  check("the code is persisted", Boolean(stored));
  check("it is stored as a hash, not as digits", Boolean(stored) && !/^\d{6}$/.test(stored!.code_hash));
  check(
    "it expires within the hour",
    Boolean(stored) && new Date(stored!.expires_at).getTime() - Date.now() < 60 * 60_000
  );

  const code = await otpFromLog(EMAIL);
  if (!check("the code reaches its delivery channel", Boolean(code), code ? `read from the server log` : "not found in the server log")) {
    console.log("\n  Cannot continue without the code. Is the server writing to E2E_SERVER_LOG?\n");
    await cleanup();
    console.log(`${passed} passed, ${failed} failed\n`);
    process.exit(1);
  }

  {
    const wrong = code === "000000" ? "111111" : "000000";
    const res = await call("/api/auth/verify-otp", { body: { email: EMAIL, code: wrong } });
    check("a wrong code is rejected", res.status === 401, `HTTP ${res.status}`);

    const [after] = (await db.execute(sql`
      select attempts from otp_code where identifier = ${`email:${EMAIL}`}
      order by created_at desc limit 1
    `)) as unknown as [{ attempts: number }];
    check("the wrong guess is counted against the code", Number(after.attempts) === 1, `attempts=${after.attempts}`);
  }

  {
    const res = await call("/api/auth/verify-otp", { body: { email: EMAIL, code: code! } });
    const body = await json(res);
    check("the correct code signs in", res.status === 200 && body?.success === true, `HTTP ${res.status}`);
    check("the account is created on first sign-in", body?.data?.isNewAccount === true);

    const raw = res.headers.getSetCookie().find((c) => c.startsWith(`${SESSION_COOKIE}=`)) ?? "";
    sessionCookie = cookieFrom(res);
    check("a session cookie is set", sessionCookie.length > `${SESSION_COOKIE}=`.length);
    check("the cookie is httpOnly", /httponly/i.test(raw));
    check("the cookie is SameSite=Lax", /samesite=lax/i.test(raw));
  }

  const token = sessionCookie.slice(SESSION_COOKIE.length + 1);
  {
    const [row] = (await db.execute(sql`
      select token_hash from session where token_hash = ${hashSessionToken(token)}
    `)) as unknown as [{ token_hash: string } | undefined];
    check("the session exists in Postgres", Boolean(row));
    check("only the hash is stored, never the token", Boolean(row) && row!.token_hash !== token);
  }

  {
    const res = await call("/api/auth/session", { cookie: sessionCookie });
    const body = await json(res);
    check("the session resolves to the right account", body?.data?.user?.email === EMAIL, body?.data?.user?.email);
    check("the new account is a traveller", body?.data?.user?.role === "traveller", body?.data?.user?.role);
  }

  {
    const res = await call("/api/trip-requests", {
      body: { protocol: "vegetarian", groupSize: 8, publishToProviders: true },
    });
    check("anonymous travellers cannot post a trip request", res.status === 401, `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/trip-requests", {
      cookie: sessionCookie,
      body: {
        protocol: "vegetarian",
        groupSize: 8,
        departureCity: "Mumbai",
        flexibleMonth: "October",
        notes: "Family villa with Jain option",
        publishToProviders: true,
        budgetBasis: "unsure",
      },
    });
    const body = await json(res);
    check(
      "a signed-in traveller can post a trip request",
      res.status === 201 && body?.success === true,
      `HTTP ${res.status}`
    );
    check(
      "OTP-free travellers can publish a request to providers",
      body?.data?.publishedToProviders === true,
      `published=${body?.data?.publishedToProviders}`
    );
  }
  {
    const res = await call("/api/trip-requests", { cookie: sessionCookie });
    const body = await json(res);
    check(
      "the traveller can list their trip requests",
      res.status === 200 && Array.isArray(body?.data?.requests) && body.data.requests.length >= 1,
      `count=${body?.data?.requests?.length}`
    );
  }

  {
    const res = await call("/en/account", { cookie: sessionCookie });
    const html = await res.text();
    check("the account page now opens", res.status === 200, `HTTP ${res.status}`);
    check("it shows the signed-in identity", html.includes(EMAIL));
    check("it is marked noindex", /noindex/i.test(html));
  }

  {
    const res = await call("/api/auth/verify-otp", { body: { email: EMAIL, code: code! } });
    check("the same code cannot be used twice", res.status === 401, `HTTP ${res.status}`);
  }

  {
    const [row] = (await db.execute(sql`
      select count(*)::int as n from audit_log
      where action = 'account.created'
        and account_id = (select id from account where email = ${EMAIL})
    `)) as unknown as [{ n: number }];
    check("the sign-in is audited", Number(row.n) === 1, `${row.n} rows`);
  }

  // ---------- vendor -> admin -> public listing -> traveller booking ----------
  console.log("\nMarketplace lifecycle");
  let vendorId = "";
  let marketplaceMediaId = "";
  const marketplacePrice = 250_000;

  {
    const res = await call("/api/auth/password/signup", {
      body: {
        username: VENDOR_USERNAME,
        password: VENDOR_PASSWORD,
        email: VENDOR_EMAIL,
        role: "vendor",
        businessName: VENDOR_BUSINESS,
      },
    });
    const body = await json(res);
    vendorCookie = cookieFrom(res);
    check("a provider can create a vendor account", res.status === 201 && body?.success === true, `HTTP ${res.status}`);
    check("the provider receives a secure session", vendorCookie.length > `${SESSION_COOKIE}=`.length);

    const [row] = (await db.execute(sql`
      select v.id, v.verification_status from vendor v
      join account a on a.id = v.account_id
      where a.email = ${VENDOR_EMAIL}
    `)) as unknown as [{ id: string; verification_status: string } | undefined];
    vendorId = row?.id ?? "";
    check("vendor onboarding creates an isolated provider profile", Boolean(vendorId));
    check("a new vendor is not trusted automatically", row?.verification_status === "draft", row?.verification_status);
  }
  {
    const res = await call("/en/providers");
    const html = await res.text();
    check(
      "an unverified vendor stays off the public directory",
      res.status === 200 && !html.includes(VENDOR_BUSINESS),
      `HTTP ${res.status}`
    );
  }

  {
    const res = await call("/api/provider/catalog", { cookie: sessionCookie });
    check("a traveller cannot read the vendor API", res.status === 403, `HTTP ${res.status}`);
  }
  {
    const res = await call("/en/provider", { cookie: sessionCookie });
    const location = res.headers.get("location") ?? "";
    check(
      "a traveller opening the provider URL is redirected",
      [307, 308].includes(res.status) && location.includes("/en/account"),
      `HTTP ${res.status} → ${location || "(none)"}`
    );
  }
  {
    const res = await call("/en/admin", { cookie: vendorCookie });
    const location = res.headers.get("location") ?? "";
    check(
      "a vendor opening the admin URL is redirected",
      [307, 308].includes(res.status) && location.includes("/en/account"),
      `HTTP ${res.status} → ${location || "(none)"}`
    );
  }
  {
    const res = await call("/en/account", { cookie: vendorCookie });
    const html = await res.text();
    check("the vendor account shows only the provider workspace", res.status === 200 && html.includes("Provider workspace"));
    check("the vendor account does not expose traveller bookings", !html.includes("My bookings"));
  }
  {
    const res = await call("/en/provider", { cookie: vendorCookie });
    const html = await res.text();
    check("the provider dashboard opens for the vendor", res.status === 200 && /Provider dashboard/i.test(html), `HTTP ${res.status}`);
  }

  {
    const res = await call("/api/provider/listings", {
      cookie: vendorCookie,
      body: {
        title: MARKETPLACE_LISTING,
        serviceType: "restaurant",
        description: "Fresh Jain and vegetarian dining in Ubud with no onion or garlic on request.",
        area: "Ubud",
        city: "Bali",
        capacityMin: 1,
        capacityMax: 12,
        tier: "comfort",
        priceAmount: marketplacePrice,
        priceCurrency: "INR",
        priceUnit: "per_person",
        images: ["https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80"],
        inclusions: ["Jain meal", "Filtered drinking water"],
        cancellationPolicy: "Free cancellation until 24 hours before service.",
      },
    });
    const body = await json(res);
    marketplaceListingId = body?.data?.listing?.id ?? "";
    check("the vendor can add a priced food listing", res.status === 201 && Boolean(marketplaceListingId), `HTTP ${res.status}`);
    check(
      "a new listing waits for review",
      body?.data?.listing?.status === "pending_review" && body?.data?.listing?.active === false,
      `${body?.data?.listing?.status} active=${body?.data?.listing?.active}`
    );
  }
  {
    const res = await call(`/api/provider/listings/${marketplaceListingId}`, {
      method: "PATCH",
      cookie: vendorCookie,
      body: {
        title: MARKETPLACE_LISTING,
        description: "Updated Jain dining listing after the vendor edited the price.",
        priceAmount: marketplacePrice,
      },
    });
    const body = await json(res);
    check("the vendor can edit their listing", res.status === 200 && body?.data?.listing?.id === marketplaceListingId, `HTTP ${res.status}`);
    check("an edited listing returns to review", body?.data?.listing?.status === "pending_review", body?.data?.listing?.status);
  }
  {
    const res = await call("/api/provider/media", {
      cookie: vendorCookie,
      body: {
        listingId: marketplaceListingId,
        kind: "photo",
        fileUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
        altText: "Jain meal served in Ubud",
      },
    });
    const body = await json(res);
    marketplaceMediaId = body?.data?.media?.id ?? "";
    check("the vendor can attach a listing photo", res.status === 201 && Boolean(marketplaceMediaId), `HTTP ${res.status}`);
    check("vendor photos also wait for moderation", body?.data?.media?.approved === false);
  }
  {
    const res = await call(`/api/services/${marketplaceListingId}`);
    check("an unapproved listing is invisible to travellers", res.status === 404, `HTTP ${res.status}`);
  }

  {
    const rawToken = randomBytes(32).toString("base64url");
    const [admin] = (await db.execute(sql`
      insert into account (email, username, role, status, email_verified_at)
      values (${ADMIN_EMAIL}, ${ADMIN_USERNAME}, 'admin', 'active', now())
      returning id
    `)) as unknown as [{ id: string }];
    await db.execute(sql`
      insert into session (account_id, token_hash, expires_at, user_agent)
      values (${admin.id}, ${hashSessionToken(rawToken)}, now() + interval '1 day', 'only2bali-e2e-admin')
    `);
    adminCookie = `${SESSION_COOKIE}=${rawToken}`;

    const res = await call("/en/admin", { cookie: adminCookie });
    const html = await res.text();
    check("the admin control opens for an admin", res.status === 200 && /Admin control/i.test(html), `HTTP ${res.status}`);
  }
  {
    const res = await call(`/api/admin/applications/${applicantApplicationId}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "verified" },
    });
    check("admin can approve a vendor application", res.status === 200, `HTTP ${res.status}`);

    const [row] = (await db.execute(sql`
      select a.role, v.verification_status
      from account a
      join vendor v on v.account_id = a.id
      where a.email = ${APPLICANT_EMAIL}
    `)) as unknown as [{ role: string; verification_status: string } | undefined];
    check("approving an application creates a vendor account", row?.role === "vendor", row?.role);
    check("the new vendor is verified immediately", row?.verification_status === "verified", row?.verification_status);
  }
  {
    const res = await call(`/api/admin/vendors/${vendorId}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { verificationStatus: "verified" },
    });
    check("admin can verify the real vendor record", res.status === 200, `HTTP ${res.status}`);
  }
  {
    const res = await call("/en/providers");
    const html = await res.text();
    check(
      "a verified vendor appears on the public directory",
      res.status === 200 && html.includes(VENDOR_BUSINESS),
      `HTTP ${res.status}`
    );
  }
  {
    const res = await call(`/api/admin/listings/${marketplaceListingId}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "active", active: true },
    });
    check("admin can publish and activate the listing", res.status === 200, `HTTP ${res.status}`);
  }
  {
    const res = await call(`/api/admin/media/${marketplaceMediaId}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "published", approved: true },
    });
    check("admin can approve the vendor photo", res.status === 200, `HTTP ${res.status}`);
  }
  {
    const res = await call(`/api/services/${marketplaceListingId}`);
    const body = await json(res);
    check("the verified listing becomes public", res.status === 200 && body?.data?.service?.title === MARKETPLACE_LISTING, `HTTP ${res.status}`);
    check("the public API shows the server-stored price", body?.data?.service?.priceAmount === marketplacePrice);
  }
  {
    const res = await call(`/en/services/${marketplaceListingId}`);
    const html = await res.text();
    check("the marketplace detail page renders", res.status === 200 && html.includes(MARKETPLACE_LISTING), `HTTP ${res.status}`);
    check("a signed-out visitor is prompted to sign in before booking", /Sign in/i.test(html));
  }
  {
    const res = await call("/en/services?type=restaurant&region=bali");
    const html = await res.text();
    check("the services index renders filtered listings", res.status === 200 && html.includes(MARKETPLACE_LISTING), `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/services?type=restaurant&region=bali");
    const body = await json(res);
    const titles = (body?.data?.services ?? []).map((s: { title?: string }) => s.title);
    check("the services API applies the type filter", res.status === 200 && titles.includes(MARKETPLACE_LISTING), titles.join(","));
  }
  {
    const res = await call("/api/payments/webhook", {
      method: "POST",
      body: { event: "payment.captured" },
    });
    const body = await json(res);
    check(
      "an unsigned webhook is refused while payments stay fail-closed",
      [400, 503].includes(res.status),
      `HTTP ${res.status} reason=${body?.reason ?? body?.error}`
    );
  }
  {
    const res = await call("/api/bookings", {
      body: {
        listingId: marketplaceListingId,
        serviceDate: new Date(Date.now() + 40 * 86_400_000).toISOString().slice(0, 10),
        pax: 1,
        protocol: "jain",
        travellers: [{ fullName: `E2E Anonymous ${run}` }],
      },
    });
    check("the public listing still cannot be booked anonymously", res.status === 401, `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/payments/checkout", {
      cookie: vendorCookie,
      body: {
        bookingId: "00000000-0000-4000-8000-000000000000",
        provider: "razorpay",
        purpose: "full",
      },
    });
    check("a vendor cannot enter traveller checkout", res.status === 403, `HTTP ${res.status}`);
  }
  {
    const serviceDate = new Date(Date.now() + 40 * 86_400_000).toISOString().slice(0, 10);
    const res = await call("/api/bookings", {
      cookie: sessionCookie,
      body: {
        listingId: marketplaceListingId,
        serviceDate,
        pax: 2,
        protocol: "jain",
        grossAmount: 1,
        travellers: [
          { fullName: `E2E Marketplace Lead ${run}`, dietaryNotes: "Jain, no root vegetables" },
          { fullName: `E2E Marketplace Guest ${run}` },
        ],
      },
    });
    const body = await json(res);
    marketplaceBookingId = body?.data?.bookingId ?? "";
    check("a signed-in traveller can book the marketplace listing", res.status === 201 && Boolean(marketplaceBookingId), `HTTP ${res.status}`);
    check(
      "listing price is computed on the server",
      body?.data?.grossAmount === marketplacePrice * 2,
      `${body?.data?.grossAmount} vs ${marketplacePrice * 2}`
    );
    check("the listing date is held while payment is pending", Boolean(body?.data?.holdExpiresAt));
  }
  {
    const res = await call("/api/payments/checkout", {
      cookie: sessionCookie,
      body: {
        bookingId: marketplaceBookingId,
        provider: "razorpay",
        purpose: "full",
        idempotencyKey: `marketplace-${run}-checkout`,
      },
    });
    const body = await json(res);
    check(
      "checkout fails closed while the real webhook secret is absent",
      res.status === 503 && body?.reason === "payment_setup_required",
      `HTTP ${res.status} reason=${body?.reason}`
    );
    const [rows] = (await db.execute(sql`
      select count(*)::int as n from payment where booking_id = ${marketplaceBookingId}
    `)) as unknown as [{ n: number }];
    check("the paused checkout creates no gateway payment row", Number(rows.n) === 0, `${rows.n} rows`);
  }
  {
    const orderId = `order_e2e_${run}`;
    const paymentId = `pay_e2e_${run}`;
    await db.execute(sql`
      insert into payment (
        booking_id, provider, provider_order_id, amount, currency, purpose, status, idempotency_key, initiated_by
      )
      select
        b.id, 'razorpay', ${orderId}, b.gross_amount, b.currency, 'full', 'created',
        ${`e2e-verify-${run}`}, a.id
      from booking b
      join traveller t on t.id = b.traveller_id
      join account a on a.id = t.account_id
      where b.id = ${marketplaceBookingId}
    `);
    const signature = razorpayPaymentSignature(orderId, paymentId, E2E_RAZORPAY_KEY_SECRET);
    const res = await call("/api/payments/verify", {
      cookie: sessionCookie,
      body: {
        bookingId: marketplaceBookingId,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
    });
    const body = await json(res);
    check("a signed Razorpay verify confirms the listing booking", res.status === 200 && body?.data?.status === "captured", `HTTP ${res.status} status=${body?.data?.status}`);

    const [row] = (await db.execute(sql`
      select b.status as booking_status, p.status as payment_status
      from booking b
      join payment p on p.booking_id = b.id
      where b.id = ${marketplaceBookingId}
    `)) as unknown as [{ booking_status: string; payment_status: string } | undefined];
    check("the booking is confirmed after verify", row?.booking_status === "confirmed", row?.booking_status);
    check("the payment row is captured", row?.payment_status === "captured", row?.payment_status);

    const bad = await call("/api/payments/verify", {
      cookie: sessionCookie,
      body: {
        bookingId: marketplaceBookingId,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: "0".repeat(64),
      },
    });
    check("a tampered verify signature is refused", bad.status === 400, `HTTP ${bad.status}`);
  }

  // ---------- food protocols ----------
  //
  // The list grew from three to seven. What matters is that a protocol the
  // form offers is a protocol the API stores - a mismatch here is somebody
  // booking a trip under a diet the platform never recorded.
  console.log("\nFood protocols");
  {
    const res = await call("/api/trip-requests", { cookie: sessionCookie, body: { protocol: "not_a_protocol", groupSize: 2 } });
    check("an invented protocol is refused", res.status === 400, `HTTP ${res.status}`);

    for (const protocol of PROTOCOLS) {
      const created = await call("/api/trip-requests", {
        cookie: sessionCookie,
        body: { protocol, groupSize: 2, notes: `E2E protocol ${protocol} ${run}`, publishToProviders: false },
      });
      const body = await json(created);
      const id = body?.data?.request?.id ?? "";
      if (!check(`a traveller can request a ${protocol} trip`, created.status === 201 && Boolean(id), `HTTP ${created.status}`)) continue;

      const [row] = (await db.execute(sql`select protocol from trip_request where id = ${id}`)) as unknown as [
        { protocol: string } | undefined,
      ];
      check(`and it is stored as ${protocol}, not coerced`, row?.protocol === protocol, row?.protocol);
    }
  }
  {
    // The public filter has to accept the same words, or a protocol is
    // offered on the form and silently ignored on the directory.
    for (const protocol of PROTOCOLS) {
      const res = await call(`/api/services?protocol=${protocol}`);
      check(`the services filter accepts ${protocol}`, res.status === 200, `HTTP ${res.status}`);
    }
  }
  {
    const res = await call("/en");
    const html = await res.text();
    check(
      "no raw enum value is rendered at a traveller",
      !html.includes("non_veg"),
      "the homepage would have shown non_veg"
    );
  }

  // ---------- the demand loop: publish, bid, compare, accept ----------
  //
  // The traveller's first request stayed private because the account had only
  // an email. Publishing to providers needs a verified mobile, so that round
  // trip is driven here rather than arranged in SQL — an unverified number
  // silently publishing a request would be the bug worth catching.
  console.log("\nRequest board, bids and offers");
  {
    const res = await call("/api/auth/verify-mobile/request", {
      cookie: sessionCookie,
      body: { mobile: MOBILE },
    });
    check("a signed-in traveller can ask to verify a mobile", res.status === 200, `HTTP ${res.status}`);

    const anon = await call("/api/auth/verify-mobile/request", { body: { mobile: MOBILE } });
    check("an anonymous caller cannot", anon.status === 401, `HTTP ${anon.status}`);
  }
  {
    const code = await otpFromLog(MOBILE);
    if (!check("the mobile code reaches its delivery channel", Boolean(code), code ? "read from the server log" : "not found")) {
      console.log("\n  Cannot continue the request board without the mobile code.\n");
    } else {
      const wrong = await call("/api/auth/verify-mobile/confirm", {
        cookie: sessionCookie,
        body: { mobile: MOBILE, code: code === "000000" ? "111111" : "000000" },
      });
      check("a wrong mobile code is refused", wrong.status === 400, `HTTP ${wrong.status}`);

      const res = await call("/api/auth/verify-mobile/confirm", {
        cookie: sessionCookie,
        body: { mobile: MOBILE, code },
      });
      const body = await json(res);
      check(
        "the correct mobile code verifies the number",
        res.status === 200 && body?.data?.verified === true,
        `HTTP ${res.status}`
      );

      const [row] = (await db.execute(sql`
        select mobile, mobile_verified_at from account where email = ${EMAIL}
      `)) as unknown as [{ mobile: string | null; mobile_verified_at: string | null } | undefined];
      check("the verification is recorded on the account", Boolean(row?.mobile_verified_at), row?.mobile ?? "no mobile");
    }
  }
  {
    const res = await call("/api/trip-requests", {
      cookie: sessionCookie,
      body: {
        protocol: "jain",
        groupSize: 8,
        nights: 5,
        departureCity: "Ahmedabad",
        kitchenRequired: true,
        budgetMinAmount: 6_000_000,
        budgetMaxAmount: 9_000_000,
        budgetCurrency: "INR",
        budgetBasis: "total",
        notes: `E2E board request ${run}`,
        publishToProviders: true,
      },
    });
    const body = await json(res);
    boardRequestId = body?.data?.request?.id ?? "";
    check(
      "a mobile-verified traveller can publish a request",
      res.status === 201 && Boolean(boardRequestId),
      `HTTP ${res.status}`
    );
    check("and it really is published to providers", body?.data?.publishedToProviders === true);

    const [row] = (await db.execute(sql`
      select visibility, published_at, bids_close_at from trip_request where id = ${boardRequestId}
    `)) as unknown as [{ visibility: string; published_at: string | null; bids_close_at: string | null } | undefined];
    check("the board request is open to verified providers", row?.visibility === "open_to_verified", row?.visibility);
    check("bidding has a closing date", Boolean(row?.bids_close_at));
  }
  {
    const anon = await call(`/api/trip-requests/${boardRequestId}/bids`, {
      body: { title: "Anonymous bid", vendorNetAmount: 100_000 },
    });
    check("an anonymous caller cannot bid", anon.status === 401, `HTTP ${anon.status}`);

    const asTraveller = await call(`/api/trip-requests/${boardRequestId}/bids`, {
      cookie: sessionCookie,
      body: { title: "Traveller bid", vendorNetAmount: 100_000 },
    });
    check("a traveller cannot bid on their own request", asTraveller.status === 403, `HTTP ${asTraveller.status}`);

    const invalid = await call(`/api/trip-requests/${boardRequestId}/bids`, {
      cookie: vendorCookie,
      body: { title: "", vendorNetAmount: -1 },
    });
    check("a malformed bid is refused", invalid.status === 400, `HTTP ${invalid.status}`);

    const missing = await call("/api/trip-requests/00000000-0000-0000-0000-000000000000/bids", {
      cookie: vendorCookie,
      body: { title: `E2E bid ${run}`, vendorNetAmount: 100_000 },
    });
    check("a bid on an unknown request is a not-found", missing.status === 404, `HTTP ${missing.status}`);
  }
  {
    const res = await call(`/api/trip-requests/${boardRequestId}/bids`, {
      cookie: vendorCookie,
      body: {
        title: `E2E Jain Bali 5N ${run}`,
        summary: "Kitchen on site, Jain cook, own-language guide.",
        vendorNetAmount: BID_NET_AMOUNT,
        currency: "INR",
        pricePerPerson: Math.floor(BID_NET_AMOUNT / 8),
        lineItems: [
          { label: "Stay", amount: 4_000_000 },
          { label: "Meals", amount: 2_000_000 },
        ],
      },
    });
    const body = await json(res);
    acceptedOfferId = body?.data?.bid?.id ?? "";
    bidThreadId = body?.data?.threadId ?? "";
    check("a verified provider can bid", res.status === 201 && Boolean(acceptedOfferId), `HTTP ${res.status}`);
    check("bidding opens a message thread", Boolean(bidThreadId));

    // The provider quotes what it wants to be paid and the traveller's price is
    // grossed up from it. Taking the commission out of the provider's number
    // instead would quietly underpay every provider, and the arithmetic is
    // close enough either way to survive a casual read.
    //
    // The rate comes from the vendor row rather than the platform default,
    // because a negotiated per-provider rate is exactly the case where the two
    // diverge — and the one a hard-coded default would hide.
    const [vendorRow] = (await db.execute(sql`
      select commission_rate from vendor where id = ${vendorId}
    `)) as unknown as [{ commission_rate: string | null } | undefined];
    const rate = Number(vendorRow?.commission_rate ?? 0.1);
    const expectedTotal = Math.ceil(BID_NET_AMOUNT / (1 - rate));
    const [row] = (await db.execute(sql`
      select total_amount, vendor_net_amount, commission_rate, status, origin
      from offer where id = ${acceptedOfferId}
    `)) as unknown as [
      | {
          total_amount: number;
          vendor_net_amount: number;
          commission_rate: string;
          status: string;
          origin: string;
        }
      | undefined,
    ];
    check(
      "the traveller price is grossed up from the provider's net, not cut from it",
      Number(row?.total_amount) === expectedTotal && Number(row?.vendor_net_amount) === BID_NET_AMOUNT,
      `${row?.total_amount} vs ${expectedTotal}`
    );
    check(
      "the offer is priced at this provider's own commission rate, not the platform default",
      Number(row?.commission_rate) === rate,
      `offer=${row?.commission_rate} vendor=${vendorRow?.commission_rate}`
    );
    check(
      "the bid arrives as a sent vendor offer",
      row?.status === "sent" && row?.origin === "vendor_bid",
      `${row?.status}/${row?.origin}`
    );
  }
  {
    // A second bid, so accepting the first has something to close.
    const res = await call(`/api/trip-requests/${boardRequestId}/bids`, {
      cookie: vendorCookie,
      body: { title: `E2E Runner-up ${run}`, vendorNetAmount: BID_NET_AMOUNT + 500_000, currency: "INR" },
    });
    const body = await json(res);
    rivalOfferId = body?.data?.bid?.id ?? "";
    check("a second bid is accepted onto the same request", res.status === 201 && Boolean(rivalOfferId), `HTTP ${res.status}`);
  }
  {
    const anon = await call(`/api/trip-requests/${boardRequestId}/offers`);
    check("offers are not readable anonymously", anon.status === 401, `HTTP ${anon.status}`);

    const res = await call(`/api/trip-requests/${boardRequestId}/offers`, { cookie: sessionCookie });
    const body = await json(res);
    const offers: Array<{ id: string }> = body?.data?.offers ?? [];
    check(
      "the traveller can compare the offers",
      res.status === 200 && offers.length === 2,
      `HTTP ${res.status} count=${offers.length}`
    );
    check(
      "both bids are on the table",
      offers.some((o) => o.id === acceptedOfferId) && offers.some((o) => o.id === rivalOfferId)
    );

    const vendorView = await call(`/api/trip-requests/${boardRequestId}/offers`, { cookie: vendorCookie });
    const vendorBody = await json(vendorView);
    const mine: Array<{ vendorId: string | null }> = vendorBody?.data?.offers ?? [];
    check(
      "a provider sees only its own offers on a request",
      vendorView.status === 200 && mine.length > 0 && mine.every((o) => o.vendorId === vendorId),
      `HTTP ${vendorView.status} count=${mine.length}`
    );
  }
  {
    const res = await call("/api/messages", {
      cookie: vendorCookie,
      body: {
        threadId: bidThreadId,
        body: `Happy to help. Reach me on ${MOBILE} or vendor-${run}@example.com`,
      },
    });
    check("a provider can message the traveller about the bid", res.status === 201 || res.status === 200, `HTTP ${res.status}`);

    const read = await call(`/api/messages?threadId=${bidThreadId}`, { cookie: sessionCookie });
    const body = await json(read);
    check("the traveller can read the thread", read.status === 200, `HTTP ${read.status}`);
    check(
      "contact details stay masked before a booking exists",
      body?.data?.unmasked === false,
      `unmasked=${body?.data?.unmasked}`
    );
    const first = body?.data?.messages?.[0];
    check("the raw phone number is not served while masked", !String(first?.body ?? "").includes(MOBILE));
    check("the attempt to swap contacts off-platform is flagged", first?.contactAttemptDetected === true);
  }
  {
    const asVendor = await call(`/api/offers/${acceptedOfferId}`, { cookie: vendorCookie, body: {} });
    check("a provider cannot accept its own offer", asVendor.status === 403, `HTTP ${asVendor.status}`);

    const missing = await call("/api/offers/00000000-0000-0000-0000-000000000000", {
      cookie: sessionCookie,
      body: {},
    });
    check("accepting an unknown offer is a not-found", missing.status === 404, `HTTP ${missing.status}`);

    const res = await call(`/api/offers/${acceptedOfferId}`, { cookie: sessionCookie, body: {} });
    const body = await json(res);
    offerBookingId = body?.data?.booking?.id ?? "";
    check("the traveller can accept an offer", res.status === 200 && Boolean(offerBookingId), `HTTP ${res.status}`);
    check("accepting returns a booking reference", Boolean(body?.data?.booking?.reference), body?.data?.booking?.reference);

    const [row] = (await db.execute(sql`
      select b.status, b.gross_amount, b.commission_amount, b.net_amount, b.pax,
             tr.status as request_status, tr.close_reason
      from booking b join trip_request tr on tr.id = b.trip_request_id
      where b.id = ${offerBookingId}
    `)) as unknown as [
      | {
          status: string;
          gross_amount: number;
          commission_amount: number;
          net_amount: number;
          pax: number;
          request_status: string;
          close_reason: string | null;
        }
      | undefined,
    ];
    check("the booking waits for payment", row?.status === "pending_payment", row?.status);
    check("it carries the group size from the request", Number(row?.pax) === 8, `pax=${row?.pax}`);
    check("the provider keeps exactly the net it quoted", Number(row?.net_amount) === BID_NET_AMOUNT, `${row?.net_amount}`);
    check(
      "commission and net add back up to the gross",
      Number(row?.commission_amount) + Number(row?.net_amount) === Number(row?.gross_amount),
      `${row?.commission_amount} + ${row?.net_amount} = ${row?.gross_amount}`
    );
    check(
      "the request closes as booked",
      row?.request_status === "booked" && row?.close_reason === "offer_accepted",
      `${row?.request_status}/${row?.close_reason}`
    );

    const [rival] = (await db.execute(sql`
      select status, decline_reason from offer where id = ${rivalOfferId}
    `)) as unknown as [{ status: string; decline_reason: string | null } | undefined];
    check("the losing offer is closed automatically", rival?.status === "declined", rival?.status);
    check("and it says why", rival?.decline_reason === "Another offer accepted", rival?.decline_reason ?? "no reason");

    const again = await call(`/api/offers/${acceptedOfferId}`, { cookie: sessionCookie, body: {} });
    check("an accepted offer cannot be accepted twice", again.status === 409, `HTTP ${again.status}`);

    const declineClosed = await call(`/api/offers/${rivalOfferId}?action=decline`, {
      cookie: sessionCookie,
      body: { reason: "already chosen" },
    });
    check("a closed offer cannot then be declined", declineClosed.status === 409, `HTTP ${declineClosed.status}`);
  }

  // ---------- KYC documents ----------
  //
  // The one place private bytes leave the server. A licence or a passport scan
  // reachable by anyone who can guess a UUID is the failure worth proving does
  // not happen, so every read of it is tried from the wrong side first.
  console.log("\nDocuments and KYC");
  {
    const form = new FormData();
    form.set("file", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])], "licence.pdf", { type: "application/pdf" }));
    form.set("folder", "documents");

    const res = await fetch(`${BASE}/api/provider/uploads`, {
      method: "POST",
      headers: { cookie: vendorCookie, "x-forwarded-for": IP_MAIN, "user-agent": "only2bali-e2e" },
      body: form,
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await json(res);
    documentRef = body?.data?.upload?.ref ?? "";
    documentHandle = body?.data?.upload?.handle ?? "";
    check("a provider can upload a private document", res.status === 201 && Boolean(documentRef), `HTTP ${res.status}`);
    check("the upload returns a signed handle, never a storage location", Boolean(documentHandle) && !documentRef.startsWith("http"), documentRef);

    const anonForm = new FormData();
    anonForm.set("file", new File([new Uint8Array([1, 2, 3])], "x.pdf", { type: "application/pdf" }));
    const anon = await fetch(`${BASE}/api/provider/uploads`, {
      method: "POST",
      headers: { "x-forwarded-for": IP_MAIN, "user-agent": "only2bali-e2e" },
      body: anonForm,
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    check("an anonymous caller cannot upload", anon.status === 401, `HTTP ${anon.status}`);
  }
  {
    const tampered = await call("/api/provider/documents", {
      cookie: vendorCookie,
      body: { kind: "business_licence", ref: documentRef, handle: `${documentHandle}tampered` },
    });
    check("a document with a tampered handle is refused", tampered.status === 400, `HTTP ${tampered.status}`);

    const mismatched = await call("/api/provider/documents", {
      cookie: vendorCookie,
      body: { kind: "business_licence", ref: "providers/someone-else/documents/forged.pdf", handle: documentHandle },
    });
    check("a handle cannot be pointed at another provider's path", mismatched.status === 400, `HTTP ${mismatched.status}`);

    const res = await call("/api/provider/documents", {
      cookie: vendorCookie,
      body: { kind: "business_licence", ref: documentRef, handle: documentHandle },
    });
    const body = await json(res);
    documentId = body?.data?.document?.id ?? "";
    check("a provider can attach the uploaded document", res.status === 201 && Boolean(documentId), `HTTP ${res.status}`);
    check("a new document waits for review", body?.data?.document?.status === "pending", body?.data?.document?.status);

    const list = await call("/api/provider/documents", { cookie: vendorCookie });
    const listBody = await json(list);
    const docs: Array<{ id: string; fileUrl?: string }> = listBody?.data?.documents ?? [];
    check("the provider can list its documents", list.status === 200 && docs.some((d) => d.id === documentId), `HTTP ${list.status}`);
  }
  {
    const anon = await call(`/api/documents/${documentId}/file`);
    check("document bytes are not served anonymously", anon.status === 401, `HTTP ${anon.status}`);

    const asTraveller = await call(`/api/documents/${documentId}/file`, { cookie: sessionCookie });
    check("another signed-in account cannot read a provider's document", asTraveller.status === 403, `HTTP ${asTraveller.status}`);

    const asOwner = await call(`/api/documents/${documentId}/file`, { cookie: vendorCookie });
    check("the owning provider can read it back", asOwner.status === 200, `HTTP ${asOwner.status}`);
    check("and it is sent as an attachment, not rendered", (asOwner.headers.get("content-disposition") ?? "").startsWith("attachment"), asOwner.headers.get("content-disposition") ?? "none");
    check("with sniffing turned off", asOwner.headers.get("x-content-type-options") === "nosniff");
    check("and never cached", asOwner.headers.get("cache-control") === "no-store");

    const asAdmin = await call(`/api/documents/${documentId}/file`, { cookie: adminCookie });
    check("an admin can read it for review", asAdmin.status === 200, `HTTP ${asAdmin.status}`);

    const missing = await call("/api/documents/00000000-0000-0000-0000-000000000000/file", { cookie: adminCookie });
    check("an unknown document is a not-found", missing.status === 404, `HTTP ${missing.status}`);
  }
  {
    const asVendor = await call(`/api/admin/documents/${documentId}`, {
      cookie: vendorCookie,
      method: "PATCH",
      body: { status: "approved" },
    });
    check("a provider cannot approve its own document", asVendor.status === 403, `HTTP ${asVendor.status}`);

    const res = await call(`/api/admin/documents/${documentId}`, {
      cookie: adminCookie,
      method: "PATCH",
      body: { status: "approved" },
    });
    const body = await json(res);
    check("an admin can approve the document", res.status === 200 && body?.data?.document?.status === "approved", `HTTP ${res.status} status=${body?.data?.document?.status}`);

    const again = await call(`/api/admin/documents/${documentId}`, {
      cookie: adminCookie,
      method: "PATCH",
      body: { status: "rejected" },
    });
    check("an already-reviewed document is not re-reviewed", again.status === 404, `HTTP ${again.status}`);
  }

  // ---------- provider fulfilment ----------
  console.log("\nProvider fulfilment");
  {
    const anon = await call("/api/provider/board");
    check("the provider board is not readable anonymously", anon.status === 401, `HTTP ${anon.status}`);

    const asTraveller = await call("/api/provider/board", { cookie: sessionCookie });
    check("a traveller cannot open the provider board", asTraveller.status === 403, `HTTP ${asTraveller.status}`);

    const res = await call("/api/provider/board", { cookie: vendorCookie });
    check("a provider can open its board", res.status === 200, `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/provider/bookings", { cookie: vendorCookie });
    const body = await json(res);
    const rows: Array<{ bookingId: string }> = body?.data?.bookings ?? [];
    check("a provider can list the bookings it must deliver", res.status === 200, `HTTP ${res.status}`);
    check(
      "the marketplace booking is on that list",
      rows.some((b) => b.bookingId === marketplaceBookingId),
      `${rows.length} rows`
    );

    const asTraveller = await call("/api/provider/bookings", { cookie: sessionCookie });
    check("a traveller cannot list provider bookings", asTraveller.status === 403, `HTTP ${asTraveller.status}`);
  }
  {
    const badStatus = await call(`/api/provider/bookings/${marketplaceBookingId}`, {
      cookie: vendorCookie,
      method: "PATCH",
      body: { status: "cancelled" },
    });
    check("a provider cannot invent a booking status", badStatus.status === 400, `HTTP ${badStatus.status}`);

    const notMine = await call(`/api/provider/bookings/${offerBookingId}`, {
      cookie: vendorCookie,
      method: "PATCH",
      body: { status: "in_progress" },
    });
    check(
      "a provider cannot move a booking that is not yet theirs to move",
      notMine.status === 409 || notMine.status === 404,
      `HTTP ${notMine.status}`
    );

    const res = await call(`/api/provider/bookings/${marketplaceBookingId}`, {
      cookie: vendorCookie,
      method: "PATCH",
      body: { status: "in_progress" },
    });
    check("a provider can start the trip", res.status === 200, `HTTP ${res.status}`);

    const done = await call(`/api/provider/bookings/${marketplaceBookingId}`, {
      cookie: vendorCookie,
      method: "PATCH",
      body: { status: "completed" },
    });
    check("and complete it", done.status === 200, `HTTP ${done.status}`);

    const backwards = await call(`/api/provider/bookings/${marketplaceBookingId}`, {
      cookie: vendorCookie,
      method: "PATCH",
      body: { status: "in_progress" },
    });
    check("a completed booking cannot be restarted", backwards.status === 409, `HTTP ${backwards.status}`);
  }
  {
    const res = await call("/api/provider/profile", {
      cookie: vendorCookie,
      method: "PUT",
      body: { businessName: VENDOR_BUSINESS, baseArea: "Ubud", city: "Ubud", country: "Indonesia" },
    });
    check("a provider can edit its profile", res.status === 200, `HTTP ${res.status}`);

    const read = await call("/api/provider/profile", { cookie: vendorCookie });
    check("and read it back", read.status === 200, `HTTP ${read.status}`);

    const asTraveller = await call("/api/provider/profile", { cookie: sessionCookie });
    check("a traveller has no provider profile to read", asTraveller.status === 403, `HTTP ${asTraveller.status}`);
  }
  {
    const res = await call("/api/provider/promotions", { cookie: vendorCookie });
    check("a provider can read its promotions", res.status === 200, `HTTP ${res.status}`);

    const events = await call("/api/provider/events", { cookie: vendorCookie });
    check("a provider can read its events", events.status === 200, `HTTP ${events.status}`);

    const anon = await call("/api/provider/promotions");
    check("promotions are not readable anonymously", anon.status === 401, `HTTP ${anon.status}`);
  }

  // ---------- reviews ----------
  //
  // Both directions, on a booking that has actually happened. The rating a
  // traveller leaves is what the directory sorts on, so it has to roll up.
  console.log("\nReviews");
  {
    const anon = await call("/api/reviews", {
      body: { bookingId: marketplaceBookingId, direction: "traveller_to_vendor", rating: 5 },
    });
    check("an anonymous visitor cannot leave a review", anon.status === 401, `HTTP ${anon.status}`);

    const outOfRange = await call("/api/reviews", {
      cookie: sessionCookie,
      body: { bookingId: marketplaceBookingId, direction: "traveller_to_vendor", rating: 9 },
    });
    check("a rating outside one to five is refused", outOfRange.status === 400, `HTTP ${outOfRange.status}`);

    const unpaid = await call("/api/reviews", {
      cookie: sessionCookie,
      body: { bookingId: offerBookingId, direction: "traveller_to_vendor", rating: 5 },
    });
    check("a trip that has not happened yet cannot be reviewed", unpaid.status === 400, `HTTP ${unpaid.status}`);

    const wrongWay = await call("/api/reviews", {
      cookie: sessionCookie,
      body: { bookingId: marketplaceBookingId, direction: "vendor_to_traveller", rating: 5 },
    });
    check("a traveller cannot review as the provider", wrongWay.status === 403, `HTTP ${wrongWay.status}`);
  }
  {
    const res = await call("/api/reviews", {
      cookie: sessionCookie,
      body: {
        bookingId: marketplaceBookingId,
        direction: "traveller_to_vendor",
        rating: 5,
        comment: `Kitchen kept the protocol all week. ${run}`,
        foodComplianceKept: true,
      },
    });
    check("a traveller can review the provider", res.status === 201, `HTTP ${res.status}`);

    const twice = await call("/api/reviews", {
      cookie: sessionCookie,
      body: { bookingId: marketplaceBookingId, direction: "traveller_to_vendor", rating: 1 },
    });
    check("the same booking cannot be reviewed twice in one direction", twice.status === 409, `HTTP ${twice.status}`);

    const back = await call("/api/reviews", {
      cookie: vendorCookie,
      body: { bookingId: marketplaceBookingId, direction: "vendor_to_traveller", rating: 4, comment: `Easy group. ${run}` },
    });
    check("the provider can review the traveller back", back.status === 201, `HTTP ${back.status}`);
  }
  {
    const [row] = (await db.execute(sql`
      select rating_avg, rating_count from vendor where id = ${vendorId}
    `)) as unknown as [{ rating_avg: string | null; rating_count: number } | undefined];
    check("the traveller's rating rolls up onto the provider", Number(row?.rating_count) === 1, `count=${row?.rating_count}`);
    check("and the average is the rating given", Number(row?.rating_avg) === 5, `avg=${row?.rating_avg}`);

    const res = await call(`/api/reviews?vendorId=${vendorId}`);
    const body = await json(res);
    const reviews: Array<{ rating: number; direction?: string }> = body?.data?.reviews ?? [];
    check("published reviews are readable without signing in", res.status === 200, `HTTP ${res.status}`);
    check("the traveller's review is public", reviews.some((r) => r.rating === 5), `${reviews.length} reviews`);
    check(
      "the provider's review of the traveller is not on the public listing",
      reviews.every((r) => r.direction !== "vendor_to_traveller")
    );

    const noVendor = await call("/api/reviews");
    check("asking for reviews without a provider is refused", noVendor.status === 400, `HTTP ${noVendor.status}`);
  }

  // ---------- admin desk ----------
  console.log("\nAdmin desk");
  {
    const anon = await call("/api/admin/overview");
    check("the admin overview is not readable anonymously", anon.status === 401, `HTTP ${anon.status}`);

    const asVendor = await call("/api/admin/overview", { cookie: vendorCookie });
    check("a provider cannot read the admin overview", asVendor.status === 403, `HTTP ${asVendor.status}`);

    const res = await call("/api/admin/overview", { cookie: adminCookie });
    check("an admin can read the overview", res.status === 200, `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/admin/settings", { cookie: adminCookie });
    const body = await json(res);
    check("an admin can read platform settings", res.status === 200, `HTTP ${res.status}`);

    const asTraveller = await call("/api/admin/settings", { cookie: sessionCookie });
    check("a traveller cannot", asTraveller.status === 403, `HTTP ${asTraveller.status}`);

    const silly = await call("/api/admin/settings", {
      cookie: adminCookie,
      method: "PATCH",
      body: { platformFeeRate: 0.99 },
    });
    check("the platform fee cannot be set past its ceiling", silly.status === 400, `HTTP ${silly.status}`);

    // Restore whatever it was, so the rest of the run prices as it did.
    const current = body?.data?.platformFeeRate ?? body?.data?.settings?.platformFeeRate;
    if (typeof current === "number") {
      const restore = await call("/api/admin/settings", {
        cookie: adminCookie,
        method: "PATCH",
        body: { platformFeeRate: current },
      });
      check("a valid platform fee is accepted", restore.status === 200, `HTTP ${restore.status}`);
    }
  }

  // ---------- availability, planner and gateway choice ----------
  console.log("\nAvailability, planner and gateways");
  {
    const res = await call(`/api/services/${marketplaceListingId}/availability`);
    check("availability for a public listing is readable", res.status === 200, `HTTP ${res.status}`);

    const missing = await call("/api/services/00000000-0000-0000-0000-000000000000/availability");
    check("availability for an unknown listing is a not-found", missing.status === 404, `HTTP ${missing.status}`);
  }
  {
    const res = await call("/api/planner", {
      body: {
        protocol: "jain",
        groupSize: 6,
        nights: 5,
        interests: ["temples", "beaches"],
        departureCity: "Mumbai",
      },
    });
    check("the planner answers even with no AI key configured", res.status === 200, `HTTP ${res.status}`);

    // Every field is optional or defaulted on purpose - the planner takes free
    // text - so the boundary worth proving is the one below the schema.
    const broken = await fetch(`${BASE}/api/planner`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": IP_MAIN, "user-agent": "only2bali-e2e" },
      body: "{not json",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    check("a planner request that is not JSON is refused", broken.status === 400, `HTTP ${broken.status}`);
  }
  {
    const res = await call("/api/payments/options");
    const body = await json(res);
    const gateways: Array<{ id: string; available: boolean; reason: string | null }> = [
      body?.data?.razorpay,
      body?.data?.stripe,
    ].filter(Boolean);
    check("the gateway list is readable", res.status === 200, `HTTP ${res.status}`);
    check("both gateways are named", gateways.length === 2, `${gateways.length} gateways`);
    check(
      "an unconfigured gateway is offered as unavailable with a reason, rather than hidden",
      gateways.every((g) => g.available || Boolean(g.reason)),
      gateways.map((g) => `${g.id}:${g.available ? "on" : g.reason}`).join(" ")
    );
    check(
      "no secret leaks into the public gateway list",
      !JSON.stringify(body ?? {}).includes(E2E_RAZORPAY_KEY_SECRET)
    );
  }

  // ---------- the other ways in ----------
  //
  // Production's only working sign-in is Google, and it had no coverage at all.
  // Neither Google nor Clerk is configured here, so what is proven is that both
  // refuse cleanly instead of half-signing somebody in.
  console.log("\nSign-in alternatives");
  {
    const res = await call("/api/auth/password/signin", {
      body: { username: VENDOR_USERNAME, password: VENDOR_PASSWORD, role: "vendor" },
    });
    const cookie = cookieFrom(res);
    check("a provider can sign in with its password", res.status === 200 && Boolean(cookie), `HTTP ${res.status}`);

    const session = await call("/api/auth/session", { cookie });
    const body = await json(session);
    check("that session resolves to the provider", body?.data?.user?.role === "vendor", body?.data?.user?.role);

    const wrong = await call("/api/auth/password/signin", {
      body: { username: VENDOR_USERNAME, password: `${VENDOR_PASSWORD}-wrong`, role: "vendor" },
    });
    check("a wrong password is refused", wrong.status === 401, `HTTP ${wrong.status}`);

    const unknown = await call("/api/auth/password/signin", {
      body: { username: `nobody-${run}`, password: VENDOR_PASSWORD, role: "vendor" },
    });
    check("an unknown username is refused the same way", unknown.status === 401, `HTTP ${unknown.status}`);

    // Sign the extra session out again so it cannot outlive the run.
    await call("/api/auth/logout", { cookie, method: "POST" });
  }
  {
    const res = await call("/api/auth/google/start?role=traveller");
    check(
      "Google sign-in refuses cleanly when it is not configured",
      res.status === 503 || res.status === 307,
      `HTTP ${res.status}`
    );

    const badRole = await call("/api/auth/google/start?role=admin");
    check(
      "Google sign-in never offers an admin role",
      badRole.status === 400 || badRole.status === 503,
      `HTTP ${badRole.status}`
    );

    const bridge = await call("/api/auth/clerk/bridge", { body: { role: "traveller" } });
    check(
      "the Clerk bridge refuses without a Clerk session",
      bridge.status === 401 || bridge.status === 503,
      `HTTP ${bridge.status}`
    );

    const bridgeAdmin = await call("/api/auth/clerk/bridge", { body: { role: "admin" } });
    check(
      "the Clerk bridge never mints an admin",
      bridgeAdmin.status === 400 || bridgeAdmin.status === 401 || bridgeAdmin.status === 403 || bridgeAdmin.status === 503,
      `HTTP ${bridgeAdmin.status}`
    );
  }

  // ---------- the rest of the public site ----------
  console.log("\nRemaining public pages");
  {
    const pages: Array<[string, string]> = [
      ["/en/planner", "the planner page"],
      ["/en/inquiry", "the enquiry page"],
      ["/en/destinations", "the destinations index"],
      ["/en/vendors", "the become-a-provider page"],
      ["/en/about", "the about page"],
      ["/en/faq", "the FAQ"],
      ["/en/privacy", "the privacy policy"],
      ["/en/terms", "the terms"],
    ];
    for (const [path, name] of pages) {
      const res = await call(path);
      check(`${name} renders`, res.status === 200, `HTTP ${res.status}`);
    }
  }
  {
    const [region] = (await db.execute(sql`
      select slug from region where slug is not null order by slug limit 1
    `).catch(() => [[]] as unknown)) as unknown as [{ slug: string } | undefined];
    if (region?.slug) {
      const res = await call(`/en/destinations/${region.slug}`);
      check("a destination page renders", res.status === 200, `HTTP ${res.status}`);
    }

    const [slug] = (await db.execute(sql`
      select slug from vendor where verification_status = 'verified' and slug is not null limit 1
    `)) as unknown as [{ slug: string } | undefined];
    if (slug?.slug) {
      const res = await call(`/en/providers/${slug.slug}`);
      check("a verified provider's public profile renders", res.status === 200, `HTTP ${res.status}`);
    }

    const missing = await call("/en/providers/no-such-provider-anywhere");
    check("an unknown provider profile is a not-found", missing.status === 404, `HTTP ${missing.status}`);
  }

  // ---------- the money tail: escrow, payout queue, refund ----------
  //
  // Everything after capture. The provider is paid out of an escrow hold that
  // only an admin can release, and a refund has to beat the payout: money that
  // has already left cannot be pulled back by this platform, so the refund
  // must record a clawback rather than quietly rewrite the payout.
  console.log("\nEscrow, payout and refund");
  {
    const asTraveller = await call("/api/provider/payout-account", {
      cookie: sessionCookie,
      method: "PUT",
      body: { accountHolderName: "Not A Provider" },
    });
    check("a traveller cannot set a payout account", asTraveller.status === 403, `HTTP ${asTraveller.status}`);

    const invalid = await call("/api/provider/payout-account", {
      cookie: vendorCookie,
      method: "PUT",
      body: { bankName: "No holder name" },
    });
    check("a payout account without a holder name is refused", invalid.status === 400, `HTTP ${invalid.status}`);

    const res = await call("/api/provider/payout-account", {
      cookie: vendorCookie,
      method: "PUT",
      body: {
        accountHolderName: `E2E Payout ${run}`,
        bankName: "Bank Central Asia",
        bankCountry: "Indonesia",
        currency: "IDR",
        maskedAccount: "****4321",
      },
    });
    check("a provider can set its payout account", res.status === 200, `HTTP ${res.status}`);

    const read = await call("/api/provider/payout-account", { cookie: vendorCookie });
    const body = await json(read);
    check(
      "and read it back",
      read.status === 200 && body?.data?.payoutAccount?.accountHolderName === `E2E Payout ${run}`,
      `HTTP ${read.status}`
    );
  }
  {
    // Capture the accepted offer. The payout account was set first on purpose:
    // the escrow row is written during capture and links to whatever payout
    // account exists at that moment.
    const orderId = `order_e2e_offer_${run}`;
    const paymentId = `pay_e2e_offer_${run}`;
    await db.execute(sql`
      insert into payment (
        booking_id, provider, provider_order_id, amount, currency, purpose, status, idempotency_key, initiated_by
      )
      select
        b.id, 'razorpay', ${orderId}, b.gross_amount, b.currency, 'full', 'created',
        ${`e2e-offer-verify-${run}`}, a.id
      from booking b
      join traveller t on t.id = b.traveller_id
      join account a on a.id = t.account_id
      where b.id = ${offerBookingId}
    `);
    const signature = razorpayPaymentSignature(orderId, paymentId, E2E_RAZORPAY_KEY_SECRET);
    const res = await call("/api/payments/verify", {
      cookie: sessionCookie,
      body: {
        bookingId: offerBookingId,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
    });
    const body = await json(res);
    check(
      "a signed verify captures the offer booking",
      res.status === 200 && body?.data?.status === "captured",
      `HTTP ${res.status} status=${body?.data?.status}`
    );

    const [row] = (await db.execute(sql`
      select d.id, d.status, d.hold_reason, d.net_amount, d.commission_amount, d.gross_amount,
             d.payout_account_id, d.vendor_currency, d.payment_id
      from payment_disbursement d
      where d.booking_id = ${offerBookingId}
    `)) as unknown as [
      | {
          id: string;
          status: string;
          hold_reason: string | null;
          net_amount: number;
          commission_amount: number;
          gross_amount: number;
          payout_account_id: string | null;
          vendor_currency: string;
          payment_id: string;
        }
      | undefined,
    ];
    disbursementId = row?.id ?? "";
    offerPaymentId = row?.payment_id ?? "";
    check("capture opens an escrow hold for the provider", Boolean(disbursementId) && row?.status === "held", row?.status);
    check("the hold says what it is waiting for", Boolean(row?.hold_reason), row?.hold_reason ?? "none");
    check("the escrow row links to the payout account set beforehand", Boolean(row?.payout_account_id));
    check("the provider is owed in its own currency", row?.vendor_currency === "IDR", row?.vendor_currency);
    check(
      "escrow splits the same way the booking does",
      Number(row?.commission_amount) + Number(row?.net_amount) === Number(row?.gross_amount),
      `${row?.commission_amount} + ${row?.net_amount} = ${row?.gross_amount}`
    );

    const thread = await call(`/api/messages?threadId=${bidThreadId}`, { cookie: sessionCookie });
    const threadBody = await json(thread);
    check(
      "a confirmed booking unmasks the thread",
      threadBody?.data?.unmasked === true,
      `unmasked=${threadBody?.data?.unmasked}`
    );
  }
  {
    const anon = await call("/api/admin/disbursements");
    check("the payout queue is not readable anonymously", anon.status === 401, `HTTP ${anon.status}`);

    const asVendor = await call("/api/admin/disbursements", { cookie: vendorCookie });
    check("a provider cannot read the payout queue", asVendor.status === 403, `HTTP ${asVendor.status}`);

    const asTraveller = await call("/api/admin/disbursements", { cookie: sessionCookie });
    check("nor can a traveller", asTraveller.status === 403, `HTTP ${asTraveller.status}`);

    const res = await call("/api/admin/disbursements", { cookie: adminCookie });
    const body = await json(res);
    const rows: Array<{ id: string; status: string; businessName: string | null }> = body?.data?.disbursements ?? [];
    check("an admin can read the payout queue", res.status === 200, `HTTP ${res.status}`);
    const mine = rows.find((d) => d.id === disbursementId);
    check("the new hold is on the queue", Boolean(mine), mine ? `${mine.businessName} ${mine.status}` : "not listed");
  }
  {
    const asVendor = await call(`/api/admin/disbursements/${disbursementId}`, {
      cookie: vendorCookie,
      method: "PATCH",
      body: { action: "approve" },
    });
    check("a provider cannot approve its own payout", asVendor.status === 403, `HTTP ${asVendor.status}`);

    const badAction = await call(`/api/admin/disbursements/${disbursementId}`, {
      cookie: adminCookie,
      method: "PATCH",
      body: { action: "send_it" },
    });
    check("an unknown payout action is refused", badAction.status === 400, `HTTP ${badAction.status}`);

    const missing = await call("/api/admin/disbursements/00000000-0000-0000-0000-000000000000", {
      cookie: adminCookie,
      method: "PATCH",
      body: { action: "approve" },
    });
    check("patching an unknown payout is a not-found", missing.status === 404, `HTTP ${missing.status}`);

    const tooEarly = await call(`/api/admin/disbursements/${disbursementId}`, {
      cookie: adminCookie,
      method: "PATCH",
      body: { action: "mark_paid" },
    });
    check("money cannot be marked paid straight out of escrow", tooEarly.status === 409, `HTTP ${tooEarly.status}`);
  }
  {
    const res = await call(`/api/admin/disbursements/${disbursementId}`, {
      cookie: adminCookie,
      method: "PATCH",
      body: { action: "release_hold" },
    });
    const body = await json(res);
    check(
      "an admin can release the escrow hold",
      res.status === 200 && body?.data?.disbursement?.status === "pending",
      `HTTP ${res.status} status=${body?.data?.disbursement?.status}`
    );
    check("releasing clears the hold reason", body?.data?.disbursement?.holdReason === null);

    const again = await call(`/api/admin/disbursements/${disbursementId}`, {
      cookie: adminCookie,
      method: "PATCH",
      body: { action: "release_hold" },
    });
    check("a hold cannot be released twice", again.status === 409, `HTTP ${again.status}`);
  }
  {
    const res = await call(`/api/admin/disbursements/${disbursementId}`, {
      cookie: adminCookie,
      method: "PATCH",
      body: { action: "approve" },
    });
    const body = await json(res);
    check(
      "an admin can approve the payout",
      res.status === 200 && body?.data?.disbursement?.status === "approved",
      `HTTP ${res.status} status=${body?.data?.disbursement?.status}`
    );

    const [row] = (await db.execute(sql`
      select d.approved_at, a.email
      from payment_disbursement d left join account a on a.id = d.approved_by
      where d.id = ${disbursementId}
    `)) as unknown as [{ approved_at: string | null; email: string | null } | undefined];
    check("the approval names the admin who made it", row?.email === ADMIN_EMAIL, row?.email ?? "unattributed");
    check("and when", Boolean(row?.approved_at));

    const [event] = (await db.execute(sql`
      select count(*)::int as n from payment_event
      where payment_id = ${offerPaymentId} and type = 'disbursement.approved'
    `)) as unknown as [{ n: number }];
    check("approving is written to the payment ledger", Number(event.n) === 1, `${event.n} rows`);
  }
  {
    const res = await call(`/api/admin/disbursements/${disbursementId}`, {
      cookie: adminCookie,
      method: "PATCH",
      body: { action: "mark_paid" },
    });
    const body = await json(res);
    check(
      "an admin can mark the payout paid",
      res.status === 200 && body?.data?.disbursement?.status === "paid",
      `HTTP ${res.status} status=${body?.data?.disbursement?.status}`
    );
    check(
      "a paid payout carries a payout reference",
      Boolean(body?.data?.disbursement?.providerPayoutId),
      body?.data?.disbursement?.providerPayoutId
    );

    const [event] = (await db.execute(sql`
      select count(*)::int as n from payment_event
      where payment_id = ${offerPaymentId} and type = 'disbursement.paid'
    `)) as unknown as [{ n: number }];
    check("paying is written to the payment ledger", Number(event.n) === 1, `${event.n} rows`);
  }
  {
    // Refund after the provider has already been paid.
    const asVendor = await call(`/api/admin/payments/${offerPaymentId}/refund`, { cookie: vendorCookie, body: {} });
    check("a provider cannot refund a traveller", asVendor.status === 403, `HTTP ${asVendor.status}`);

    const overRefund = await call(`/api/admin/payments/${offerPaymentId}/refund`, {
      cookie: adminCookie,
      body: { amount: 999_999_999 },
    });
    check("a refund larger than the payment is refused", overRefund.status === 409, `HTTP ${overRefund.status}`);

    const res = await call(`/api/admin/payments/${offerPaymentId}/refund`, { cookie: adminCookie, body: {} });
    const body = await json(res);
    check("an admin can refund the traveller in full", res.status === 200 && body?.data?.fully === true, `HTTP ${res.status}`);

    const [row] = (await db.execute(sql`
      select p.status as payment_status, p.refunded_amount, p.amount,
             b.status as booking_status, d.status as disbursement_status
      from payment p
      join booking b on b.id = p.booking_id
      left join payment_disbursement d on d.payment_id = p.id
      where p.id = ${offerPaymentId}
    `)) as unknown as [
      | {
          payment_status: string;
          refunded_amount: number;
          amount: number;
          booking_status: string;
          disbursement_status: string | null;
        }
      | undefined,
    ];
    check(
      "the payment is fully refunded",
      row?.payment_status === "refunded" && Number(row?.refunded_amount) === Number(row?.amount),
      `${row?.refunded_amount}/${row?.amount}`
    );
    check("the booking is refunded with it", row?.booking_status === "refunded", row?.booking_status);
    check("a payout already made is not silently rewritten", row?.disbursement_status === "paid", row?.disbursement_status ?? "none");

    const [event] = (await db.execute(sql`
      select count(*)::int as n from payment_event
      where payment_id = ${offerPaymentId} and type = 'disbursement.clawback_required'
    `)) as unknown as [{ n: number }];
    check("the clawback owed by the provider is recorded", Number(event.n) === 1, `${event.n} rows`);

    const twice = await call(`/api/admin/payments/${offerPaymentId}/refund`, { cookie: adminCookie, body: {} });
    check("a fully refunded payment cannot be refunded again", twice.status === 409, `HTTP ${twice.status}`);
  }
  {
    // The other order: refund while the money is still in escrow. Here the
    // platform can stop the payout, and must.
    const [before] = (await db.execute(sql`
      select id, status, payment_id from payment_disbursement where booking_id = ${marketplaceBookingId}
    `)) as unknown as [{ id: string; status: string; payment_id: string } | undefined];
    check(
      "the listing booking is still holding the provider's money",
      before?.status === "held",
      before?.status ?? "no escrow row"
    );

    if (before?.payment_id) {
      const res = await call(`/api/admin/payments/${before.payment_id}/refund`, { cookie: adminCookie, body: {} });
      check("an admin can refund before the payout leaves", res.status === 200, `HTTP ${res.status}`);

      const [after] = (await db.execute(sql`
        select status, failure_code from payment_disbursement where id = ${before.id}
      `)) as unknown as [{ status: string; failure_code: string | null } | undefined];
      check("the pending payout is cancelled rather than paid", after?.status === "failed", after?.status);
      check("and it records why", after?.failure_code === "refund_before_payout", after?.failure_code ?? "no code");
    }
  }

  // ---------- booking, seat inventory and the price boundary ----------
  //
  // Run while the session is still live, because a booking without a signed-in
  // account is refused by design.
  console.log("\nBooking and seat inventory");
  {
    const res = await call("/api/bookings", {
      body: { departureId: "00000000-0000-0000-0000-000000000000", pax: 1, protocol: "vegetarian",
              travellers: [{ fullName: "Anonymous Test" }] },
    });
    check("an anonymous booking is refused", res.status === 401, `HTTP ${res.status}`);
  }
  {
    const res = await call("/api/bookings", {
      body: {
        listingId: "00000000-0000-4000-8000-000000000000",
        serviceDate: "2030-01-15",
        pax: 1,
        protocol: "vegetarian",
        travellers: [{ fullName: "Anonymous Listing" }],
      },
    });
    check("an anonymous listing booking is refused", res.status === 401, `HTTP ${res.status}`);
  }

  const [dep] = (await db.execute(sql`
    select d.id, d.price_amount, d.seats_total, d.seats_held, d.seats_booked
    from departure d
    join package p on p.id = d.package_id
    where d.status = 'open' and p.status = 'published'
      and d.seats_total - d.seats_held - d.seats_booked >= 3
    order by d.start_date asc limit 1
  `)) as unknown as [
    { id: string; price_amount: string; seats_total: number; seats_held: number; seats_booked: number } | undefined
  ];

  if (!check("a bookable departure exists", Boolean(dep))) {
    console.log("  (skipping the booking checks — seed the catalogue first)");
  } else {
    bookedDepartureId = dep!.id;
    const unitPrice = Number(dep!.price_amount);
    const heldBefore = Number(dep!.seats_held);

    {
      const res = await call("/api/bookings", {
        cookie: sessionCookie,
        body: {
          departureId: dep!.id,
          pax: 2,
          protocol: "jain",
          travellers: [{ fullName: "One" }, { fullName: "Two" }, { fullName: "Three" }],
        },
      });
      check("more names than the group size is refused",
        res.status === 400, `HTTP ${res.status}`);
    }

    {
      const res = await call("/api/bookings", {
        cookie: sessionCookie,
        body: {
          departureId: dep!.id,
          pax: 2,
          rooms: 1,
          protocol: "jain",
          // The client tries to set its own price. It must be ignored — Zod
          // strips it, and nothing downstream would read it anyway.
          grossAmount: 1,
          amount: 1,
          travellers: [
            { fullName: `E2E Lead ${run}`, age: 40, dietaryNotes: "Jain, no root vegetables" },
            { fullName: `E2E Companion ${run}`, age: 38 },
          ],
        },
      });
      const body = await json(res);
      check("a complete booking is accepted", res.status === 201 && body?.success === true, `HTTP ${res.status}`);
      check("it returns a reference", /^O2B-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(body?.data?.reference ?? ""),
        body?.data?.reference);
      check("the amount is computed on the server, not taken from the client",
        body?.data?.grossAmount === unitPrice * 2, `${body?.data?.grossAmount} vs ${unitPrice * 2}`);
      check("the seats are held for a limited time",
        Boolean(body?.data?.holdExpiresAt) && new Date(body.data.holdExpiresAt).getTime() > Date.now(),
        body?.data?.holdExpiresAt);

      const [row] = (await db.execute(sql`
        select status, gross_amount, commission_amount, net_amount, pax
        from booking where reference = ${body?.data?.reference ?? ""}
      `)) as unknown as [
        { status: string; gross_amount: string; commission_amount: string; net_amount: string; pax: number } | undefined
      ];
      check("the booking is stored awaiting payment", row?.status === "pending_payment", row?.status);
      check("the stored amount ignores the client's number",
        Boolean(row) && Number(row!.gross_amount) === unitPrice * 2, row?.gross_amount);
      check("commission and net add back up to the gross",
        Boolean(row) && Number(row!.commission_amount) + Number(row!.net_amount) === Number(row!.gross_amount));

      const [after] = (await db.execute(sql`
        select seats_held from departure where id = ${dep!.id}
      `)) as unknown as [{ seats_held: number }];
      check("the seats leave available inventory", Number(after.seats_held) === heldBefore + 2,
        `${after.seats_held} held, was ${heldBefore}`);

      const [holds] = (await db.execute(sql`
        select count(*)::int as n from seat_hold where departure_id = ${dep!.id} and expires_at > now()
      `)) as unknown as [{ n: number }];
      check("a live seat hold exists", Number(holds.n) >= 1, `${holds.n} holds`);
    }

    {
      // More seats than the departure can possibly have. The check constraint
      // `departure_seats_sane` is the backstop; this proves the application
      // refuses before it gets there, with a useful answer rather than a 500.
      const res = await call("/api/bookings", {
        cookie: sessionCookie,
        body: {
          departureId: dep!.id,
          pax: 30,
          protocol: "vegetarian",
          travellers: Array.from({ length: 30 }, (_, i) => ({ fullName: `E2E Overflow ${run} ${i}` })),
        },
      });
      const body = await json(res);
      check("a departure cannot be oversold", res.status === 409, `HTTP ${res.status}`);
      check("and it says how many seats are actually left",
        typeof body?.data?.seatsAvailable === "number", String(body?.data?.seatsAvailable));
    }
  }

  // ---------- signing out actually invalidates ----------
  console.log("\nSign-out");
  {
    const res = await call("/api/auth/logout", { method: "POST", cookie: sessionCookie });
    check("logout succeeds", res.status === 200, `HTTP ${res.status}`);

    const [row] = (await db.execute(sql`
      select count(*)::int as n from session where token_hash = ${hashSessionToken(token)}
    `)) as unknown as [{ n: number }];
    check("the session row is deleted, not just the cookie", Number(row.n) === 0);
  }
  {
    const res = await call("/api/auth/session", { cookie: sessionCookie });
    const body = await json(res);
    check("the old cookie no longer authenticates", body?.data?.user === null);
  }
  {
    const res = await call("/en/account", { cookie: sessionCookie });
    check(
      "the account page is guarded again",
      [307, 308].includes(res.status),
      `HTTP ${res.status}`
    );
  }

  // ---------- flooding is refused ----------
  console.log("\nAbuse resistance");
  {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await call("/api/auth/request-otp", { body: { email: FLOOD_EMAIL }, ip: IP_FLOOD });
      statuses.push(res.status);
    }
    const first5 = statuses.slice(0, 5).every((s) => s === 200);
    const sixth = statuses[5];
    check("five codes to one address are allowed", first5, statuses.slice(0, 5).join(","));
    check("the sixth is throttled", sixth === 429, `HTTP ${sixth}`);

    // The counter must be in Postgres, not in one lambda's memory — that was
    // the defect. If this row is missing, the limit is per-instance again.
    const [row] = (await db.execute(sql`
      select count from rate_limit where key = ${`otp:id:email:${FLOOD_EMAIL}`}
    `)) as unknown as [{ count: number } | undefined];
    check("the counter is shared, not per-instance", Boolean(row), row ? `count=${row.count}` : "no row in rate_limit");
  }

  await cleanup();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

/** Everything this run created, keyed to identifiers no real user can hold. */
async function cleanup() {
  /**
   * Bookings first. `booking.trip_request_id` is ON DELETE RESTRICT, so
   * deleting the account would otherwise fail rather than cascade — which is
   * the correct rule for real data and a trap for a test that ignores it.
   */
  await db.execute(sql`
    delete from payment_disbursement where booking_id in (
      select b.id from booking b
      join traveller t on t.id = b.traveller_id
      join account a on a.id = t.account_id
      where a.email = ${EMAIL})
  `);
  await db.execute(sql`
    delete from payment_event where payment_id in (
      select p.id from payment p
      join booking b on b.id = p.booking_id
      join traveller t on t.id = b.traveller_id
      join account a on a.id = t.account_id
      where a.email = ${EMAIL})
  `);
  await db.execute(sql`
    delete from payment where booking_id in (
      select b.id from booking b
      join traveller t on t.id = b.traveller_id
      join account a on a.id = t.account_id
      where a.email = ${EMAIL})
  `);
  await db.execute(sql`
    delete from booking where traveller_id in (
      select t.id from traveller t
      join account a on a.id = t.account_id
      where a.email = ${EMAIL})
  `);
  await db.execute(sql`
    delete from seat_hold where trip_request_id in (
      select tr.id from trip_request tr
      join traveller t on t.id = tr.traveller_id
      join account a on a.id = t.account_id
      where a.email = ${EMAIL})
  `);
  await db.execute(sql`
    delete from trip_request where traveller_id in (
      select t.id from traveller t
      join account a on a.id = t.account_id
      where a.email = ${EMAIL})
  `);
  if (bookedDepartureId) {
    // Recomputed from the holds that remain rather than decremented by what
    // this run took, so a half-finished run cannot leave the count drifting.
    await db.execute(sql`
      update departure d set seats_held = coalesce((
        select sum(h.seats) from seat_hold h
        where h.departure_id = d.id and h.expires_at > now()), 0)
      where d.id = ${bookedDepartureId}
    `);
  }

  await db.execute(sql`delete from account where email in (${EMAIL}, ${VENDOR_EMAIL}, ${ADMIN_EMAIL}, ${APPLICANT_EMAIL})`);
  await db.execute(sql`delete from otp_code where identifier in (${`email:${EMAIL}`}, ${`email:${FLOOD_EMAIL}`}, ${`mobile:${MOBILE}`})`);
  await db.execute(sql`delete from lead where name = ${`E2E ${run}`}`);
  await db.execute(sql`delete from vendor_application where business_name in (${`E2E Kitchen ${run}`}, ${APPLICANT_BUSINESS})`);
  await db.execute(sql`delete from rate_limit where key like ${`%${IP_MAIN}`} or key like ${`%${IP_FLOOD}`}`);
  await db.execute(sql`delete from rate_limit where key = ${`otp:id:email:${FLOOD_EMAIL}`} or key = ${`otp:id:email:${EMAIL}`}`);

  const [left] = (await db.execute(sql`
    select
      (select count(*) from account where email in (${EMAIL}, ${FLOOD_EMAIL}, ${VENDOR_EMAIL}, ${ADMIN_EMAIL}, ${APPLICANT_EMAIL}))
    + (select count(*) from lead where name = ${`E2E ${run}`})
    + (select count(*) from vendor_application where business_name in (${`E2E Kitchen ${run}`}, ${APPLICANT_BUSINESS}))
    + (select count(*) from service_listing where title = ${MARKETPLACE_LISTING})
    + (select count(*) from booking_traveller where full_name like ${`E2E %${run}%`})
    + (select count(*) from offer where title like ${`E2E %${run}%`})
    + (select count(*) from otp_code where identifier = ${`mobile:${MOBILE}`}) as n
  `)) as unknown as [{ n: number }];
  check("the test leaves nothing behind", Number(left.n) === 0, `${left.n} rows remain`);
}

main().catch(async (e) => {
  console.error("\nend-to-end run aborted:", e instanceof Error ? e.message : e);
  await cleanup().catch(() => {});
  process.exit(1);
});
