FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY scripts/check-lockfile.cjs ./scripts/check-lockfile.cjs

# Verifica que el lockfile tenga el arbol transitivo completo antes de instalar
RUN node scripts/check-lockfile.cjs

COPY apps/api/package.json ./apps/api/
COPY packages/constants/package.json ./packages/constants/
COPY packages/types/package.json ./packages/types/
COPY packages/validations/package.json ./packages/validations/

RUN npm ci

COPY packages ./packages
COPY apps/api ./apps/api

RUN npm run build

FROM node:20-bookworm-slim AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/prisma ./apps/api/prisma
COPY --from=base /app/apps/api/package.json ./apps/api/

WORKDIR /app/apps/api
CMD ["node", "dist/server.js"]
