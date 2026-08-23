<div align="center">

# Only2Bali

**Verified vegetarian, Jain and vegan group travel from India to Bali.**

Every meal on every itinerary carries a compliance rating before the traveller
sees it. Guides speak the traveller's own language. Seven of them.

</div>

---

## Why this exists

Indian travellers going to Bali face a specific problem that generic operators
treat as a footnote: food. "Veg option available" is not the same as a kitchen
that understands no onion, no garlic, no root vegetable — and a family that keeps
Jain protocol cannot find that out after they land.

Competitors sell Bali packages with a vegetarian filter. Only2Bali sells a
**verified** guarantee, per meal, with the method published.

## Quick start

```bash
cd only2bali-next
npm install
npm run dev:local
```

That one command starts Postgres in Docker, applies the schema, seeds the
catalogue, generates a local secret and runs the dev server. It prints the URL it
chose — port 3000 is often already taken.

**To sign in** there is no password, by design. Enter any email address; the
six-digit code is printed to the terminal.

```bash
npm run dev:down     # remove the local database when you are done
```

## Repository layout

```
only2bali-next/     The product — Next.js 15, 7 languages, Postgres, passwordless auth
infra/              Postgres on the VPS: compose, mutual TLS, backups, bootstrap
docs/               Architecture, security, planning, decisions
```

The legacy Create React App frontend and the Django backend were retired in
August 2026 and archived outside the repository (with their `node_modules`
stripped). The product lives entirely in `only2bali-next/`.

## Architecture

```
browser ──► Vercel (Next.js) ──mutual TLS──► Hostinger VPS ──► PostgreSQL 17
```

The database is self-hosted and reachable from the internet, because Vercel's
outbound addresses are dynamic and cannot be allowlisted. It is protected by
**client-certificate authentication** — Postgres refuses any connection that
cannot present a certificate signed by our own CA, so a leaked `DATABASE_URL` on
its own gets an attacker nothing.

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 App Router, server components by default |
| Languages | English, हिन्दी, தமிழ், ગુજરાતી, తెలుగు, ಕನ್ನಡ, मराठी |
| Database | PostgreSQL 17, Drizzle ORM, 41 tables |
| Auth | Passwordless OTP, hashed sessions in httpOnly cookies |
| Hosting | Vercel (app) + Hostinger VPS (database) |
| Tests | Vitest — 79 unit tests, plus a 38-check database verifier |

## Commands

| Command | What it does |
|---|---|
| `npm run dev:local` | Everything: database, schema, seed, dev server |
| `npm run dev:down` | Remove the local database |
| `npm test` | 79 unit tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run db:verify` | 38 checks against whatever `DATABASE_URL` points at |
| `npm run db:seed` | Seed circuits, packages, departures |
| `npm run db:generate` | Generate a migration from schema changes |

Run these from `only2bali-next/`.

## Deployment

The database goes up first. On the VPS:

```bash
sudo bash infra/postgres/bootstrap.sh db.only2bali.com
```

It generates the certificates, starts Postgres with mutual TLS, applies the
schema, seeds the catalogue, verifies the result, and prints the values to paste
into Vercel. Everything runs on that machine — no password travels anywhere else.

Full runbook, including server hardening and the restore drill:
[`infra/DEPLOY.md`](infra/DEPLOY.md).

> **Trap:** the root `vercel.json` builds `Frontend/`, the legacy CRA. If you
> connect Vercel to Git without setting Root Directory to `only2bali-next`, you
> will deploy the old site.

## Documentation

Start at [`docs/README.md`](docs/README.md).

| Document | For |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the pieces fit, and where the traps are |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Threat model and current posture |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Tokens, typography, the Indonesian motifs |
| [`docs/planning/marketplace-spec.md`](docs/planning/marketplace-spec.md) | The full product specification |
| [`docs/planning/todo.md`](docs/planning/todo.md) | Sequenced execution list |
| [`docs/adr/`](docs/adr/) | Architecture decision records |

## Status

Working: the site in seven languages, the design system, the database schema and
seed, passwordless auth, login and `/account`, and the deployment tooling.

Not yet working in production: **login cannot deliver codes** until an email or
SMS provider is configured. That refusal is deliberate — it fails loudly rather
than silently sending nothing.

> ### Security notice
>
> Zoho and SpringEdge credentials were committed to this repository's history
> while it was public. They have been removed from the code and moved to
> environment variables, but **removing them from source does not revoke them.**
> They must be revoked and rotated at the providers. See
> [`docs/security-fixes-status.md`](docs/security-fixes-status.md).

## Licence

Private and proprietary. All rights reserved.
