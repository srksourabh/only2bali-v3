import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, otpCode, session, auditLog, traveller } from "@/lib/db/schema";
import {
  generateOtp, hashOtp, safeEqual, generateSessionToken, hashSessionToken,
} from "./crypto";
import { deliverOtp } from "./delivery";

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

async function createSession(
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
  };
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
