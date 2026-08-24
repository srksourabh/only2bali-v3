# ADR-005: Apply lagged Drizzle migrations from the Vercel runtime

**Date**: 2026-08-24
**Status**: Accepted

**Decision**: Production schema catch-up runs inside the Vercel function that
already holds `DATABASE_URL` and `PGSSL_*`. `GET /api/health` applies pending
committed SQL when `schema.current` is false. `POST /api/ops/migrate` does the
same when `MIGRATE_TOKEN` (>=32 chars) is set. The laptop CLI path
(`vercel env pull` + `scripts/migrate-mtls.ts`) stays available but is not
sufficient: Encrypted production secrets decrypt to empty strings here.

**Reason**: Health already showed `applied: 3` / `expected: 6` while the app
could query Postgres. Auth writes fail closed on that lag. Waiting for a
dashboard paste of `DATABASE_URL` blocked shipping.

**Consequences**: The serverless bundle must include `lib/db/migrations/**` on
health and migrate. Overlapping calls are safe because Drizzle takes an
advisory lock. Health may take longer than usual once, then is a no-op.
