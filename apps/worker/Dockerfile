# Build with the monorepo root as context.
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --no-frozen-lockfile --filter @nap-log/worker...
COPY apps/worker apps/worker
RUN pnpm --filter @nap-log/worker build && pnpm --filter @nap-log/worker deploy --prod /prod/worker

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /prod/worker ./
USER node
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:3002/health || exit 1
CMD ["node", "dist/src/index.js"]
