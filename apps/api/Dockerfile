FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @nap-log/api...
COPY apps/api apps/api
RUN pnpm --filter @nap-log/api prisma:generate && pnpm --filter @nap-log/api build

FROM node:22-alpine AS runtime
WORKDIR /workspace
ENV NODE_ENV=production PORT=3001 HOST=0.0.0.0
RUN apk add --no-cache wget && corepack enable
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/prisma ./apps/api/prisma
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:3001/v1/health/ready || exit 1
CMD ["node", "apps/api/dist/main.js"]
