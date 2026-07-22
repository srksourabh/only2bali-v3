# Security model - Only2Bali v3.0

> The real security posture as of 2026-07-16, verified against the code that runs.
>
> **Do not trust `docs/security-fixes-status.md` at the repo root.** It claims OTP hardening and
> secret removal that were **never wired into the running code**. See "The
> docs/security-fixes-status.md problem" below. This file supersedes it.

## Read this first

Two live problems outrank everything else in this document:

1. **Credentials are committed to source, in repos that were public.** Rotate them now.
2. **The OTP implementation is weak** - 4 digits, stored and compared in plaintext. The
   hardened models exist but nothing calls them.

## What is protected, and what is not

| Surface | Control | Verdict |
|---|---|---|
| Django API | JWT (`IsAuthenticated`) on protected views | Good |
| SQL injection | Django ORM, parameterised | Good |
| Gemini API key | Server-side only, both implementations | Good |
| Django `SECRET_KEY`, DB connection string | Env vars, hard-fail on boot | Good |
| **Zoho credentials** | **Hardcoded in `journeys/views.py`** | **LEAKED** |
| **SpringEdge SMS key** | **Hardcoded in `users/serializers.py`** | **LEAKED** |
| **OTP** | **4-digit, plaintext cache, plaintext compare** | **WEAK** |
| Rate limiting | Cache-based, per-mobile only, fixed window | Partial |
| CORS | Whitelist **plus** wildcard regexes | Weak |
| React routes | None - auth enforced per-component | Weak |
| JWT storage | `localStorage`, not httpOnly cookies | Weak |
| FastAPI (`Backend/app/`) | **None whatsoever** | Unacceptable if deployed |
| CI dependency scanning | None | Missing |
| CI tests | None | Missing |

## 1. Committed credentials - rotate these

Verified present in tracked, committed files. Both repos that contain them
(`caloganathan/Only2bali_v3.0` and the fork `srksourabh/Only2bali_v3.0`) are **public**,
so treat all of these as compromised regardless of what happens next.

| Credential | Location | Action |
|---|---|---|
| Zoho refresh token | `Backend/journeys/views.py:495` | **Revoke + reissue** |
| Zoho client ID | `Backend/journeys/views.py:496` | Rotate alongside the secret |
| Zoho client secret | `Backend/journeys/views.py:497` | **Revoke + reissue** |
| Zoho access token | `Backend/journeys/views.py:537` | Short-lived, but reissue anyway |
| SpringEdge SMS API key | `Backend/users/serializers.py:67` | **Revoke + reissue** |

The Zoho **refresh token** is the serious one. It does not expire on its own - it mints
new access tokens indefinitely until revoked. With the client secret alongside it, anyone
who read the public repo has persistent access to the Zoho CRM, which holds customer
records. The SMS key allows sending SMS billed to the account, and OTP SMS is the login
mechanism.

These have been in git history for many commits (since the `confirm_journey_crm_zoho`
work). **Rotation at the provider is the only fix.** Deleting the lines does not help:
git history retains them, and the repos were public.

`Backend/journeys/views.py:495` carries the comment *"Store this securely (e.g., in
environment variables)"* directly above the hardcoded value. The same three Zoho
credentials are read correctly with `os.getenv` in `Backend/users/views.py:332-334`.
The correct pattern already exists in this codebase - `journeys` just does not use it.
That makes the code fix cheap once the credentials are rotated.

## 2. OTP - weak, despite what docs/security-fixes-status.md claims

The **live** registration and login flow in `Backend/users/views.py`:

| Line | Code | Problem |
|---|---|---|
| 54 | `get_random_string(length=4, allowed_chars='0123456789')` | **4 digits** = 10,000 combinations |
| 56 | `cache.set(cache_key, {"otp": otp, ...})` | **Plaintext** in Redis, not hashed |
| 106 | `if cached_data['otp'] != otp:` | **Plaintext `!=`** - not constant-time |
| 19 | `from .models import CustomUser` | `OTP`, `OTPAuditLog`, `RateLimitLog` **never imported** |

`Backend/users/models.py` **does** define `OTP` (line 51, with SHA-256 hashing),
`OTPAuditLog` (line 25), and `RateLimitLog` (line 114). They are **dead code**. Nothing
in the request path uses them. There is no audit trail, no constant-time comparison, no
hashing, and no per-IP limiting in the flow that actually runs.

The rate limiting that *does* run is cache-based, keyed on mobile number only
(`otp_rate_limit_{mobile_number}`), with a fixed window - no per-IP limit, no
progressive lockout.

