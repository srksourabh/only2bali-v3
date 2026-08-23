# ADR: Clerk OAuth with Postgres session bridge

**Date:** 2026-08-07  
**Status:** Accepted

## Decision

Use Clerk for social OAuth UX (Google, Apple, …). After Clerk authenticates the
user, `POST /api/auth/clerk/bridge` links `oauth_account` (`provider = clerk`)
and issues the existing `o2b_session` cookie. `getSessionUser` / `requireRole`
remain unchanged and continue to read Postgres `account.role`.

## Why

Roles, vendor/traveller profiles, bookings, and admin gates all key off
`account.id`. Replacing sessions with Clerk-only auth would rewrite every
`requireRole` call site. The bridge keeps OAuth modern without forking authz.

## Consequences

- Requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` on Vercel.
- Without keys, login falls back to password / OTP / legacy Google OAuth.
- Admin accounts stay password-only (no public Clerk signup into admin).
- Enable social providers in the Clerk Dashboard before the buttons work.
