# ADR: Admin-managed integration settings

**Date:** 2026-08-07  
**Status:** Accepted

## Decision

Store integration API keys (Resend, SpringEdge, Gemini, Razorpay, Blob, contact,
and Zoho placeholders) in Postgres table `app_setting`, encrypted with
AES-256-GCM keyed by `AUTH_SECRET`. Admin UI at `/[lang]/admin/settings`.
Runtime resolution: database value if present, else environment variable.

## Why

Operators asked to paste keys in-product rather than only via Vercel env.
Deploy-time secrets remain valid as fallback so existing Vercel config is not
broken.

## Consequences

- Rotating `AUTH_SECRET` seals existing ciphertext; re-paste keys after rotation.
- Zoho keys are stored but not wired (CRM deleted); UI states this.
- `AUTH_SECRET`, `DATABASE_URL`, and mTLS PEMs stay deploy-only — not editable here.
- Health, OTP delivery, payments, uploads, and planner read via `getSetting()`.
