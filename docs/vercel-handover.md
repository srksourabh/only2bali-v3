# Getting the right app deployed on your own Vercel account

> Written 2026-07-23, corrected the same day after checking the live site.
> Everything here is a human action — it cannot be done from the codebase, which
> is why it has stayed open.

## What is actually deployed today

Verified 2026-07-23 against the running site, not assumed:

- A project called **`only2bali` already exists on your own team**
  (`srksourabhs-projects`, `prj_Qny5SmpF064e9jXmhezZcHiasK3J`). The repo is
  linked to it through `only2bali-next/.vercel/project.json`.
- **It was serving the legacy React app.** `/api/health` returned the CRA's
  `index.html` through its SPA catch-all instead of JSON. That is the Root
  Directory trap below: with the field blank, Vercel reads the root
  `vercel.json`, which builds `Frontend/`.
- **Now fixed by deploying the right directory.** `vercel deploy --prod` run
  from `only2bali-next/` on 2026-07-23 put the Next.js app on
  `only2bali.vercel.app`. The CLI uploads the current directory, so it sidesteps
  the blank Root Directory setting — which is still blank, and still has to be
  fixed before step 1 below.
- **The project is not connected to GitHub for `only2bali-v3`.** Historical Git
  deploys came from `Only2bali_v3.0`. On 2026-08-06 production was updated by
  MCP file deploy whose `installCommand` clones `only2bali-v3@main`. Connect
  GitHub to `srksourabh/only2bali-v3` (after Root Directory is confirmed as
  `only2bali-next`) so ordinary pushes deploy without that workaround.
- **Connect Git only after Root Directory is set.** In that order. Connect it
  first and the next push to `main` builds `Frontend/` and puts the legacy app
  back on production automatically.

### What that production deploy can and cannot do

`AUTH_SECRET` is the only environment variable set on the project, so:

| Works | Does not |
|---|---|
| Homepage, all seven locales, correct `<html lang>` | Package pages — they 500, because the catalogue lives in Postgres |
| Static pages: about, food, faq, privacy, terms | Sign-in — `/api/auth/request-otp` answers 503 |
| Unknown URLs return a real 404 | Enquiry and vendor forms — the save fails, so the form says so |
| `/api/health` reporting all of the above honestly | WhatsApp and email buttons — hidden, no number configured |

Everything in the right column is one variable away: `DATABASE_URL` plus the
three `PGSSL_*` PEMs. Until then the site browses but cannot transact.

Roll back to the previous production deployment at any time with
`vercel rollback` from `only2bali-next/`.
- `only2bali-v3-0.vercel.app` — the site the docs used to call production — is
  a separate deployment on **caloganathan's** account.

So there are two jobs here: point this project at the right directory and at
GitHub, and fill in the environment variables.

## Why this blocks other work

Until the project builds `only2bali-next/` with real environment variables, you
cannot:

- set `NEXT_PUBLIC_WHATSAPP_NUMBER` or `NEXT_PUBLIC_CONTACT_EMAIL`, so the site
  keeps rendering with no contact buttons,
- set `RESEND_API_KEY`, so nobody can sign in,
- set `DATABASE_URL` or the three `PGSSL_*` values, so the app has no database,
- roll back a bad deploy of your own product.

Everything else that is still open depends on this one step.

## Steps

1. **Connect the existing `only2bali` project to GitHub.**
   vercel.com → `only2bali` → Settings → Git → Connect Git Repository →
   `srksourabh/only2bali-v3`, production branch `main`. Until this is done,
   pushing to `main` deploys nothing and every release needs someone's laptop.

2. **Set Root Directory to `only2bali-next`.** Settings → Build and Deployment →
   Root Directory. This is the single most important field, and it is the one
   currently wrong: left blank, Vercel reads the root `vercel.json`, which builds
   `Frontend/` — the legacy React app. That is what `only2bali.vercel.app` is
   serving right now.

3. **Add the environment variables.** Either in Settings → Environment
   Variables, or from `only2bali-next/` with the CLI, which reads the value from
   your terminal rather than putting it in a file:

   ```bash
   npx vercel env add DATABASE_URL production
   npx vercel env add PGSSL_CA production      # base64 of the PEM
   npx vercel env add PGSSL_CERT production
   npx vercel env add PGSSL_KEY production
   npx vercel env add RESEND_API_KEY production
   npx vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER production
   npx vercel env add NEXT_PUBLIC_CONTACT_EMAIL production
   npx vercel deploy --prod                    # variables apply on next build
   ```

   Names and meanings are in `only2bali-next/.env.example`.

   | Variable | Where it comes from |
   |---|---|
   | `DATABASE_URL` | printed by `infra/postgres/bootstrap.sh` |
   | `PGSSL_CA`, `PGSSL_CERT`, `PGSSL_KEY` | same script — base64, because Vercel cannot hold raw newlines |
   | `AUTH_SECRET` | `openssl rand -base64 48` |
   | `RESEND_API_KEY`, `EMAIL_FROM` | Resend, once a sending domain is verified |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | the real business number, digits only, no `+` |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | the inbox someone actually reads |
   | `GEMINI_API_KEY` | Google AI Studio — without it the planner serves mock itineraries |

4. **Deploy, then check the site is really configured** — not just that it
   loads:

   ```bash
   curl -s https://<your-deployment>/api/health
   ```

   ```json
   {
     "status": "ok",
     "database": "connected",
     "otpDelivery": ["email"],
     "contact": { "whatsapp": true, "email": true }
   }
   ```

   `"otpDelivery": ["none"]` means nobody can sign in. `"contact"` false means
   the WhatsApp and email buttons are not rendering. Both are deliberate: the
   site would rather show less than pretend.

   If you get HTML back instead of JSON, step 2 did not take effect — you are
   still looking at the legacy React app.

5. **Point the domain** at the new project, and only then remove the old one.

6. **Ask caloganathan to delete the old Vercel project** once DNS has moved, so
   two deployments cannot serve the same brand.

## After the move

- Enquiries land in `lead` and provider applications in `vendor_application`.
  Read them with:

  ```sql
  select created_at, name, mobile, departure_city, group_size, protocol
  from lead order by created_at desc limit 50;

  select created_at, business_name, business_type, base_area, capabilities
  from vendor_application where status = 'pending' order by created_at desc;
  ```

- Nothing forwards those rows anywhere yet. That is the next integration to
  build, and it should read from these tables rather than from a form handler.
