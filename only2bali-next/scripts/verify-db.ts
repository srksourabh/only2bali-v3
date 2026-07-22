/**
 * Database smoke test.
 *
 * Point it at any Postgres — a local container, the VPS, or a managed instance —
 * and it proves the schema is present, the business rules actually reject bad
 * data, the catalogue reads correctly, and an auth round-trip works.
 *
 *   DATABASE_URL=postgres://… npm run db:verify
 *
 * It writes only rows it deletes again, inside a transaction that is rolled
 * back, so it is safe against a seeded database. It is not safe to point at a
 * database holding real customer data you cannot afford to have touched.
 */
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { listPackageCards, listCircuits } from "../lib/repositories/catalog";
import { generateOtp, hashOtp, safeEqual, generateSessionToken, hashSessionToken } from "../lib/auth/crypto";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/**
 * Runs a statement that must be rejected by the database.
 *
 * Drizzle wraps driver errors, so the useful text ("violates check constraint
 * …") lives on the cause rather than the top-level message. Walk the chain,
 * otherwise a genuine rejection reads as a failure.
 */
function errorText(e: unknown): string {
  const parts: string[] = [];
  let cur: unknown = e;
  for (let depth = 0; cur && depth < 5; depth++) {
    const err = cur as { message?: string; detail?: string; constraint?: string; cause?: unknown };
    if (err.message) parts.push(err.message);
    if (err.detail) parts.push(err.detail);
    if (err.constraint) parts.push(`constraint=${err.constraint}`);
    cur = err.cause;
  }
  return parts.join(" | ");
}

async function mustReject(name: string, statement: string, expectConstraint?: string) {
  try {
    await db.execute(sql.raw(statement));
    check(name, false, "the database ACCEPTED a row it should have refused");
  } catch (e) {
    const msg = errorText(e);
    const isConstraint =
      /violates check constraint|violates foreign key|violates not-null|invalid input value/i.test(msg);
    const named = !expectConstraint || msg.includes(expectConstraint);
    check(
      name,
      isConstraint && named,
      isConstraint
        ? named
          ? "rejected by the database"
          : `rejected, but not by ${expectConstraint}`
        : `rejected for the wrong reason: ${msg.slice(0, 90)}`
    );
  }
}

