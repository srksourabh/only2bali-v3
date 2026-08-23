# Only2Bali consolidation audit — 23 August 2026

**Final status:** merged into canonical `main`, deployed from the canonical
GitHub repository, and legacy copies archived.

## Simple answer

Use this folder:

`C:\Users\soura\Dropbox\AI\Projects\Only2Bali`

Use this GitHub repository:

`https://github.com/srksourabh/only2bali-v3`

Build and deploy only `only2bali-next/`. Recovery copies are stored in
`C:\Users\soura\Dropbox\AI\Projects\Only2Bali_ARCHIVE_2026-08-23` and must not
be used for development or deployment.

## What was checked

The audit resolved every supplied path, enumerated and hashed source/config/doc
files, compared Git histories and branch ancestry, inspected all Markdown files,
listed routes/tests/migrations, reviewed payment implementations, checked GitHub
PRs and Actions, inspected Vercel, smoked live routes, ran dependency/security
scans, and ran fresh local verification. Generated folders (`node_modules`,
`.next`, Git internals and audit output) were counted where useful but excluded
from source comparisons because they are downloaded or rebuilt artifacts.

| Location | What it really is | Source files checked | Markdown result | Decision |
|---|---|---:|---:|---|
| `Only2Bali` | Current canonical Git repo | 349 tracked app files before consolidation; 353 after consolidation | 37 active tracked docs before consolidation; all reviewed | **Keep** |
| `Only2Bali/only2bali-next` | App inside the canonical repo, not a separate repo | 352 meaningful files before consolidation; 4 verified files added | One app README, rewritten current | **Build/deploy this** |
| `Only2Bali_ARCHIVE_2026-08-23/legacy-django-cra-static` | Source-only archive of retired Django/CRA/static apps | 304 | One generic CRA README | Archived |
| `Only2Bali_ARCHIVE_2026-08-23/old-github-fork-workspace` | Older clone of the GitHub fork | 1,169 non-generated files | 25 docs, mostly agent rules/licences plus an obsolete production runbook | Archived |
| `Only2Bali_ARCHIVE_2026-08-23/hidden-july-worktree-9a5212f.zip` | Tracked snapshot of detached July worktree at `9a5212f` | Duplicate historical tree | July snapshot preserved | Archived as ZIP; worktree registration removed |

The two supplied nested paths did not exist. Their actual folders were siblings:
`Only2Bali_legacy_archive_2026-08-22` and `Only2bali_v3.0`.

## Which version has each feature

| Feature | Current canonical branch | Local old `main` | Old fork `main` | Legacy archive |
|---|---|---|---|---|
| Seven-language site | Yes | Yes | No | No |
| Marketplace services/providers/destinations | Yes | Partial | No | Old unrelated flows |
| Traveller/provider/admin dashboards | Yes | Partial | No | Old Django/CRA dashboards |
| PostgreSQL + Drizzle migrations | 6 migrations | 5 migrations | None | Django migrations only |
| Auth | Clerk social + OTP/password + sessions | OTP/password/Google | None | Old Django JWT/OTP |
| Booking inventory and seat holds | Yes | Yes | No durable ledger | Old unrelated booking page |
| Razorpay | Database-backed checkout, verify, webhook, refunds | Divergent hybrid implementation | Standalone deposit page, no DB ledger | None |
| Payout/disbursement ledger | Yes, manual/legal gate remains | No | No | No |
| Provider uploads/KYC/media | Yes | Partial | No | No |
| PWA | Yes | No | No | CRA shell only |
| Unit tests | 139 passing across 17 files | 9 files | 19 passing across 2 files | Minimal/none |
| API routes | 51 | 32 | 5 | Legacy Django endpoints |
| Page routes | 21 localized | 14 localized | 10 English-only | 31 CRA routes, several dead |

The canonical branch is 56 commits ahead of the old fork and the old fork has
only three unique main-branch commits. The useful parts of those commits are SEO,
error hardening and a simpler Razorpay demo; the full fork must not be merged
because it would delete the database marketplace, localization and auth.

## Payment findings

| Payment work | Finding | Action |
|---|---|---|
| Current `/api/payments/checkout`, `/verify`, `/webhook` | Best implementation: server amount, idempotency, DB payment/event records, HMAC verification and booking confirmation | **Keep** |
| Current refund/disbursement APIs | Supports refunds and a held/released payout ledger; real cross-border payout remains a legal/provider gate | Keep code; do not call it live without compliance approval |
| Old fork `/pay` | Attractive standalone deposit UI, but it is disconnected from the full booking ledger and uses different endpoint names | Do not merge wholesale |
| Local “Cashfree production payments” commit `f5d7f7c` | Misleading title: it adds Cashfree key detection/documentation, not Cashfree order/verify/webhook code | Do not claim Cashfree is integrated |
| Local checkpoint `c1bb555` | Adds another Razorpay flow on the Cashfree branch, but removes newer marketplace/auth work when compared as a branch | Review only if its package-page UX is desired |

