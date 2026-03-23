#!/bin/sh
set -eu

APP_ROOT=${APP_ROOT:-/opt/finsathi}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.production.yml}

echo "Deploying FinSathi backend stack from ${APP_ROOT}"
cd "${APP_ROOT}"

if [ ! -f ".env.production" ]; then
  echo ".env.production is required in ${APP_ROOT}"
  exit 1
fi

docker compose --env-file .env.production -f "${COMPOSE_FILE}" pull
docker compose --env-file .env.production -f "${COMPOSE_FILE}" build --pull server
docker compose --env-file .env.production -f "${COMPOSE_FILE}" up -d

echo "Waiting for API health check..."
sleep 10
curl -fsS http://127.0.0.1:${SERVER_PORT:-3001}/health || {
  echo "Health check failed"
  exit 1
}

echo "FinSathi backend stack deployed successfully."