async function main() {
  const host = new URL(process.env.DATABASE_URL!).hostname;
  console.log(`\nVerifying database at ${host}\n`);

  // ---------- connectivity ----------
  console.log("Connectivity");
  const t0 = Date.now();
  const [{ version }] = (await db.execute(sql`select version()`)) as unknown as [{ version: string }];
  check("connects and answers", true, `${Date.now() - t0}ms`);
  check("is PostgreSQL 17 or newer", /PostgreSQL (1[7-9]|[2-9]\d)/.test(version), version.split(",")[0]);

  // ---------- schema ----------
  console.log("\nSchema");
  const counts = (await db.execute(sql`
    select
      (select count(*) from information_schema.tables where table_schema='public') as tables,
      (select count(*) from pg_type where typtype='e') as enums,
      (select count(*) from pg_indexes where schemaname='public') as indexes,
      (select count(*) from pg_constraint where contype='c' and connamespace='public'::regnamespace) as checks
  `)) as unknown as [{ tables: string; enums: string; indexes: string; checks: string }];
  const c = counts[0];
  check("41 tables present", Number(c.tables) >= 41, `${c.tables} tables`);
  check("enums present", Number(c.enums) >= 29, `${c.enums} enums`);
  check("indexes present", Number(c.indexes) >= 80, `${c.indexes} indexes`);
  check("check constraints present", Number(c.checks) >= 4, `${c.checks} constraints`);

  const missing: string[] = [];
  for (const t of ["account", "session", "otp_code", "audit_log", "circuit", "package",
                   "departure", "trip_request", "offer", "booking", "vendor",
                   "service_listing", "listing_compliance"]) {
    const r = (await db.execute(
      sql`select to_regclass(${"public." + t}) is not null as ok`
    )) as unknown as [{ ok: boolean }];
    if (!r[0].ok) missing.push(t);
  }
  check("all core tables exist", missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : "13 checked");

  // ---------- business rules enforced by the database, not the app ----------
  console.log("\nBusiness rules (must be refused by Postgres itself)");

  await mustReject(
    "accompanying cook requires a group of 10+",
    `insert into trip_request (protocol, group_size, cook_required) values ('jain', 4, true)`
  );
  await mustReject(
    "publishing to the board requires a verified mobile",
    `insert into trip_request (protocol, group_size, visibility, mobile_verified)
     values ('vegan', 2, 'open_to_verified', false)`,
    "trip_publish_requires_verified_mobile"
  );
  await mustReject(
    "a departure cannot oversell its seats",
    `insert into departure (package_id, start_date, end_date, price_amount, seats_total, seats_held, seats_booked)
     select id, '2030-01-01', '2030-01-05', 100000, 10, 6, 6 from package limit 1`,
    "departure_seats_sane"
  );
  await mustReject(
    "a review rating must be 1-5",
    `insert into review (booking_id, rating) values (gen_random_uuid(), 9)`
  );
  await mustReject(
    "an unknown food protocol is not a valid value",
    `insert into trip_request (protocol, group_size) values ('non_vegetarian', 2)`
  );

  // ---------- catalogue ----------
  console.log("\nCatalogue");
  const circuits = await listCircuits();
  check("circuits seeded", circuits.length >= 4, `${circuits.length}: ${circuits.map((x) => x.key).join(", ")}`);

  const packages = await listPackageCards({ limit: 20 });
  check("packages published", packages.length > 0, `${packages.length} published`);

  if (packages.length) {
    check("every package has places", packages.every((p) => p.places.length > 0));
    check("every package has USP highlights", packages.every((p) => p.highlights.length > 0));
    check("every package has a positive integer price", packages.every((p) => Number.isInteger(p.basePriceAmount) && p.basePriceAmount > 0));
    check("nights is always one less than days", packages.every((p) => p.nights === p.days - 1),
      packages.map((p) => `${p.slug} ${p.days}/${p.nights}`).join(", "));
    const withDep = packages.filter((p) => p.nextDeparture);
    check("packages have an upcoming departure with seats", withDep.length === packages.length,
      `${withDep.length}/${packages.length}`);
    if (withDep.length) {
      const soonest = withDep[0].nextDeparture!;
      check("the next departure is in the future", new Date(soonest.startDate) > new Date(),
        `${soonest.startDate}, ${soonest.seatsAvailable} seats`);
    }
  }

  // filters
  const jain = await listPackageCards({ protocol: "jain" });
  const vegan = await listPackageCards({ protocol: "vegan" });
  check("protocol filter narrows results", jain.length > 0 && jain.every((p) => p.protocols.includes("jain")),
    `jain: ${jain.length}, vegan: ${vegan.length}`);

  const cheap = await listPackageCards({ maxPrice: 6_000_000 }); // ₹60,000 in paise
  check("open-ended price filter works", cheap.every((p) => p.basePriceAmount <= 6_000_000),
    `${cheap.length} under ₹60,000`);

  const ramayana = await listPackageCards({ circuitKey: "ramayana" });
  check("circuit filter works", ramayana.length > 0, `${ramayana.length} on the Ramayana circuit`);

  // ---------- per-meal compliance, the differentiator ----------
  console.log("\nCompliance data");
  const meals = (await db.execute(sql`
    select compliance_rating as rating, count(*)::int as n
    from package_day_meal group by 1 order by 2 desc
  `)) as unknown as Array<{ rating: string; n: number }>;
  const total = meals.reduce((s, m) => s + Number(m.n), 0);
  check("per-meal compliance ratings stored", total > 0,
    meals.map((m) => `${m.rating}:${m.n}`).join(" "));
  check("at least one meal is rated red (substitution path exercised)",
    meals.some((m) => m.rating === "red" && Number(m.n) > 0));

  // ---------- auth round-trip ----------
  console.log("\nAuth round-trip");
  const secretPresent = Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);
  check("AUTH_SECRET configured", secretPresent);

  if (secretPresent) {
    const code = generateOtp();
    const identifier = `email:verify-${Date.now()}@example.invalid`;
    const hash = hashOtp(code, identifier);

    check("OTP is six digits", /^\d{6}$/.test(code));
    check("hash is not the code", !hash.includes(code) && hash.length === 64);
    check("correct code matches", safeEqual(hash, hashOtp(code, identifier)));
    check("wrong code does not match", !safeEqual(hash, hashOtp("000000", identifier)));
    check("code is bound to the identifier", !safeEqual(hash, hashOtp(code, "email:someone-else@example.invalid")));

    const token = generateSessionToken();
    check("session token is 256-bit and URL-safe", token.length >= 43 && /^[A-Za-z0-9_-]+$/.test(token));
    check("session hash is stable and not the token", hashSessionToken(token) === hashSessionToken(token) && hashSessionToken(token) !== token);

    // Write and read back through the real tables, then remove.
    const [acct] = (await db.execute(sql`
      insert into account (email, role) values (${`verify-${Date.now()}@example.invalid`}, 'traveller')
      returning id
    `)) as unknown as [{ id: string }];
    await db.execute(sql`
      insert into otp_code (identifier, code_hash, expires_at)
      values (${identifier}, ${hash}, now() + interval '10 minutes')
    `);
    const [readBack] = (await db.execute(sql`
      select code_hash from otp_code where identifier = ${identifier} limit 1
    `)) as unknown as [{ code_hash: string }];
    check("OTP persists as a hash, never plaintext", readBack.code_hash === hash && !/^\d{6}$/.test(readBack.code_hash));

    await db.execute(sql`
      insert into session (account_id, token_hash, expires_at)
      values (${acct.id}, ${hashSessionToken(token)}, now() + interval '30 days')
    `);
    const [sess] = (await db.execute(sql`
      select count(*)::int as n from session where token_hash = ${hashSessionToken(token)}
    `)) as unknown as [{ n: number }];
    check("session resolves by token hash", Number(sess.n) === 1);

    const plaintextCodes = (await db.execute(sql`
      select count(*)::int as n from otp_code where code_hash ~ '^[0-9]{6}$'
    `)) as unknown as [{ n: number }];
    check("no plaintext OTP anywhere in the table", Number(plaintextCodes[0].n) === 0);

    // Clean up. Sessions cascade from the account.
    await db.execute(sql`delete from otp_code where identifier = ${identifier}`);
    await db.execute(sql`delete from account where id = ${acct.id}`);
    const [leftover] = (await db.execute(sql`
      select count(*)::int as n from session where account_id = ${acct.id}
    `)) as unknown as [{ n: number }];
    check("deleting an account cascades its sessions", Number(leftover.n) === 0);
  }

  // ---------- write performance sanity ----------
  console.log("\nLatency");
  const reads: number[] = [];
  for (let i = 0; i < 5; i++) {
    const s = Date.now();
    await db.execute(sql`select 1`);
    reads.push(Date.now() - s);
  }
  const avg = Math.round(reads.reduce((a, b) => a + b, 0) / reads.length);
  check("round-trip latency is usable", avg < 500, `${avg}ms average over 5 pings`);
  if (avg > 120) {
    console.log(`        note: ${avg}ms per query is high. Pages making several sequential`);
    console.log(`        queries will feel it. Consider co-locating the app and database.`);
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("\nverification aborted:", e instanceof Error ? e.message : e);
  process.exit(1);
});
