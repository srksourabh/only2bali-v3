import { cookies } from "next/headers";
import { resolveSession, type SessionUser } from "./service";

export const SESSION_COOKIE = "o2b_session";

/**
 * httpOnly so JavaScript cannot read it — the defect in the legacy React app was
 * JWTs in localStorage. Lax rather than Strict so a link from an email still
 * arrives authenticated, which matters for a passwordless flow.
 */
export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/** The current user, or null. Safe to call from any server component. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return resolveSession(jar.get(SESSION_COOKIE)?.value);
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/**
 * Role check. Called in the service layer as well as in middleware — the live
 * IDOR in the legacy Django app existed precisely because one layer was trusted
 * to have done it.
 */
export async function requireRole(
  ...roles: Array<SessionUser["role"]>
): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export { resolveSession };
export type { SessionUser };
