FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Prisma CLI includes optional peer deps (React) for Studio; avoid pulling them into the backend image.
RUN npm ci --omit=dev --legacy-peer-deps

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY fundamentalsScraper.js corporateActionsAgent.js newsCollector.js sentimentAgent.js ./
COPY marketWorker.js fundamentalsWorker.js newsWorker.js analysisWorker.js ./
COPY queueConfig.js portfolioOptimizer.js riskCalculator.js portfolioAPI.js ./

# Prisma generate needs DATABASE_URL in Prisma 7 config (safe dummy for build).
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finsathi"
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate

FROM base AS runtime
RUN useradd -m -u 10001 appuser
COPY --from=build /app /app
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R appuser:appuser /app
USER appuser

EXPOSE 5050
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5050)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "src/server.js"]
