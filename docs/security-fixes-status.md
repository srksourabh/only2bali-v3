# Security status

> **This file previously claimed five security fixes that were never applied to the running
> code.** It listed OTP hashing, 6-digit codes, constant-time comparison, audit logging and
> secret removal as "✅ FIXED" while the live views still generated 4-digit plaintext codes and
> compared them with `!=`, and live credentials sat in source.
>
> It was rewritten on 2026-07-22 to state what is actually true. Verify claims here against the
> code before trusting them — that is the lesson this file exists to teach.

Related: `docs/SECURITY.md` (threat model), `docs/planning/todo.md` Sprint 0 (the remaining work).

---

## Actually done (2026-07-22)

### 1. Unauthenticated delete endpoint closed

**Was:** `DeleteJourneyPreferences` (`Backend/journeys/views.py`) declared no
`permission_classes` and looked the record up by ID alone. Any unauthenticated caller could
delete any user's journey by guessing an integer.

**Now:** requires authentication and scopes the lookup to `request.user`. A non-owner receives
the same 404 as a missing ID, so the endpoint does not confirm that a given ID exists.

### 2. Permissions fail closed

**Was:** `REST_FRAMEWORK` set only `DEFAULT_AUTHENTICATION_CLASSES`. A view that forgot
`permission_classes` was silently public — which is exactly how defect 1 happened.

**Now:** `DEFAULT_PERMISSION_CLASSES = IsAuthenticated`. The endpoints that are public by design
(registration, OTP verification, login, logout, password reset, FAQ) declare
`permission_classes = [AllowAny]` explicitly, so being public is now a visible decision rather
than an omission.

### 3. Hardcoded credentials removed from source

**Was:** a live Zoho refresh token, client ID, client secret and access token in
`Backend/journeys/views.py`, and a live SpringEdge SMS API key in
`Backend/users/serializers.py` — including a second copy inside a commented-out function.

**Now:** all read from environment variables. Zoho is being retired: when its variables are
unset the CRM push is skipped and the journey still confirms normally.

> ⚠️ **Removing them from source does not revoke them.** They remain in git history and both
> repositories were public. They must be revoked/rotated at Zoho and SpringEdge — see Sprint 0
> tasks S0.1 and S0.2. Until that is done, treat both as compromised.

### 4. Public AI planner route guarded

**Was:** unauthenticated, unvalidated, no size limit, no timeout, no rate limit, called a paid
model with whatever the caller sent, and returned raw internal error text.

**Now:** rate-limited per IP, 8 KB body cap, Zod-validated input, Zod-validated *model output*
so a malformed response falls back to the curated itinerary instead of being served as a real
plan, 20-second abort, and sanitised error responses. Covered by 28 tests.

### 5. Undeployed FastAPI app deleted

`Backend/app/` had no authentication on any route and its own SQLite database. Its vendor seed
data listed non-vegetarian restaurants — including a suckling-pig specialist recommended for
day-one lunch in an itinerary template — on a platform whose entire promise is 100% vegetarian.
Never deployed, so no customer saw it. Salvageable entries were extracted to `docs/reference/seed-data.md`
before deletion.

### 6. Zoho removed outright (2026-07-23)

**Was:** a Zoho CRM lead push in `Backend/journeys/views.py` and a Zoho Desk ticket endpoint at
`POST /api/users/faq/`. Both had carried hardcoded credentials in a public repository; both had
since been moved to environment variables but left in place.

**Now:** deleted — the CRM push, the token-refresh helpers, the `SendToZohoAPIView` class, its
URL route, and the `ZOHO_*` entries in `Backend/.env.example`. Confirming a journey is a
database write and nothing else. The FAQ endpoint's only caller, the contact form in
`Frontend/src/FaqPage.js`, had already been commented out, so nothing broke.

> ⚠️ Deleting the code still does not revoke the credentials. The Zoho tokens and the SpringEdge
> SMS key remain in git history and must be revoked at the providers — Sprint 0 tasks S0.1 and
> S0.2, both still open.

### 7. Rate limiting no longer resets per instance (2026-07-23)

**Was:** counters in module memory. On Vercel that is one bucket per warm lambda, so spreading
requests across instances multiplied every limit — and each OTP costs money to send.

**Now:** `lib/rate-limit-db.ts` counts in Postgres with a single upsert that advances the window
and increments in the same statement, so concurrent requests cannot both believe they are first.
The in-memory limiter remains as the fallback when the database is unreachable, so an outage
degrades the limit rather than removing it. Covered by the end-to-end test, which asserts the
counter row exists in `rate_limit`.

---

## Still outstanding

### OTP is still weak — the original claim remains false

`Backend/users/views.py` still generates **4-digit** codes with `get_random_string`, stores them
in cache as **plaintext**, and compares with `!=`. That is 10,000 combinations, no attempt cap
on the compare path, and a non-constant-time comparison.

The hardened `OTP`, `OTPAuditLog` and `RateLimitLog` models **do exist** in
`Backend/users/models.py`, fully implemented with SHA-256 hashing, `compare_digest`, attempt
counting and lockout. **They are never imported by any view.** The work is wiring them in, not
writing them.

Tracked as Sprint 0 tasks S0.5 and S0.6.

### Auth rate limiting is minimal

`RegistrationView` has a 5-request / 2-minute cache counter keyed on mobile number only. There
is no IP-based limit and no limit at all on the login path, so OTP-triggered SMS can be flooded
by rotating the identifier. The `RateLimitLog` model that would fix this is unused.

### CORS is effectively open to two public domains

`CORS_ALLOW_ALL_ORIGINS` is not set — that part of the old claim was fair. But
`CORS_ALLOWED_ORIGIN_REGEXES` permits **any** `*.vercel.app` and **any**
`*.azurestaticapps.net` origin, while `CORS_ALLOW_CREDENTIALS = True`. Anyone can deploy a free
subdomain on either host and make credentialed cross-origin requests. The old claim that this
"eliminates CSRF attacks from arbitrary origins" was false.

Narrow the regexes to the specific deployment hostnames.

### JWT in localStorage

The legacy React frontend stores tokens in `localStorage` rather than httpOnly cookies, and
enforces auth per-component across 16+ files with no route guard. The Next.js rebuild uses
httpOnly server sessions instead; this is resolved by retiring the CRA (Sprint 14), not by
patching it.

### Contact details are not yet set — but enquiries are no longer lost

Fixed on 2026-07-23. `only2bali-next/lib/config.ts` now reads
`NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_CONTACT_EMAIL`, rejects the old placeholders
explicitly, and hides the WhatsApp and email buttons when neither is configured.

More importantly, the enquiry and vendor forms write to Postgres (`lead`, `vendor_application`)
*before* opening any external app, so a lead survives the visitor closing the tab and survives
having no WhatsApp number at all.

Still needs the real values pasted into Vercel — see `docs/vercel-handover.md`.

---

## Migrations

The hardened OTP models are defined but check whether their migration has been applied before
relying on them:

```bash
cd Backend
python manage.py makemigrations users
python manage.py migrate users
```
