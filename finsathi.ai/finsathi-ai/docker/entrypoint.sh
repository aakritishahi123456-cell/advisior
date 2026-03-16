#!/usr/bin/env sh
set -eu

if [ "${MIGRATE_ON_START:-false}" = "true" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  npx prisma migrate deploy
fi

exec "$@"