Production health reported Razorpay configured, but the database was unreachable.
No live payment was attempted. This is the safe choice: payment capture without a
healthy booking/payment ledger risks reconciliation errors.

## Design and performance findings

| Change found elsewhere | Result |
|---|---|
| Keyboard operation for planner choice cards | Ported with real `<button>` controls and `aria-pressed`; the old patch used a clickable `div` containing another button |
| `robots.txt` and multilingual sitemap | Ported and expanded to current destinations/services/package routes |
| Security headers and modern AVIF/WebP negotiation | Ported from the old fork hardening commit |
| 30 compressed legacy image assets | Useful: reduces those source images from 69.73 MiB to 4.86 MiB (93% smaller); ported to the active public assets |
| Old fork standalone error/404 screens | Not ported yet; they use non-localized links and need adaptation rather than copy/paste |

## Markdown findings

All 37 active tracked Markdown files were inspected. The old fork's 25 Markdown
files and the legacy archive's one Markdown file were also inspected; the 43
Markdown files inside the hidden detached worktree are duplicates of the July
snapshot and were hash-compared.

The active documentation contains strong planning detail, but several files still
mix historical and current truth. The most important corrections are made in the
root and app READMEs, `CLAUDE.md`, this audit and the new consolidation ADR.
Large files under `docs/planning/` remain planning records, not proof that every
idea shipped. `docs/memory.md`, `docs/progress.md`, `docs/ARCHITECTURE.md` and
`docs/vercel-handover.md` contain older timeline sections; use their dated entries
as history and use this audit for the current folder/repo decision.

The old fork production docs are obsolete because they say Postgres and the
booking ledger are future work. Those features now exist in the canonical repo.
The legacy CRA README is only the default Create React App help page.

## GitHub result

| Repository | Current role | Decision |
|---|---|---|
| `srksourabh/only2bali-v3` | Full marketplace, CI, consolidated `main`, connected to Vercel | **Canonical** |
| `srksourabh/Only2bali_v3.0` | Older public fork retained as recovery evidence | **Archived on GitHub** |

PR #9, including the earlier Clerk and repository-pruning work, was merged into
canonical `main`. Superseded PRs #4, #6, #7 and #8 were closed. The app,
schema/seed, end-to-end and secret-scan checks passed. The old Azure workflows
targeted retired apps and were removed.

Historical secret scanning found 27 redacted findings in the shared Git history,
all in retired Django/React files. Current CI's committed-secret check passes, but
old Zoho/SpringEdge credentials still require provider-side revocation/rotation;
deleting files never revokes credentials.

Next.js was patched within the existing major version from 15.5.2 to 15.5.21.
`npm audit` still reports ten transitive dependency findings. Clearing all of
them requires major framework/tool upgrades, so they are recorded for a separate
tested upgrade rather than hidden with a forced dependency change.

## Verification evidence

| Check | Current canonical application | Old fork app |
|---|---|---|
| TypeScript | Pass | Pass |
| Unit tests | 139/139 pass | 19/19 pass |
| Production build | Pass; 127 static pages generated | Pass; 16 static pages generated |
| Database-backed end-to-end | 75/75 pass | Not available |
| Dependency audit after Next.js patch | Next.js 15.5.21; 10 transitive findings remain: 5 moderate, 5 high | 5 findings: 1 low, 4 high |
| GitHub CI | All four jobs passed on PR #9 | No Actions runs |
| Live home/planner | HTTP 200 | Not the chosen deployment |
| Live health | HTTP 503, database unreachable | Not applicable |
| Live services | HTTP 500 because DB is down | Feature absent |

## Items deliberately not merged

1. The alternate Cashfree/Razorpay payment branches — payment behavior needs an
   explicit product choice and a test transaction plan.
2. Admin-managed API secrets (PR #7) — useful, but it creates a new encrypted
   secrets database and must be reviewed separately against auth and key-rotation
   policy.
3. Historical Django/CRA/FastAPI code — it duplicates the product and restores
   known security and deployment traps.
4. Stale deploy-status docs — current live checks supersede them.

## Remaining launch order

1. Replace the rejected Hostinger API token or supply an existing PostgreSQL
   server, password and mTLS client certificates.
2. Add `DATABASE_URL`, `PGSSL_CA`, `PGSSL_CERT` and `PGSSL_KEY` to Vercel.
3. Apply migrations and seed data, then require `/api/health` to report the
   database connected.
4. Configure OTP delivery and run a test-mode Razorpay booking end to end.
5. Smoke services, login, booking, payment verification/webhook and direct admin
   URLs before accepting real bookings.
