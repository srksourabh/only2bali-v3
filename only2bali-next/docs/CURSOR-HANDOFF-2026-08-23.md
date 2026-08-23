# Only2Bali Cursor Handoff - 2026-08-23

## Current Status

Continue from this folder:

```powershell
cd "C:\Users\soura\Dropbox\AI\Projects\Only2Bali\only2bali-next"
```

Canonical GitHub repo (the mother folder is the git repo):

```text
https://github.com/srksourabh/only2bali-v3
```

Active branch:

```text
main
```

Merged PR:

```text
https://github.com/srksourabh/only2bali-v3/pull/13
```

Production Vercel app:

```text
https://only2bali.vercel.app
```

PR #13 is merged. Merge commit `bc9c307`. Local `main` is fast-forwarded. Production inspect is Ready (`dpl_61d4jLwYRoSZgfLbhuneEZQzDNky`, aliases include `only2bali.vercel.app`). GitHub CI on that commit is green (`only2bali-next`, `schema and seed`, `end-to-end`, `no committed secrets`, Vercel).

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

Code ship is done. Do not re-merge PR #13.

Remaining work is owner-only production secrets (table below). After those are set:

```powershell
vercel inspect https://only2bali.vercel.app --scope srksourabhs-projects
```

Then check `/api/health`: `payments.acceptingPayments` must be `true`, and both upload backends must be `vercel_blob`, before advertising checkout or file uploads.

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

## Shipped (code path)

PR #13 is merged, Vercel production is Ready, and `vercel inspect https://only2bali.vercel.app --scope srksourabhs-projects` returned Ready.

Current truthful status:

```text
Marketplace shipment code is on main and in production. Payments and direct uploads stay fail-closed until the owner sets the real Razorpay webhook secret and the two Vercel Blob tokens. Do not advertise live checkout or file uploads until /api/health says those backends are configured.
```