**To fix**: wire the existing models into `users/views.py`. The hard part is already
written; it was never connected.

## The docs/security-fixes-status.md problem

`docs/security-fixes-status.md` at the repo root states, with ✅ FIXED markers:

- *"Hardcoded Secrets Removed ... No more credential exposure in GitHub"* - **false.**
  Zoho and SpringEdge credentials remain committed.
- *"Changed from 4-digit to 6-digit OTP"* - **false.** The live path generates 4 digits.
- *"Implemented constant-time comparison (secrets.compare_digest)"* - **false** for the
  live path. Plaintext `!=`.
- *"OTP now verified against hash, never plaintext comparison"* - **false** for the live
  path.
- *"Added complete audit trail with OTPAuditLog"* - the model exists; **nothing writes
  to it.**

The likely explanation: models and migrations were written, but the view layer was never
updated to use them. The document records intent, not outcome.

**This is worse than having no security documentation**, because it moves a live weak
auth path off the risk register. The first version of this very file repeated those
claims as fact, having trusted the document instead of reading the code. Do not delete
`docs/security-fixes-status.md` - leave it, with this correction on record, until the work is
genuinely done.

## Authentication

- **Mechanism**: JWT via `djangorestframework_simplejwt`
- **Tokens**: access 60 min, refresh 1 day. `ROTATE_REFRESH_TOKENS=False`,
  `BLACKLIST_AFTER_ROTATION=True`, `token_blacklist` installed, used by `LogoutView`
- **Login and registration**: OTP over SMS - see the weakness above
- **Storage**: the React client keeps both tokens in `localStorage`, readable by any XSS

## Other known gaps

3. **FastAPI has no auth on any route.** `Backend/app/` exposes user creation, trips,
   itineraries, pricing, vendor matching, and booking unauthenticated. Mitigated **only
   by not being deployed**. Do not deploy it as-is.
4. **CORS wildcards.** `CORS_ALLOWED_ORIGIN_REGEXES` allows every `*.vercel.app` and
   `*.azurestaticapps.net`, with `CORS_ALLOW_CREDENTIALS = True`. Anyone who deploys to
   Vercel gets a credentialed cross-origin path to the API.
5. **No route guards in the React app.** Auth is checked per component across 16+ files.
6. **No dependency scanning, no CI tests.**
7. **`Frontend/.env` is committed.** URLs only today - keep it that way.

## Secrets - the actual rules

- `settings.py` is authoritative over `.env.example`, which is out of date and misnames
  variables (`DJANGO_SECRET_KEY` vs the real `MY_SECRET_KEY`).
- Hard-fail on boot: `MY_SECRET_KEY`, `AZURE_POSTGRESQL_CONNECTIONSTRING`,
  `WEBSITE_HOSTNAME`
- Soft: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `REDIS_ACCESS_KEY`,
  `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `GEMINI_API_KEY` - server-side only. Never `NEXT_PUBLIC_` or `REACT_APP_`.
- **Zoho and SpringEdge do not follow these rules today.** See section 1.

## Data we hold

- Names, ages, dates of birth, gender, emails, mobile numbers (`CustomUser`)
- Travel plans, party composition, dietary and religious preferences (`journeys`)
- Whatever is synced to Zoho CRM - which the leaked refresh token reaches

Dietary and religious preference data (Jain, vegetarian, vegan) is arguably sensitive
personal data under India's DPDP Act and the GDPR. The leaked Zoho credentials therefore
carry more than commercial risk.

## If something goes wrong

1. **Stop.** Do not push a fix straight to `main` on the original repo - it auto-deploys.
2. Rotate the affected credential **at the provider**: Zoho API console, SpringEdge
   dashboard, Twilio console, Azure App Service config, Vercel env vars, or Google AI
   Studio.
3. Removing a secret from code does **not** revoke it. Only the provider can. Git history
   and public forks retain it forever.
4. `OTPAuditLog` and `RateLimitLog` are **empty** - nothing writes to them. There is no
   OTP forensic trail. Azure App Service logs are the fallback.
5. Record what happened in `docs/memory.md`.

## Before any PR that touches input handling, auth, or payments

- [ ] No secret in the diff - and check whether you are *reading* one that is hardcoded
- [ ] Input validated at the boundary - serializer on Django, Zod on Next.js
- [ ] No new CORS origin without justification
- [ ] Gemini key still server-side only
- [ ] **Claims about security controls verified against the code that runs**, not against
      a document asserting they exist. That mistake produced the first version of this
      file.
- [ ] If auth or PII handling changed: escalate. `AGENTS.md` §7 puts that outside
      autonomous authority.
