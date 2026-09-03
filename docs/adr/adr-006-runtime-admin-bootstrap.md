# ADR-006: Bootstrap the first admin from the Vercel runtime

**Date**: 2026-08-24
**Status**: Accepted

**Decision**: `POST /api/ops/bootstrap-admin` creates or resets a password admin
using the production `DATABASE_URL` already in the Vercel runtime. It uses the
same `MIGRATE_TOKEN` (>=32 chars, Bearer) gate as `POST /api/ops/migrate`.
There is no public admin signup. `npm run admin:create` stays the local path.

**Reason**: Production has no `ADMIN_USERNAME` / `ADMIN_PASSWORD`. The laptop
cannot decrypt Encrypted Vercel secrets, so the CLI create-admin script cannot
reach Hostinger. Vendor verification and listing publish are admin-only, so the
marketplace cannot be moderated until an admin exists.

**Consequences**: Anyone who holds `MIGRATE_TOKEN` can mint or reset an admin.
Keep the token in Vercel only. Rotate it after first use if it leaked through
shell history. The route returns `{ created, username }` and never the password.
