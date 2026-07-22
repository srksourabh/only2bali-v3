# PostgreSQL on the Hostinger VPS

Everything here you run yourself on the server. Nobody needs your root password —
not a tool, not an assistant, not a contractor. If you have already typed it into
a chat window, a ticket, or a notes app, rotate it before doing anything else.

---

## Before you start: harden the box

If this VPS is fresh, do these first. They matter more than the database config.

```bash
# 1. A non-root user with sudo. Stop using root for daily work.
adduser deploy
usermod -aG sudo deploy

# 2. Your SSH public key, so you can turn passwords off entirely.
#    Run this ON YOUR LAPTOP, not on the server:
#    ssh-copy-id deploy@YOUR_VPS_IP

# 3. Then, on the server, disable password login and root login:
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> Keep your current SSH session open while you test the new one from a second
> terminal. If you lock yourself out, you need Hostinger's console to recover.

```bash
# 4. Firewall. Default deny inbound, allow only SSH and web.
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose      # confirm 5432 is NOT listed

# 5. Brute-force protection and unattended security updates.
sudo apt update && sudo apt install -y fail2ban unattended-upgrades
sudo systemctl enable --now fail2ban
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy      # log out and back in for this to take effect
docker --version && docker compose version
```

## Bring up Postgres

```bash
sudo mkdir -p /opt/only2bali && sudo chown deploy:deploy /opt/only2bali
cd /opt/only2bali

# Copy docker-compose.yml, backup.sh and .env.example from infra/postgres/ in
# the repo — scp them, or clone the repo and symlink.

cp .env.example .env
openssl rand -base64 36 | tr -d '/+=' | cut -c1-40   # paste into POSTGRES_PASSWORD
chmod 600 .env
mkdir -p backups && chmod 700 backups
chmod +x backup.sh

docker compose --env-file .env up -d
docker compose ps
docker compose logs -f postgres      # Ctrl-C once you see "database system is ready"
```

### Verify it is not exposed

```bash
# Should show 127.0.0.1:5432, NOT 0.0.0.0:5432
sudo ss -tlnp | grep 5432

# From your laptop this must fail to connect. If it succeeds, stop and fix it.
nc -vz YOUR_VPS_IP 5432
```

## Letting the app reach the database

The port is bound to loopback, so the app has to get inside the box. Pick one.

### A. Run the Next.js app on the same VPS (recommended with this setup)

Postgres never leaves `127.0.0.1`. The app connects over the Docker network with
`DATABASE_URL=postgres://only2bali:PASSWORD@postgres:5432/only2bali`. Nothing about
the database is reachable from the internet, ever. Caddy or nginx terminates TLS
in front of the app.

This is the simplest thing that is actually secure.

### B. Keep the app on Vercel, tunnel to the VPS

Vercel's outbound IPs are not static unless you are on an Enterprise plan with
dedicated egress, so an IP allowlist is not available to you. That leaves either
publishing Postgres to the internet with TLS (real, ongoing risk — a single weak
password or an unpatched CVE is a full data breach) or running a tunnel such as
Cloudflare Tunnel or Tailscale between Vercel and the VPS.

If you go this way, do **not** simply change the port binding to `0.0.0.0`.

### C. Managed Postgres instead

Neon or Supabase. Costs money at scale, but patching, backups, failover and
connection pooling stop being your job. Worth pricing before committing to A or B.

## Restore — test this before you need it

A backup you have never restored is a hope, not a backup. Do this once now.

```bash
# List what you have
ls -lh /opt/only2bali/backups/

# Restore into a scratch database and confirm the tables are there
docker compose exec postgres createdb -U only2bali restore_test
docker compose exec postgres pg_restore -U only2bali -d restore_test \
  --no-owner --no-privileges /backups/only2bali-YYYYMMDDTHHMMSSZ.dump
docker compose exec postgres psql -U only2bali -d restore_test -c '\dt'
docker compose exec postgres dropdb -U only2bali restore_test
```

Copy backups off the machine as well. A dump sitting on the same disk as the
database does not survive the disk.

```bash
# From your laptop, nightly:
rsync -avz deploy@YOUR_VPS_IP:/opt/only2bali/backups/ ~/only2bali-backups/
```

## Applying migrations

From your laptop, with an SSH tunnel so nothing is exposed:

```bash
ssh -L 5433:127.0.0.1:5432 deploy@YOUR_VPS_IP
# leave that open, then in another terminal:
cd only2bali-next
DATABASE_URL="postgres://only2bali:PASSWORD@127.0.0.1:5433/only2bali" npm run db:migrate
```

## Routine operations

```bash
docker compose ps                       # status
docker compose logs --tail=100 postgres # recent logs
docker compose exec postgres psql -U only2bali -d only2bali   # a shell
sh backup.sh                            # force a backup now (inside the container)
docker compose pull && docker compose up -d   # patch to the latest 17.x

# Disk — Postgres failing on a full disk is the classic 3am outage
df -h /var/lib/docker
```

## What is deliberately not here

- **No pgAdmin or Adminer container.** A database GUI on a public port is how
  most self-hosted databases get owned. Use `psql` over SSH.
- **No `POSTGRES_HOST_AUTH_METHOD=trust`.** Ever.
- **No port 5432 in the firewall rules.** If you find yourself opening it, re-read
  "Letting the app reach the database" first.
