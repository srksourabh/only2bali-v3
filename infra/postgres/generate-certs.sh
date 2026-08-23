#!/usr/bin/env bash
# Creates the certificate chain that lets Vercel reach this Postgres safely.
#
#   ca.crt / ca.key        your own certificate authority
#   server.crt / server.key  presented by Postgres, proves the server is yours
#   client.crt / client.key  presented by the app, proves the client is yours
#
# Because Postgres is configured with clientcert=verify-full, a connection
# without a certificate signed by this CA is refused before any password is
# considered. A leaked password on its own is not enough to get in.
#
# Run on the VPS:  ./generate-certs.sh only2bali-db.example.com
set -euo pipefail

CN_SERVER="${1:-}"
if [ -z "$CN_SERVER" ]; then
  echo "usage: $0 <server-hostname-or-ip>" >&2
  echo "  must match exactly what the app connects to, or verify-full fails" >&2
  exit 1
fi

DIR="$(cd "$(dirname "$0")" && pwd)/certs"
DAYS_CA=3650
DAYS_LEAF=825          # keep under the 825-day practical maximum
CLIENT_CN="only2bali_app"   # must equal the Postgres role name

mkdir -p "$DIR"
cd "$DIR"

if [ -f ca.key ]; then
  echo "certs/ca.key already exists — refusing to overwrite an existing CA."
  echo "Delete the certs directory deliberately if you really mean to start over."
  exit 1
fi

echo "==> certificate authority"
openssl req -new -x509 -nodes -newkey rsa:4096 -days "$DAYS_CA" \
  -keyout ca.key -out ca.crt \
  -subj "/CN=Only2Bali Internal CA"

echo "==> server certificate for ${CN_SERVER}"
openssl req -new -nodes -newkey rsa:2048 \
  -keyout server.key -out server.csr \
  -subj "/CN=${CN_SERVER}"

# subjectAltName is what modern clients actually check; CN alone is ignored.
if [[ "$CN_SERVER" =~ ^[0-9.]+$ ]]; then
  SAN="IP:${CN_SERVER}"
else
  SAN="DNS:${CN_SERVER}"
fi
printf 'subjectAltName=%s\nbasicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n' "$SAN" > server.ext

openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days "$DAYS_LEAF" -sha256 -extfile server.ext

echo "==> client certificate (CN must equal the Postgres role: ${CLIENT_CN})"
openssl req -new -nodes -newkey rsa:2048 \
  -keyout client.key -out client.csr \
  -subj "/CN=${CLIENT_CN}"

printf 'basicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=clientAuth\n' > client.ext

openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out client.crt -days "$DAYS_LEAF" -sha256 -extfile client.ext

echo "==> backup certificate (dedicated key, same database role)"
openssl req -new -nodes -newkey rsa:2048 \
  -keyout backup.key -out backup.csr \
  -subj "/CN=${CLIENT_CN}"

openssl x509 -req -in backup.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out backup.crt -days "$DAYS_LEAF" -sha256 -extfile client.ext

rm -f server.csr client.csr backup.csr server.ext client.ext ca.srl

# Postgres refuses to start if the server key is group- or world-readable.
chmod 600 server.key client.key backup.key ca.key
chmod 644 server.crt client.crt backup.crt ca.crt
# postgres:17-alpine runs as uid 70. (The Debian-based postgres:17 image uses
# 999 instead — if you switch images you must change this, or Postgres refuses
# to start with "private key file must be owned by the database user or root".)
chown 70:70 server.key server.crt ca.crt 2>/dev/null || \
  sudo chown 70:70 server.key server.crt ca.crt

echo
echo "Done. Files in $DIR"
echo
echo "Put these three into Vercel as environment variables."
echo "Base64 so the newlines survive the dashboard:"
echo
echo "  PGSSL_CA   = $(base64 -w0 ca.crt 2>/dev/null || base64 ca.crt | tr -d '\n')"
echo
echo "  PGSSL_CERT = $(base64 -w0 client.crt 2>/dev/null || base64 client.crt | tr -d '\n')"
echo
echo "  PGSSL_KEY  = (printed separately, keep it secret)"
echo
echo "Run this to print the key when you are ready to paste it:"
echo "  base64 -w0 $DIR/client.key"
echo
echo "Then delete client.key and client.crt from the server — the app is the"
echo "only thing that needs them, and a client key sitting next to the database"
echo "defeats the point."
