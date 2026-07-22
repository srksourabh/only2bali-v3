#!/usr/bin/env bash
# Removes the local development database and its data.
set -euo pipefail
CONTAINER="o2b-local-db"
if docker inspect "$CONTAINER" >/dev/null 2>&1; then
  docker rm -f "$CONTAINER" >/dev/null
  echo "removed $CONTAINER and its data"
else
  echo "$CONTAINER does not exist"
fi
