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

**Half of this was already done, and the code was throwing it away.**

Production has `NEXT_PUBLIC_CONTACT_EMAIL=hello@only2bali.com` set. `/api/health`
still reported `contact.email: false`, because `hello@only2bali.com` was the
literal value `lib/config.ts` used as its "somebody pasted the example" sentinel
— the single most likely real address for this business. Anyone setting it saw a
configured variable, a site with no contact link, and nothing explaining the
gap.

The sentinel is now `you@example.com`, which is reserved by RFC 2606 and cannot
be a real destination. `lib/config.test.ts` pins both halves: the business's own
address is accepted, a pasted example is still refused.

**After deploying, `contact.email` should flip to `true` with no change in
Vercel.** What remains:

| Variable | State |
|---|---|
| `NEXT_PUBLIC_CONTACT_EMAIL` | already set — works once the fix ships |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | **not set.** Digits with country code, no `+` |

The WhatsApp sentinel `6281200000000` is untouched; all-zeros is not a number
anyone could want.

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

**Root cause found and fixed in code (commit `a6618a4`). This item is now just
"deploy it, then confirm".**

`lib/db/index.ts` cached the connection pool on `globalThis` behind
`NODE_ENV !== "production"`. It reads as a hot-reload convenience; it was the
opposite. In production nothing was ever cached, and because `db` is a Proxy
that calls `connect()` on every property access, **every single query built a
fresh pool** — TCP handshake, TLS handshake, authentication — and discarded it.

Nothing ever failed, which is why it lasted. It was only slow. At roughly two
seconds per query and about five queries in the health handler, that is the ten
seconds every probe of production reported. Static pages answered in 0.5s and
hid it completely.

The cache now applies in every environment, which is what the comment above it
already claimed. `lib/db/index.test.ts` asserts reuse rather than the
environment, and was run against the unfixed code first to confirm it fails
there.

### After deploying, confirm

`/api/health` now reports `placement`:

```json
"placement": { "database": "...", "function": "iad1", "colocated": true|false }
```

- **`colocated: true`** — nothing more to do. Expect `latencyMs` to fall from
  ~10s to well under a second.
- **`colocated: false`** — the pool fix alone still helps a great deal, but
  every query is crossing regions. Functions currently execute in **iad1**
  (confirmed from the `x-vercel-id` header; the `bom1` in that header is only
  the edge PoP that accepted the request, not where the code ran). Move them to
  the database's region by adding a `vercel.json` beside `package.json`:

  ```json
  { "regions": ["<the vercel region matching placement.database>"] }
  ```

  `lib/db/placement.ts` carries the Vercel-region-to-cloud-region table — for
  example `ap-south-1` is `bom1`, `us-east-1` is `iad1`. Redeploy after adding
  it.

Neon regions cannot be changed in place, so moving the functions is the cheap
direction. Do not guess: read `placement` first.

## After each change

```bash
npm run verify:launch                 # reads production /api/health
npm run verify:launch -- <base-url>   # or point it somewhere else
```

It exits non-zero while anything above is still open, so it can gate a deploy.
