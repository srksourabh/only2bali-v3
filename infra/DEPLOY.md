# Deploying Only2Bali

**Database** on the Hostinger VPS. **Website** on Vercel.

```
browser ──► Vercel (Next.js) ──TLS + client certificate──► VPS:5432 ──► postgres
```

**Run every command yourself.** Nobody needs your root password — not a
contractor, not a support agent, not an assistant. If it has already gone into a
chat window, a ticket or a notes app, rotate it before you start.

---

## The problem this setup solves

Vercel's outbound IP addresses are dynamic on Hobby and Pro, so you cannot put
the VPS firewall in front of Postgres and allowlist "just Vercel". The port has
to accept connections from anywhere.

A strong password alone is therefore not enough: `DATABASE_URL` sits in the
Vercel dashboard, in build logs, in local `.env` files, and in whatever laptop
last cloned the repo. Any one of those leaking would hand over the database.

So Postgres is configured with **`clientcert=verify-full`**. A connection must
present a certificate signed by *your* CA before a password is even considered.

This was tested against a real Postgres 17 before this guide was written:

| Attempt | Result |
|---|---|
| Plaintext, no certificate | refused — no `pg_hba` entry |
| TLS, **correct password**, no client certificate | **refused — "connection requires a valid client certificate"** |
| TLS without verifying the server | refused |
| Mutual TLS, wrong password | refused |
| Mutual TLS, correct password | connected |

The second row is the one that matters. A stolen `DATABASE_URL` is not enough.

---

## 1. Harden the VPS

More important than anything below it.

```bash
adduser deploy
usermod -aG sudo deploy
```

From **your laptop**:

```bash
ssh-copy-id deploy@YOUR_VPS_IP
ssh deploy@YOUR_VPS_IP        # confirm this works before the next step
```

Back on the server:

```bash
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> Keep your existing session open and test the new one from a second terminal.
> Locking yourself out means recovering through Hostinger's web console.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 5432/tcp comment 'postgres, mTLS-gated'
sudo ufw enable
sudo ufw status verbose

sudo apt update && sudo apt install -y fail2ban unattended-upgrades
sudo systemctl enable --now fail2ban
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## 2. Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy      # log out and back in
docker --version && docker compose version
```

## 3. A hostname for the database

The client verifies the server certificate against the name it dialled, so use a
DNS name rather than a bare IP — it lets you move the box later without reissuing
certificates.

Add an A record, e.g. `db.only2bali.com` → your VPS IP.

```bash
dig +short db.only2bali.com     # must return the VPS IP before step 5
```

## 4. Code onto the box

```bash
sudo mkdir -p /opt/only2bali && sudo chown deploy:deploy /opt/only2bali
cd /opt/only2bali
git clone https://github.com/srksourabh/only2bali-v3.git .
git checkout fix/sprint-0-security      # until it is merged
```

## 5. Certificates

```bash
cd /opt/only2bali/infra/postgres
chmod +x generate-certs.sh
./generate-certs.sh db.only2bali.com    # must match the hostname exactly
```

This creates `certs/` containing the CA, the server pair and the client pair.
The client certificate's CN is `only2bali_app`, which **must** equal the Postgres
role name.

The script prints the base64 blobs for Vercel. Print the private key when you are
ready to paste it:

```bash
base64 -w0 certs/client.key
```

Then remove the client material from the server — only Vercel needs it, and a
client key sitting next to the database defeats the purpose:

```bash
shred -u certs/client.key certs/client.crt
```

> Keep `certs/ca.key` safe and offline. It is what lets you issue a replacement
> client certificate. If it leaks, anyone can mint a client and your mTLS is
> worthless — regenerate everything.

## 6. Start Postgres

```bash
cd /opt/only2bali/infra
cp .env.example .env
openssl rand -base64 36 | tr -d '/+=' | cut -c1-40    # → POSTGRES_PASSWORD
nano .env
chmod 600 .env
mkdir -p postgres/backups && chmod 700 postgres/backups
chmod +x postgres/backup.sh

docker compose --env-file .env up -d
docker compose ps
docker compose logs --tail=40 postgres
```

Confirm TLS is actually on:

```bash
docker compose exec postgres psql -U only2bali_app -d only2bali -c 'show ssl;'
# ssl | on
```

## 7. Apply the schema

