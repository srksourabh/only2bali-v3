# Only2Bali application

This is the only active Only2Bali application. It is a Next.js 15 App Router
marketplace with seven languages, PostgreSQL/Drizzle, Clerk plus OTP/password
auth, traveller and provider dashboards, admin operations, Razorpay payments,
and a PWA shell.

## Start locally

```bash
npm install
npm run dev:local
```

The local command starts Postgres, applies migrations, seeds sample data and
starts Next.js. Use `npm run dev:down` when finished.

## Verify before a merge

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

As of 2026-08-23, type-check, 139 unit tests, a 127-page production build and
75 database-backed end-to-end checks pass. GitHub CI also runs schema/seed
verification.

## Deploy

- GitHub source: `srksourabh/only2bali-v3`
- Vercel project: `srksourabhs-projects/only2bali`
- Vercel Root Directory: `only2bali-next`
- Production alias: `https://only2bali.vercel.app`

Do not deploy anything under
`C:\Users\soura\Dropbox\AI\Projects\Only2Bali_ARCHIVE_2026-08-23`.
Required configuration keys are documented in `.env.example`; secrets must be
set in Vercel and never committed.

Production is not healthy until `/api/health` returns HTTP 200 with
`"database":"connected"`. A configured payment gateway alone is not enough.

See [`../docs/consolidation-audit-2026-08-23.md`](../docs/consolidation-audit-2026-08-23.md)
for the folder and repository comparison.
