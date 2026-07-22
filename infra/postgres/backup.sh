#!/bin/sh
# Nightly logical backup. Runs inside the backup container; see docker-compose.yml.
set -eu

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT="/backups/only2bali-${STAMP}.dump"
RETENTION="${RETENTION_DAYS:-14}"

echo "[backup] starting ${STAMP}"

# -Fc is the custom format: compressed, and restorable selectively with pg_restore.
pg_dump --format=custom --no-owner --no-privileges --file="${OUT}.partial"

# Only publish under the real name once the dump completed, so a half-written
# file is never mistaken for a good backup.
mv "${OUT}.partial" "${OUT}"

SIZE=$(wc -c < "${OUT}")
if [ "${SIZE}" -lt 1024 ]; then
  echo "[backup] ERROR: dump is only ${SIZE} bytes, refusing to treat as valid"
  rm -f "${OUT}"
  exit 1
fi

echo "[backup] wrote ${OUT} (${SIZE} bytes)"

# Prune, but never delete the most recent dump even if it is older than the
# retention window — an old backup beats no backup.
NEWEST=$(ls -1t /backups/only2bali-*.dump 2>/dev/null | head -n 1 || true)
find /backups -name 'only2bali-*.dump' -type f -mtime "+${RETENTION}" | while read -r f; do
  [ "$f" = "$NEWEST" ] && continue
  echo "[backup] pruning $f"
  rm -f "$f"
done

find /backups -name '*.partial' -type f -mtime +1 -delete 2>/dev/null || true

echo "[backup] done"
