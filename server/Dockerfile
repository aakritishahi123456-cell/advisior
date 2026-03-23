FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY server/package*.json ./server/
COPY packages/shared-types/package*.json ./packages/shared-types/

RUN npm ci

COPY server ./server
COPY packages/shared-types ./packages/shared-types

RUN npm run build --workspace=packages/shared-types
RUN npm run db:generate --workspace=server
RUN npm run build --workspace=server

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/packages/shared-types ./packages/shared-types

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3001/health || exit 1

CMD ["node", "server/dist/index.js"]
