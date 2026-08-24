# Launch checklist

> What stands between the current deployment and a real traveller booking a
> real trip. Verified against live production on 2026-08-25.
>
> Everything here needs a credential this repository does not hold — a Vercel
> dashboard login, a Razorpay dashboard, a Zoho account, a SpringEdge account.
> The code for all of it is already written and already fails closed. These are
> switches, not features.
>
> Run `npm run verify:launch` after each change. It reads production's own
> `/api/health` and tells you which of these are still open.

## The state right now

```
$ curl -s https://only2bali.vercel.app/api/health
database    connected          schema 8/8 current
otpDelivery ["none"]           nobody can be sent a sign-in code
payments    live               acceptingPayments: true
uploads     media: none        documents: none
contact     whatsapp: false    email: false
clerk       true               /en/login offers "Continue with Google"
```

## 1 — Live payments behind the only working login

**This is the one to resolve first.**

OTP delivery is unconfigured, so the sign-in form's submit button renders
`disabled` — that part fails closed correctly. But Clerk *is* configured, and
`/en/login` renders "Continue with Google". So Google is the only working door
into the product, and it opens onto live Razorpay keys with
`acceptingPayments: true`.

A real person can sign in with Google, book, and be charged real money, while
vendor photos cannot be stored, KYC documents cannot be stored, and there is no
support address to write to when something goes wrong.

Pick one:

- **Hold payments.** In Vercel, set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
  to the `rzp_test_…` pair. `/api/health` should then read `"mode": "test"`.
  Checkout keeps working for testing; no real money moves.
- **Or hold the door.** Disable Google in the Clerk dashboard until items 2–6
  are done. `/en/login` then offers no working method at all, which is honest.

Do not leave both open. Whichever you choose, walk a Google sign-in through to
a booking yourself before opening it to anyone else — that path is the one real
users will take and it has never been exercised end to end.

## 2 — Email delivery, so people can sign in

Nothing to build. `lib/auth/delivery.ts` already speaks Resend.

In Vercel, set:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | from the Resend dashboard |
| `EMAIL_FROM` | `Only2Bali <hello@only2bali.com>` — must be a verified sender |

Verify the sending domain in Resend first; an unverified domain fails at send
time, not at deploy time, which looks exactly like a working login that never
arrives.

After redeploy, `/api/health` reports `"otpDelivery": ["email"]` and the login
submit button stops being disabled.

**Do not set `SPRINGEDGE_API_KEY` for SMS yet.** See item 5.

## 3 — Blob storage, so uploads work

Production reports `uploads: {media: "none", documents: "none"}`. Vendor photos
and KYC documents — the whole of Phase C — are dead in production without this.

In Vercel, create a Blob store and set:

| Variable | Holds |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | public media: listing photos, provider galleries |
| `BLOB_PRIVATE_READ_WRITE_TOKEN` | private documents: KYC, licences |

Two separate stores on purpose. `lib/uploads/store.ts` keeps public media and
private documents apart so a public listing photo URL can never be guessed into
a vendor's identity document. Pointing both variables at the same store defeats
that, silently.

## 4 — Contact details

| Variable | Note |
|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | digits with country code |
| `NEXT_PUBLIC_CONTACT_EMAIL` | |

`lib/config.ts` rejects the placeholder `6281200000000`, so a half-filled value
reads as unset rather than as a working number that reaches nobody.

## 5 — Revoke the two leaked credentials

**Zoho tokens** and the **SpringEdge SMS key** were committed to source in
repositories that were public. The Zoho integration has since been deleted from
the codebase and the SMS key now comes from the environment, but neither change
revokes anything: both are still in git history and still live at the provider.

Until they are revoked, treat both as compromised:

- Revoke the Zoho tokens in the Zoho account.
- Revoke and reissue the SpringEdge API key.
- Only then consider setting `SPRINGEDGE_API_KEY` in Vercel. Setting the old key
  would send sign-in codes with a credential a stranger may hold.

Email (item 2) is enough to unblock login on its own. SMS can wait for the
rotation.

## 6 — Remove the demo marketplace data

Before production takes real signups:

```sql
delete from booking where reference like 'O2B-DEMO-%';
delete from account where email like '%@demo.only2bali.com';
```

Both statements are documented in `infra/postgres/seed-demo.sql`. Run them
against the production database, not a local one.

## 7 — Database round-trip latency

`/api/health` answered in 10.7s, 9.8s and 10.0s on three **back-to-back**
probes. `/api/services` takes 3.6s; static pages 0.5s. Every database-backed
page pays this, on every request.

Two explanations are already ruled out:

- **Not a cold start.** A Neon scale-to-zero wake would be slow once and fast
  immediately after. Three consecutive probes were all ~10s.
- **Probably not pooling.** `docs/memory.md` records `DATABASE_URL` as Neon's
  pooled `sslmode=require` string. Confirm the host still contains `-pooler`,
  but do not stop there if it does.

`latencyMs` covers the whole handler, which makes roughly five round trips
(applied-migration count, three schema probes, one ping). Ten seconds across
those is about two seconds per round trip, which points at distance rather than
connection setup.

**Check first:** the Neon project's region against the Vercel function region.
A database in one continent and a function in another produces exactly this
profile, and it is invisible locally — `npm run db:verify` reports 1ms average
against the Docker Postgres. Co-locating them is a Neon project setting, not a
code change.

## After each change

```bash
npm run verify:launch                 # reads production /api/health
npm run verify:launch -- <base-url>   # or point it somewhere else
```

It exits non-zero while anything above is still open, so it can gate a deploy.
