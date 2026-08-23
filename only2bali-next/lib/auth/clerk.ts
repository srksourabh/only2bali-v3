/** True when Clerk publishable + secret keys are present. */
export function clerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim()
  );
}

export interface ClerkEmailAddressLike {
  id: string;
  emailAddress: string;
  verification?: { status?: string | null } | null;
}

/**
 * Only an email Clerk has actually verified may be used for account linking.
 * Trusting the primary address without this check lets an unverified signup
 * take over an existing local account that shares the address.
 */
export function pickVerifiedEmail(
  emails: ReadonlyArray<ClerkEmailAddressLike> | undefined,
  primaryId?: string | null
): string | null {
  if (!emails?.length) return null;
  const verified = emails.filter((e) => e.verification?.status === "verified");
  const primary = emails.find((e) => e.id === primaryId);
  if (primary && primary.verification?.status === "verified") return primary.emailAddress;
  return verified[0]?.emailAddress ?? null;
}
