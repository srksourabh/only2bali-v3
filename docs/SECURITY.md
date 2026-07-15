# Security model - Only2Bali v3.0

> The real security posture as of 2026-07-16, honestly stated.
>
> **See also `SECURITY_FIXES.md` at the repo root** - it documents the January 2026 OTP
> hardening work in detail. This file is the current whole-system picture and does not
> repeat it.

## What is protected, and what is not

| Surface | Control | Verdict |
|---|---|---|
| Django API | JWT (`IsAuthenticated`) on protected views | Good |
| OTP | SHA-256 hashed, constant-time compare, rate limited, audit logged | **Strong** |
| Rate limiting | Per-mobile and per-IP, progressive 30-min lockout | Good |
| Secrets | Env vars; hard-fail on boot if core ones are missing | Good |
| SQL injection | Django ORM, parameterised | Good |
| CORS | Whitelist **plus** wildcard regexes | **Weak** - see below |
| React routes | None - auth enforced per-component | **Weak** |
| JWT storage | `localStorage`, not httpOnly cookies | **Weak** |
| FastAPI (`Backend/app/`) | **None whatsoever** | **Unacceptable if deployed** |
| Gemini API key | Server-side only, both implementations | Good |
| CI dependency scanning | None | Missing |
| CI tests | None (step is commented out) | Missing |

## Authentication

- **Mechanism**: JWT via `djangorestframework_simplejwt`
- **Tokens**: access 60 min, refresh 1 day. `ROTATE_REFRESH_TOKENS=False`,
  `BLACKLIST_AFTER_ROTATION=True`, `token_blacklist` app installed and used by `LogoutView`
- **Login and registration**: OTP over Twilio SMS, not passwords
- **Storage**: the React client keeps `access_token` and `refresh_token` in
  `localStorage`. This is readable by any XSS payload. httpOnly cookies would be
  stronger, but changing it touches 16+ files - see the note under Known gaps.

## OTP - the strongest part of the system

Hardened in January 2026 (full detail in `SECURITY_FIXES.md`):

- 6-digit (1M combinations), up from 4
- Stored as SHA-256 hash salted with `SECRET_KEY[:16]` - never plaintext
- Constant-time comparison via `secrets.compare_digest` - no timing attack
- Complete audit trail in `OTPAuditLog`: timestamp, IP, user agent, success/failure reason
- Per-mobile and per-IP rate limiting in `RateLimitLog`, with a 30-minute account lockout
- Attempt counting and expiry on the `OTP` model

This is genuinely well built. Do not weaken it.

## Known gaps

Listed in rough priority order. None are currently being exploited as far as we know,
but all are real.

1. **FastAPI has no auth on any route.** `Backend/app/` exposes user creation, trip
   creation, itinerary generation, pricing, vendor matching, and booking - all
   unauthenticated. It is currently mitigated **only by not being deployed**. If anyone
   deploys it as-is, that is an immediate breach. Decide its fate before it ships.
2. **CORS wildcards.** `CORS_ALLOWED_ORIGIN_REGEXES` allows *every* `*.vercel.app` and
   `*.azurestaticapps.net` host. Combined with `CORS_ALLOW_CREDENTIALS = True`, any
   attacker who deploys to Vercel gets a credentialed cross-origin path to the API.
   This is the highest-value fix on the list.
3. **No route guards in the React app.** Auth is checked per-component. A missed check
   in any one of 27 routes is an unprotected page.
4. **JWT in localStorage.** Any XSS becomes a full account takeover. The CRA is being
   retired, so the pragmatic call may be to accept this and make sure Next.js does it
   properly - but that is a decision to make consciously, not by default.
5. **No dependency scanning, no CI tests.** The Azure workflow has a commented-out test
   step. Nothing checks for vulnerable packages.
6. **`Frontend/.env` is committed.** It holds only URLs today - no keys. Keep it that
   way; a future careless commit is the risk.
7. **Hardcoded infra values in `settings.py`**: Twilio phone number, Redis host,
   `FRONTEND_URL`. Not secrets, but they mean config changes need a code deploy.

## Secrets

- **Never commit secrets.** Real values live in Azure App Service configuration and
  Vercel environment variables.
- `settings.py` is authoritative over `.env.example`, which is out of date and names
  several variables incorrectly (`DJANGO_SECRET_KEY` vs the actual `MY_SECRET_KEY`).
- Hard-fail on boot (`os.environ[...]`): `MY_SECRET_KEY`,
  `AZURE_POSTGRESQL_CONNECTIONSTRING`, `WEBSITE_HOSTNAME`
- Soft (`.getenv`): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `REDIS_ACCESS_KEY`,
  `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `GEMINI_API_KEY` - server-side only. It must never be exposed to the browser, and must
  never be prefixed `NEXT_PUBLIC_` or `REACT_APP_`.

## Data we hold

Worth knowing, because it sets the stakes:

- Names, ages, dates of birth, gender, email addresses, mobile numbers (`CustomUser`)
- Travel plans, party composition, dietary and religious preferences (`journeys`)
- IP addresses and user agents (`OTPAuditLog`, `RateLimitLog`)

Dietary and religious preference data (Jain, vegetarian, vegan) is arguably sensitive
personal data under Indian DPDP and EU GDPR. If the product takes EU customers, that
needs a real review - it is not one today.

## If something goes wrong

1. **Stop.** Do not push a fix straight to `main` - it deploys to Azure automatically.
2. Rotate the affected credential first: Azure App Service config, Vercel env vars,
   Twilio console, or Google AI Studio for the Gemini key.
3. Check `OTPAuditLog` and `RateLimitLog` - they hold IPs and user agents and are the
   best forensic trail in the system.
4. Record what happened in `docs/memory.md` under Known issues.
5. Only then fix forward.

## Before any PR that touches input handling, auth, or payments

- [ ] No secret in the diff (check `.env`, `settings.py`, any config file)
- [ ] Input validated at the boundary - serializer on Django, Zod on Next.js
- [ ] No new CORS origin added without justification
- [ ] Gemini key still server-side only
- [ ] OTP hardening not weakened
- [ ] If auth or PII handling changed: escalate. `AGENTS.md` §7 puts that outside
      autonomous authority.
