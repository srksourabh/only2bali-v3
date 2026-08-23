# Only2Bali Cursor Handoff - 2026-08-23

## Current Status

Continue from this folder:

```powershell
cd "C:\Users\soura\Dropbox\AI\Projects\Only2Bali\only2bali-next"
```

Canonical GitHub repo:

```text
https://github.com/srksourabh/only2bali-v3
```

Active branch:

```text
codex/saas-shipment-audit
```

Open PR:

```text
https://github.com/srksourabh/only2bali-v3/pull/13
```

Production Vercel app:

```text
https://only2bali.vercel.app
```

PR #13 is not merged yet. It is blocked only because the previous GitHub E2E run failed before the latest local fix was committed and pushed.

## What Is Already Done

| Area | Status | Plain-English Meaning |
| --- | --- | --- |
| Single repo direction | Done | Use `only2bali-v3` as the canonical GitHub repo. |
| Traveller portal | Verified locally | Travellers can sign in, see account, and book only after login. |
| Vendor portal | Verified locally | Vendors can sign up, open provider dashboard, create listing, add photo URL, price, details. |
| Admin moderation | Verified locally | Admin can verify vendor, publish listing, approve photo. |
| Public marketplace | Verified locally | Approved vendor listing becomes visible to travellers. Pending listings stay hidden. |
| Booking security | Verified locally | Anonymous booking is blocked. Traveller price tampering is ignored. Server computes price. |
| Payment gateway | Fail-closed | Razorpay checkout is wired but paused until the real webhook secret is set. It returns `payment_setup_required` and creates no payment row. |
| Upload privacy | Fixed | Public media and private KYC documents now use separate Vercel Blob tokens. |
| Security audit | Done | `npm audit` and `npm audit --omit=dev` were clean after dependency hardening. |
| SaaS audit doc | Done | See `docs/SAAS-SHIPMENT-AUDIT-2026-08-23.md`. |

## Latest Uncommitted Fix

Two files have uncommitted changes:

```text
scripts/e2e.ts
scripts/e2e.sh
```

Reason:

The GitHub Linux E2E job failed with this Next dev-server error:

```text
SyntaxError: Unexpected non-whitespace character after JSON at position 554
```

Root cause found locally:

The E2E warmup hit several first-time Next.js routes in parallel. On Linux, Next dev compiled multiple routes at once and hit a generated JSON parse failure. The fix serializes the warmup and increases request timeout for slow CI route compilation.

Also added better log output when E2E fails, so CI will show the server stdout/stderr tail directly.

## Verification Already Run After The Fix

| Check | Result |
| --- | --- |
| `npm test` | Passed: 153 tests |
| `npm run typecheck` | Passed |
| Linux Node 22 Docker E2E reproduction | Passed: 106 passed, 0 failed |
| `git diff --check` | Passed |

The Linux reproduction used a clean `node:22-bookworm` container and the local Postgres test database at `o2b-local-db`. Temporary audit containers were removed. Other containers were not touched.

## Exact Next Steps In Cursor

1. Re-check the current state:

```powershell
cd "C:\Users\soura\Dropbox\AI\Projects\Only2Bali\only2bali-next"
git status --short --branch
git diff -- scripts/e2e.ts scripts/e2e.sh
```

2. Run final local checks:

```powershell
npm test
npm run typecheck
npm run db:check
npm run build
npm run test:e2e
git diff --check
```

3. Commit and push the E2E fix:

```powershell
git add scripts/e2e.ts scripts/e2e.sh docs/CURSOR-HANDOFF-2026-08-23.md
git commit -m "Stabilize Linux E2E warmup"
git push origin codex/saas-shipment-audit
```

4. Wait for PR #13 checks:

```powershell
gh pr checks 13 --watch
```

5. If all checks are green, merge PR #13:

```powershell
gh pr merge 13 --squash --delete-branch
git checkout main
git pull --ff-only origin main
```

6. Verify Vercel production deployment:

```powershell
vercel inspect https://only2bali.vercel.app --scope srksourabhs-projects
```

Do not use curl as the deployment proof. Use `vercel inspect` for Vercel status.

## External Things Still Needed From Owner

| Item | Why It Matters |
| --- | --- |
| Real Razorpay webhook secret | Payment is deliberately paused until this is set. The value supplied earlier was a URL, not a webhook secret. |
| Vercel Blob public token | Needed for direct public listing photo uploads. Current workaround: vendors can paste HTTPS image URLs. |
| Vercel Blob private token | Needed for secure KYC document uploads. The code is ready but production token is required. |
| Rotate pasted secrets | Live keys/passwords were pasted in chat. Rotate them before final real-money launch. |

Required production env names:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
BLOB_READ_WRITE_TOKEN
BLOB_PRIVATE_READ_WRITE_TOKEN
```

## Do Not Claim Yet

Do not say "fully shipped" until PR #13 is merged, Vercel production is ready, and the production deployment has been inspected.

Current truthful status:

```text
The app code and E2E fix are locally verified. The PR still needs one final commit/push, green CI, merge to main, and Vercel production verification.
```

