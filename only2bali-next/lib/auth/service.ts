import { and, eq, gt, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { uniqueConstraintName } from "@/lib/db/unique-violation";
import { account, otpCode, session, auditLog, traveller, vendor, oauthAccount } from "@/lib/db/schema";
import {
  generateOtp, hashOtp, safeEqual, generateSessionToken, hashSessionToken, hashPassword, verifyPassword,
} from "./crypto";
import { deliverOtp } from "./delivery";
import type { PasswordSignInInput, PasswordSignUpInput } from "@/lib/validators/auth";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const SESSION_TTL_DAYS = 30;

export type VerifyFailure =
  | "no_code"        // nothing outstanding for this identifier
  | "expired"
  | "locked"         // too many wrong attempts
  | "invalid";       // wrong code

export type VerifyResult =
  | { ok: true; accountId: string; token: string; expiresAt: Date; isNewAccount: boolean }
  | { ok: false; reason: VerifyFailure };

export type PasswordAuthResult =
  | { ok: true; accountId: string; token: string; expiresAt: Date; isNewAccount: boolean }
  | { ok: false; reason: "invalid" | "role_mismatch" | "username_taken" | "email_taken" };

interface Identifier {
  email?: string;
  mobile?: string;
}

function identifierKey(id: Identifier): string {
  return id.email ? `email:${id.email}` : `mobile:${id.mobile}`;
}

/**
 * Issues a code and sends it.
 *
 * Callers must not vary their response based on whether the account exists —
 * doing so turns this endpoint into an account-enumeration oracle. The return
 * value carries no such signal on purpose.
 */
export async function requestOtp(
  id: Identifier,
  meta: { ip?: string; userAgent?: string } = {}
): Promise<{ issued: true }> {
  const key = identifierKey(id);
  const code = generateOtp();

  // Supersede anything still outstanding, so a second request invalidates the
  // first rather than leaving two valid codes in flight.
  await db
    .update(otpCode)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpCode.identifier, key), isNull(otpCode.consumedAt)));

  await db.insert(otpCode).values({
    identifier: key,
    codeHash: hashOtp(code, key),
    purpose: "login",
    maxAttempts: OTP_MAX_ATTEMPTS,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  await deliverOtp(id, code);
  return { issued: true };
}

/**
 * Verifies a code and, on success, creates the account if it is new and opens a
 * session.
 *
 * Attempts are counted against the stored row, so guessing is bounded regardless
 * of how the caller distributes its requests.
 */
export async function verifyOtp(
  id: Identifier,
  code: string,
  meta: { ip?: string; userAgent?: string } = {}
): Promise<VerifyResult> {
  const key = identifierKey(id);

  const [row] = await db
    .select()
    .from(otpCode)
    .where(and(eq(otpCode.identifier, key), isNull(otpCode.consumedAt)))
    .orderBy(sql`${otpCode.createdAt} desc`)
    .limit(1);

  if (!row) return { ok: false, reason: "no_code" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.attempts >= row.maxAttempts) return { ok: false, reason: "locked" };

  if (!safeEqual(row.codeHash, hashOtp(code, key))) {
    await db
      .update(otpCode)
      .set({ attempts: row.attempts + 1 })
      .where(eq(otpCode.id, row.id));
    // A wrong guess that exhausts the budget locks immediately, not next time.
    return { ok: false, reason: row.attempts + 1 >= row.maxAttempts ? "locked" : "invalid" };
  }

  // Single use. Burn it before doing anything else.
  await db.update(otpCode).set({ consumedAt: new Date() }).where(eq(otpCode.id, row.id));

  const { accountId, isNewAccount } = await upsertAccount(id);
  const { token, expiresAt } = await createSession(accountId, meta);

  await db.insert(auditLog).values({
    accountId,
    action: isNewAccount ? "account.created" : "auth.login",
    resourceType: "account",
    resourceId: accountId,
    details: { channel: id.email ? "email" : "mobile" },
    ip: meta.ip,
  });

  return { ok: true, accountId, token, expiresAt, isNewAccount };
}

async function upsertAccount(id: Identifier): Promise<{ accountId: string; isNewAccount: boolean }> {
  const where = id.email ? eq(account.email, id.email) : eq(account.mobile, id.mobile!);
  const [existing] = await db.select().from(account).where(where).limit(1);

  if (existing) {
    await db
      .update(account)
      .set({
        lastLoginAt: new Date(),
        ...(id.email ? { emailVerifiedAt: new Date() } : { mobileVerifiedAt: new Date() }),
      })
      .where(eq(account.id, existing.id));
    return { accountId: existing.id, isNewAccount: false };
  }

  const [created] = await db
    .insert(account)
    .values({
      email: id.email,
      mobile: id.mobile,
      role: "traveller",
      lastLoginAt: new Date(),
      emailVerifiedAt: id.email ? new Date() : null,
      mobileVerifiedAt: id.mobile ? new Date() : null,
    })
    .returning();

  // Every account starts as a traveller; vendor onboarding promotes the role.
  await db.insert(traveller).values({ accountId: created.id });

  return { accountId: created.id, isNewAccount: true };
}

function slugify(value: string): string {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return base || `provider-${Date.now()}`;
}

async function createTravellerIfMissing(accountId: string): Promise<void> {
  await db
    .insert(traveller)
    .values({ accountId })
    .onConflictDoNothing({ target: traveller.accountId });
}

async function createVendorIfMissing(accountId: string, businessName: string): Promise<void> {
  const base = slugify(businessName);
  let slug = base;
  for (let i = 0; i < 5; i++) {
    try {
      await db
        .insert(vendor)
        .values({
          accountId,
          slug,
          businessName,
          vendorType: "tour_agency",
          verificationStatus: "draft",
          onboardingStep: 1,
        })
        .onConflictDoNothing({ target: vendor.accountId });
      return;
    } catch (err) {
      if (i === 4) throw err;
      slug = `${base}-${i + 2}`;
    }
  }
}

export async function signUpWithPassword(
  input: PasswordSignUpInput,
  meta: { ip?: string; userAgent?: string } = {}
): Promise<PasswordAuthResult> {
  const existing = await db
    .select({ id: account.id })
    .from(account)
    .where(eq(account.username, input.username))
    .limit(1);
  if (existing.length) return { ok: false, reason: "username_taken" };

  if (input.email) {
    const taken = await db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.email, input.email))
      .limit(1);
    if (taken.length) return { ok: false, reason: "email_taken" };
  }

  let created: { id: string };
  try {
    const [row] = await db
      .insert(account)
      .values({
        username: input.username,
        passwordHash: hashPassword(input.password),
        email: input.email || null,
        role: input.role,
        emailVerifiedAt: null,
        lastLoginAt: new Date(),
      })
      .returning({ id: account.id });
    if (!row) throw new Error("Account insert returned no row.");
    created = row;
  } catch (err) {
    const constraint = uniqueConstraintName(err);
    if (constraint === "account_email_unique") return { ok: false, reason: "email_taken" };
    if (constraint === "account_username_unique") return { ok: false, reason: "username_taken" };
    throw err;
  }

  if (input.role === "vendor") {
    await createVendorIfMissing(created.id, input.businessName!);
  } else {
    await createTravellerIfMissing(created.id);
  }

  const { token, expiresAt } = await createSession(created.id, meta);
  await db.insert(auditLog).values({
    accountId: created.id,
    action: "account.password_created",
    resourceType: "account",
    resourceId: created.id,
    details: { role: input.role },
    ip: meta.ip,
  });

  return { ok: true, accountId: created.id, token, expiresAt, isNewAccount: true };
}

