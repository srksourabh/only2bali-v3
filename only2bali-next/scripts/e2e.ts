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
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { SESSION_COOKIE } from "../lib/auth";
import { hashSessionToken } from "../lib/auth/crypto";

const BASE = (process.env.E2E_BASE_URL ?? "").replace(/\/$/, "");
const SERVER_LOG = process.env.E2E_SERVER_LOG ?? "";

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

let sessionCookie = "";
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
    signal: AbortSignal.timeout(60_000),
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
  const paths = ["/en", "/hi", "/en/account", "/en/packages/none", "/api/auth/session"];
  await Promise.all(paths.map((p) => call(p).catch(() => null)));
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
  }
  {
    const res = await call("/en");
    const html = await res.text();
    check("the English homepage renders", res.status === 200, `HTTP ${res.status}`);
    check("it declares itself English", /<html[^>]*lang="en"/.test(html));

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
        body: { departureId: dep!.id, pax: 3, protocol: "jain", travellers: [{ fullName: "Only One Name" }] },
      });
      check("a group size that disagrees with the traveller list is refused",
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

  await db.execute(sql`delete from account where email = ${EMAIL}`);
  await db.execute(sql`delete from otp_code where identifier in (${`email:${EMAIL}`}, ${`email:${FLOOD_EMAIL}`})`);
  await db.execute(sql`delete from lead where name = ${`E2E ${run}`}`);
  await db.execute(sql`delete from vendor_application where business_name = ${`E2E Kitchen ${run}`}`);
  await db.execute(sql`delete from rate_limit where key like ${`%${IP_MAIN}`} or key like ${`%${IP_FLOOD}`}`);
  await db.execute(sql`delete from rate_limit where key = ${`otp:id:email:${FLOOD_EMAIL}`} or key = ${`otp:id:email:${EMAIL}`}`);

  const [left] = (await db.execute(sql`
    select
      (select count(*) from account where email in (${EMAIL}, ${FLOOD_EMAIL}))
    + (select count(*) from lead where name = ${`E2E ${run}`})
    + (select count(*) from vendor_application where business_name = ${`E2E Kitchen ${run}`})
    + (select count(*) from booking_traveller where full_name like ${`E2E %${run}%`}) as n
  `)) as unknown as [{ n: number }];
  check("the test leaves nothing behind", Number(left.n) === 0, `${left.n} rows remain`);
}

main().catch(async (e) => {
  console.error("\nend-to-end run aborted:", e instanceof Error ? e.message : e);
  await cleanup().catch(() => {});
  process.exit(1);
});