From your laptop, through an SSH tunnel so the migration never crosses the
public internet:

```bash
ssh -L 5433:127.0.0.1:5432 deploy@YOUR_VPS_IP
# leave open; in another terminal:
cd only2bali-next
DATABASE_URL="postgres://only2bali_app:PASSWORD@127.0.0.1:5433/only2bali" \
  npx drizzle-kit migrate
```

41 tables, 29 enums, 86 indexes, four business rules as database constraints.

## 8. Vercel

Import the repo with **Root Directory = `only2bali-next`**. Leaving it blank
builds the legacy CRA instead, which is what the current production site does.

Environment variables (Production and Preview):

| Name | Value |
|---|---|
| `DATABASE_URL` | `postgres://only2bali_app:PASSWORD@db.only2bali.com:5432/only2bali` |
| `PGSSL_CA` | base64 of `ca.crt` |
| `PGSSL_CERT` | base64 of `client.crt` |
| `PGSSL_KEY` | base64 of `client.key` |
| `GEMINI_API_KEY` | your key |

Deploy, then:

```bash
curl -s https://YOUR-APP.vercel.app/api/health
# {"status":"ok","database":"connected", ...}
```

If it reports `degraded`, check the Vercel function logs. The usual causes are a
hostname that does not match the certificate's SAN, or one of the three PEM
variables missing — the app deliberately refuses to fall back to password-only
against a remote host rather than downgrading silently.

## 9. Verify the lock actually holds

From your laptop, with `psql` installed:

```bash
# Correct password, no client certificate. This MUST fail.
psql "postgres://only2bali_app:PASSWORD@db.only2bali.com:5432/only2bali?sslmode=require"
# expected: FATAL: connection requires a valid client certificate
```

If that connects, your `pg_hba.conf` is not being used — stop and fix it before
putting real customer data in.

## Backups — do the restore drill now

Nightly dumps land in `infra/postgres/backups`, kept 14 days.

```bash
cd /opt/only2bali/infra
docker compose exec postgres createdb -U only2bali_app restore_test
docker compose exec postgres pg_restore -U only2bali_app -d restore_test \
  --no-owner --no-privileges /backups/only2bali-YYYYMMDDTHHMMSSZ.dump
docker compose exec postgres psql -U only2bali_app -d restore_test -c '\dt'
docker compose exec postgres dropdb -U only2bali_app restore_test
```

Copy them off the box — a dump on the same disk as the database does not survive
the disk:

```bash
rsync -avz deploy@YOUR_VPS_IP:/opt/only2bali/infra/postgres/backups/ ~/only2bali-backups/
```

## Certificate renewal

The leaf certificates last 825 days. Put a calendar reminder at 24 months — an
expired certificate takes the whole site down, and the error message is not
obvious.

```bash
openssl x509 -in certs/server.crt -noout -enddate
```

## Watch the logs

`log_connections=on` is enabled, so every attempt is recorded. Rejected
certificate attempts look like this:

```bash
docker compose logs postgres | grep -i "certificate"
```

A steady trickle of failures is internet background noise. A sustained burst
from one address is worth a `ufw deny from`.

## Things not to do

- **Do not remove the TLS flags and leave the port open.** They are the only
  thing standing between the internet and your customer data.
- **Do not set `sslmode=disable` or `rejectUnauthorized: false`** to "make it
  work". If verification fails, the certificate or the hostname is wrong.
- **Do not add pgAdmin or Adminer.** A database GUI on a public port is how most
  self-hosted databases get compromised.
- **Do not commit `infra/.env` or anything under `certs/`.** Both are gitignored.
- **Do not run `drizzle-kit push` against production.** Generate, review, commit,
  migrate.

## The honest trade-off

This is materially safer than password-only, but the port is still reachable from
the internet, so you own the patching. Subscribe to the PostgreSQL security
announce list and apply updates promptly:

```bash
docker compose pull && docker compose up -d
```

If that upkeep stops happening, move to managed Postgres (Neon, Supabase) and the
whole class of problem goes away.

## Optional: self-hosting the app instead

`only2bali-next/Dockerfile` and `infra/caddy/Caddyfile` are kept for the fallback
where the app also runs on the VPS. In that topology Postgres goes back to
`127.0.0.1` and needs no certificates at all. Build with `DOCKER_BUILD=1`.