export async function signInWithPassword(
  input: PasswordSignInInput,
  meta: { ip?: string; userAgent?: string } = {}
): Promise<PasswordAuthResult> {
  const [row] = await db
    .select()
    .from(account)
    .where(or(eq(account.username, input.username), eq(account.email, input.username)))
    .limit(1);

  if (!row || row.status !== "active" || !verifyPassword(input.password, row.passwordHash)) {
    return { ok: false, reason: "invalid" };
  }
  if (row.role !== input.role) return { ok: false, reason: "role_mismatch" };

  await db.update(account).set({ lastLoginAt: new Date() }).where(eq(account.id, row.id));
  const { token, expiresAt } = await createSession(row.id, meta);
  await db.insert(auditLog).values({
    accountId: row.id,
    action: "auth.password_login",
    resourceType: "account",
    resourceId: row.id,
    details: { role: row.role },
    ip: meta.ip,
  });

  return { ok: true, accountId: row.id, token, expiresAt, isNewAccount: false };
}

/**
 * Link an external OAuth identity (Google, Clerk, …) to a Postgres account and
 * issue an `o2b_session`. App authorization stays on `account.role`.
 */
export async function signInWithOAuthProfile(
  profile: {
    provider: string;
    providerAccountId: string;
    email: string;
    name?: string | null;
  },
  role: "traveller" | "vendor",
  meta: { ip?: string; userAgent?: string } = {}
): Promise<PasswordAuthResult> {
  const email = profile.email.trim().toLowerCase();
  if (!email || !profile.providerAccountId) {
    return { ok: false, reason: "invalid" };
  }

  const linked = await db
    .select({ accountId: oauthAccount.accountId, role: account.role, status: account.status })
    .from(oauthAccount)
    .innerJoin(account, eq(oauthAccount.accountId, account.id))
    .where(
      and(
        eq(oauthAccount.provider, profile.provider),
        eq(oauthAccount.providerAccountId, profile.providerAccountId)
      )
    )
    .limit(1);

  let accountId = linked[0]?.accountId;
  let isNewAccount = false;

  if (linked[0] && (linked[0].role !== role || linked[0].status !== "active")) {
    return { ok: false, reason: linked[0].role !== role ? "role_mismatch" : "invalid" };
  }

  if (!accountId) {
    const existing = await db
      .select()
      .from(account)
      .where(eq(account.email, email))
      .limit(1);

    if (existing[0]) {
      if (existing[0].role !== role) return { ok: false, reason: "role_mismatch" };
      accountId = existing[0].id;
      await db
        .update(account)
        .set({ emailVerifiedAt: new Date(), lastLoginAt: new Date() })
        .where(eq(account.id, accountId));
    } else {
      const [created] = await db
        .insert(account)
        .values({
          email,
          role,
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        })
        .returning();
      accountId = created.id;
      isNewAccount = true;
    }

    await db
      .insert(oauthAccount)
      .values({
        accountId,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        email,
      })
      .onConflictDoNothing();
  } else {
    await db
      .update(account)
      .set({ lastLoginAt: new Date() })
      .where(eq(account.id, accountId));
  }

  if (role === "vendor") {
    await createVendorIfMissing(accountId, profile.name || email.split("@")[0]);
  } else {
    await createTravellerIfMissing(accountId);
  }

  const { token, expiresAt } = await createSession(accountId, meta);
  await db.insert(auditLog).values({
    accountId,
    action: `auth.${profile.provider}_login`,
    resourceType: "account",
    resourceId: accountId,
    details: { role, provider: profile.provider },
    ip: meta.ip,
  });

  return { ok: true, accountId, token, expiresAt, isNewAccount };
}

