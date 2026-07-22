# Deploying Only2Bali to the Hostinger VPS

Everything runs on the one box. Postgres never listens on a public interface.

```
internet ──443──► caddy ──► app:3000 ──► postgres:5432
                (TLS)      (private)    (127.0.0.1 only)
```

**Run every command yourself.** Nobody needs your root password — not a
contractor, not a support agent, not an assistant. If you have already typed it
into a chat window or a ticket, rotate it before you do anything else.

The whole stack was built and run end to end locally before this was written:
the image builds, the app connects to Postgres, `/api/health` returns `ok`, and
`Accept-Language: ta` lands on `/ta`. What follows is the same thing on your box.

---

## 1. Harden the server first

This matters more than anything below it.

```bash
adduser deploy
usermod -aG sudo deploy
```

From **your laptop**, install your key:

```bash
ssh-copy-id deploy@YOUR_VPS_IP
ssh deploy@YOUR_VPS_IP     # confirm it works before the next step
```

Back on the server, turn passwords off:

```bash
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> Keep your current session open and test the new one from a second terminal.
> If you lock yourself out you will need Hostinger's web console to get back in.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose        # 5432 must NOT appear

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

## 3. DNS

Point an **A record** for your domain at the VPS IP, and a second for `www`.
Wait for it to resolve before starting Caddy — certificate issuance fails
otherwise, and Let's Encrypt rate-limits repeated failures.

```bash
dig +short only2bali.com          # must return your VPS IP
```

## 4. Get the code onto the box

```bash
sudo mkdir -p /opt/only2bali && sudo chown deploy:deploy /opt/only2bali
cd /opt/only2bali
git clone https://github.com/srksourabh/only2bali-v3.git .
git checkout fix/sprint-0-security     # until it is merged to main
```

## 5. Configure

```bash
cd /opt/only2bali/infra
cp .env.example .env

openssl rand -base64 36 | tr -d '/+=' | cut -c1-40   # → POSTGRES_PASSWORD
nano .env          # set SITE_DOMAIN, ACME_EMAIL, POSTGRES_PASSWORD, GEMINI_API_KEY

chmod 600 .env
mkdir -p postgres/backups && chmod 700 postgres/backups
chmod +x postgres/backup.sh
```

## 6. Start

```bash
docker compose --env-file .env up -d --build     # first build takes a few minutes
docker compose ps
docker compose logs -f caddy                     # watch the certificate get issued
```

## 7. Apply the schema

The migration is committed and was verified against a real Postgres 17 — 41
tables, 29 enums, 86 indexes, and four business rules enforced as database
constraints.

```bash
cd /opt/only2bali/only2bali-next
npm ci
DATABASE_URL="postgres://only2bali:YOUR_PASSWORD@127.0.0.1:5432/only2bali" \
  npx drizzle-kit migrate
```

Confirm:

```bash
docker compose -f ../infra/docker-compose.yml exec postgres \
  psql -U only2bali -d only2bali -c '\dt' | head -20
```

## 8. Verify

```bash
curl -s https://only2bali.com/api/health          # {"status":"ok","database":"connected",...}
curl -sI https://only2bali.com/en | grep -i strict-transport   # HSTS present
curl -s -o /dev/null -w '%{redirect_url}\n' https://only2bali.com/   # → /en

# The database must NOT be reachable from outside. From your laptop:
nc -vz YOUR_VPS_IP 5432        # must fail. If it connects, stop and fix it.
```

## Updating

```bash
cd /opt/only2bali
git pull
cd infra
docker compose --env-file .env up -d --build app
docker compose logs --tail=50 app
```

Schema changes: generate and review the migration locally, commit it, pull, then
run step 7 again. Never point `drizzle-kit push` at production.

## Backups — test the restore now, not later

Nightly dumps land in `infra/postgres/backups`, kept 14 days. A backup you have
never restored is a hope, not a backup:

```bash
cd /opt/only2bali/infra
docker compose exec postgres createdb -U only2bali restore_test
docker compose exec postgres pg_restore -U only2bali -d restore_test \
  --no-owner --no-privileges /backups/only2bali-YYYYMMDDTHHMMSSZ.dump
docker compose exec postgres psql -U only2bali -d restore_test -c '\dt'
docker compose exec postgres dropdb -U only2bali restore_test
```

Copy them off the machine too — a dump on the same disk as the database does not
survive the disk dying:

```bash
# from your laptop, nightly
rsync -avz deploy@YOUR_VPS_IP:/opt/only2bali/infra/postgres/backups/ ~/only2bali-backups/
```

## Routine

```bash
docker compose ps
docker compose logs --tail=100 app
docker compose exec postgres psql -U only2bali -d only2bali
docker stats --no-stream
df -h                       # a full disk is the classic 3am outage
docker compose pull && docker compose up -d    # patch base images
```

## Things not to do

- **Do not change the Postgres port to `0.0.0.0:5432`.** You will be holding
  passport numbers and traveller contact details.
- **Do not add pgAdmin or Adminer.** A database GUI on a public port is how most
  self-hosted databases get compromised. Use `psql` over SSH.
- **Do not commit `infra/.env`.** It is gitignored; keep it that way.
- **Do not run `drizzle-kit push` against production.** Generate, review, commit,
  migrate.

## Sizing

Postgres is configured for a small box: `shared_buffers=256MB`,
`max_connections=100`. On a 4GB VPS that leaves room for the app and Caddy.
If you move to a larger plan, raise `shared_buffers` to roughly 25% of RAM in
`infra/docker-compose.yml`.
