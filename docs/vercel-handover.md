# Taking production onto your own Vercel account

> Written 2026-07-23. Everything here is a human action — it cannot be done from
> the codebase, which is why it has stayed open.

## Why this blocks other work

`only2bali-v3-0.vercel.app` is deployed from **caloganathan's** Vercel account.
While that is true you cannot:

- set `NEXT_PUBLIC_WHATSAPP_NUMBER` or `NEXT_PUBLIC_CONTACT_EMAIL`, so the site
  keeps rendering with no contact buttons,
- set `RESEND_API_KEY`, so nobody can sign in,
- set `DATABASE_URL` or the three `PGSSL_*` values, so the app has no database,
- roll back a bad deploy of your own product.

Everything else that is still open depends on this one step.

## Steps

1. **Create the project.** vercel.com → Add New → Project → import
   `srksourabh/only2bali-v3`.

2. **Set Root Directory to `only2bali-next`.** This is the single most important
   setting on the page. Left blank, Vercel reads the root `vercel.json`, which
   builds `Frontend/` — the legacy React app. You will deploy the old site and
   spend an afternoon wondering why nothing changed.

3. **Add the environment variables** (Settings → Environment Variables), for
   Production and Preview. Names and meanings are in
   `only2bali-next/.env.example`.

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