export async function signInWithGoogleProfile(
  profile: { providerAccountId: string; email: string; name?: string | null },
  role: "traveller" | "vendor",
  meta: { ip?: string; userAgent?: string } = {}
): Promise<PasswordAuthResult> {
  return signInWithOAuthProfile(
    {
      provider: "google",
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      name: profile.name,
    },
    role,
    meta
  );
}

export async function createSession(
  accountId: string,
  meta: { ip?: string; userAgent?: string }
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await db.insert(session).values({
    accountId,
    tokenHash: hashSessionToken(token),
    ip: meta.ip,
    userAgent: meta.userAgent,
    expiresAt,
  });

  return { token, expiresAt };
}

export interface SessionUser {
  accountId: string;
  role: "traveller" | "vendor" | "admin";
  email: string | null;
  mobile: string | null;
  mobileVerifiedAt: Date | null;
}

/** Resolves a raw cookie value to a live account, or null. */
export async function resolveSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;

  const [row] = await db
    .select({
      accountId: account.id,
      role: account.role,
      email: account.email,
      mobile: account.mobile,
      mobileVerifiedAt: account.mobileVerifiedAt,
      status: account.status,
    })
    .from(session)
    .innerJoin(account, eq(session.accountId, account.id))
    .where(and(eq(session.tokenHash, hashSessionToken(token)), gt(session.expiresAt, new Date())))
    .limit(1);

  if (!row || row.status !== "active") return null;

  return {
    accountId: row.accountId,
    role: row.role,
    email: row.email,
    mobile: row.mobile,
    mobileVerifiedAt: row.mobileVerifiedAt,
  };
}

