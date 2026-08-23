#!/usr/bin/env bash
#
# Only2Bali — end-to-end test, one command.
#
#   npm run test:e2e
#
# Brings up Postgres in Docker, applies the schema, seeds the catalogue, starts
# the app on a free port, drives it over HTTP as a browser would, and tears the
# server down again. The database is left running so the next run is fast;
# remove it with `npm run dev:down`.
#
# Nothing here touches production. It refuses to run against a remote database.

set -euo pipefail

CONTAINER="o2b-local-db"
PORT="${O2B_DB_PORT:-55432}"

cd "$(dirname "$0")/.."

say() { printf '\n\033[1;36m==>\033[0m %s\n' "$1"; }
ok()  { printf '    \033[1;32mok\033[0m  %s\n' "$1"; }

say "Database"

# CI supplies its own Postgres as a service container, so Docker is only needed
# on a developer machine. Set O2B_DB_URL to point at an existing instance.
if [ -n "${O2B_DB_URL:-}" ]; then
  URL="$O2B_DB_URL"
  ok "using the database given in O2B_DB_URL"
else
  URL="postgres://only2bali_app:localdev@127.0.0.1:${PORT}/only2bali"

  command -v docker >/dev/null 2>&1 || {
    echo "Docker is not running or not installed. Start Docker Desktop, or set O2B_DB_URL." >&2
    exit 1
  }

  if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" = "true" ]; then
    ok "container $CONTAINER already running on port $PORT"
  elif docker inspect "$CONTAINER" >/dev/null 2>&1; then
    docker start "$CONTAINER" >/dev/null
    ok "restarted existing container $CONTAINER"
  else
    docker run -d --name "$CONTAINER" \
      -p "${PORT}:5432" \
      -e POSTGRES_USER=only2bali_app \
      -e POSTGRES_PASSWORD=localdev \
      -e POSTGRES_DB=only2bali \
      postgres:17-alpine >/dev/null
    ok "created container $CONTAINER on port $PORT"
  fi

  printf '    waiting for postgres'
  for _ in $(seq 1 45); do
    if docker exec "$CONTAINER" pg_isready -U only2bali_app -d only2bali >/dev/null 2>&1; then
      printf '\n'; ok "accepting connections"; break
    fi
    printf '.'; sleep 1
  done
  docker exec "$CONTAINER" pg_isready -U only2bali_app -d only2bali >/dev/null 2>&1 || {
    echo "postgres did not start; try: docker logs $CONTAINER" >&2; exit 1
  }
fi

# Always run it — drizzle-kit tracks what it has applied, so this is idempotent.
DATABASE_URL="$URL" npx --yes drizzle-kit migrate >/dev/null
ok "schema up to date"

# Seeding is idempotent in lib/db/seed.ts, so it is safe to run every time.
DATABASE_URL="$URL" npx --yes tsx lib/db/seed.ts >/dev/null
ok "catalogue seeded"

# The test signs in, so it needs the same secret the server hashes with.
if [ -n "${AUTH_SECRET:-}" ]; then
  : # already supplied, e.g. by CI
elif [ -f .env.local ] && grep -q '^AUTH_SECRET=.\{32,\}' .env.local; then
  AUTH_SECRET=$(grep '^AUTH_SECRET=' .env.local | cut -d= -f2-)
else
  AUTH_SECRET=$(openssl rand -base64 48 2>/dev/null | tr -d '\n' || date +%s%N | sha256sum | head -c 64)
fi
export AUTH_SECRET

say "Application"

# Never reuse whatever is already listening. A server left behind by an earlier
# run answers the readiness probe perfectly well while serving a stale build —
# which reads as fifteen broken pages rather than as one stray process.
find_free_port() {
  node -e '
    const net = require("net");
    (async () => {
      for (let p = Number(process.argv[1]); p < Number(process.argv[1]) + 12; p++) {
        const free = await new Promise((res) => {
          const s = net.createServer();
          s.once("error", () => res(false));
          s.once("listening", () => s.close(() => res(true)));
          s.listen(p);            // no host, so it binds "::" exactly as Next does
        });
        if (free) { console.log(p); return; }
      }
      console.log(0);
    })();
  ' "$1" 2>/dev/null || echo 0
}

if [ -n "${PORT_E2E:-}" ]; then
  APP_PORT="$PORT_E2E"
else
  APP_PORT="$(find_free_port 3901)"
  [ "$APP_PORT" != "0" ] && [ -n "$APP_PORT" ] || {
    echo "no free port between 3901 and 3912. Set PORT_E2E=<port> and retry." >&2
    exit 1
  }
fi

LOG_DIR=".e2e"
mkdir -p "$LOG_DIR"
OUT="$LOG_DIR/server.out.log"
ERR="$LOG_DIR/server.err.log"
: > "$OUT"
: > "$ERR"

# Force the deliberately incomplete webhook placeholder so this local audit can
# prove checkout fails closed without ever creating a live Razorpay order.
DATABASE_URL="$URL" \
RAZORPAY_WEBHOOK_SECRET="replace-with-razorpay-dashboard-webhook-secret" \
npx next dev --port "$APP_PORT" >"$OUT" 2>"$ERR" &
SERVER_PID=$!

stop_server() {
  kill "$SERVER_PID" 2>/dev/null || true

  # Next runs the actual server in a child process. On Windows that child is not
  # in this shell's process group and survives the kill above, so it is found by
  # the port it holds and terminated by its real Windows pid. Left running, it
  # serves a stale build to the next run.
  if command -v netstat >/dev/null 2>&1 && command -v taskkill >/dev/null 2>&1; then
    for pid in $(netstat -ano 2>/dev/null | grep -E "[:.]${APP_PORT}[[:space:]].*LISTENING" \
                 | awk '{print $NF}' | sort -u); do
      [ "$pid" = "0" ] || taskkill //F //PID "$pid" >/dev/null 2>&1 || true
    done
  else
    # Linux and macOS: the child does share the group.
    pkill -P "$SERVER_PID" 2>/dev/null || true
  fi
}
trap stop_server EXIT

printf '    starting on port %s' "$APP_PORT"
READY=""
for _ in $(seq 1 90); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
    READY=yes; printf '\n'; ok "responding"; break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    printf '\n'
    echo "the dev server exited before it was ready. Last lines of $ERR:" >&2
    tail -20 "$ERR" >&2
    exit 1
  fi
  printf '.'; sleep 1
done
[ -n "$READY" ] || { printf '\n'; echo "the app did not become ready in 90s. See $ERR" >&2; exit 1; }

say "End-to-end"
set +e
DATABASE_URL="$URL" \
E2E_BASE_URL="http://127.0.0.1:${APP_PORT}" \
E2E_SERVER_LOG="$OUT" \
npx tsx scripts/e2e.ts
STATUS=$?
set -e

exit "$STATUS"