export type MobileVerifyFailure = "no_code" | "expired" | "locked" | "invalid" | "mobile_taken";

export async function requestMobileVerification(
  accountId: string,
  mobile: string,
  meta: { ip?: string; userAgent?: string } = {}
): Promise<{ issued: true }> {
  const key = `mobile:${mobile}`;
  const code = generateOtp();

  await db
    .update(otpCode)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpCode.identifier, key), eq(otpCode.purpose, "publish_request"), isNull(otpCode.consumedAt)));

  await db.insert(otpCode).values({
    accountId,
    identifier: key,
    codeHash: hashOtp(code, key),
    purpose: "publish_request",
    maxAttempts: OTP_MAX_ATTEMPTS,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  await deliverOtp({ mobile }, code);
  return { issued: true };
}

export async function confirmMobileVerification(
  accountId: string,
  mobile: string,
  code: string
): Promise<{ ok: true } | { ok: false; reason: MobileVerifyFailure }> {
  const key = `mobile:${mobile}`;
  const [row] = await db
    .select()
    .from(otpCode)
    .where(
      and(
        eq(otpCode.identifier, key),
        eq(otpCode.accountId, accountId),
        eq(otpCode.purpose, "publish_request"),
        isNull(otpCode.consumedAt)
      )
    )
    .orderBy(sql`${otpCode.createdAt} desc`)
    .limit(1);

  if (!row) return { ok: false, reason: "no_code" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.attempts >= row.maxAttempts) return { ok: false, reason: "locked" };

  if (!safeEqual(row.codeHash, hashOtp(code, key))) {
    await db
      .update(otpCode)
      .set({ attempts: row.attempts + 1 })
      .where(eq(otpCode.id, row.id));
    return { ok: false, reason: row.attempts + 1 >= row.maxAttempts ? "locked" : "invalid" };
  }

  const [taken] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.mobile, mobile), ne(account.id, accountId)))
    .limit(1);
  if (taken) return { ok: false, reason: "mobile_taken" };

  await db.update(otpCode).set({ consumedAt: new Date() }).where(eq(otpCode.id, row.id));
  await db
    .update(account)
    .set({ mobile, mobileVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(account.id, accountId));
  return { ok: true };
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db.delete(session).where(eq(session.tokenHash, hashSessionToken(token)));
}

/** Housekeeping for a scheduled job: expired sessions and spent codes. */
export async function pruneExpired(): Promise<void> {
  await db.delete(session).where(sql`${session.expiresAt} < now()`);
  await db.delete(otpCode).where(sql`${otpCode.expiresAt} < now() - interval '1 day'`);
}
