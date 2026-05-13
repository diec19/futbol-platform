FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json turbo.json ./

COPY apps/api/package.json ./apps/api/
COPY packages/constants/package.json ./packages/constants/
COPY packages/types/package.json ./packages/types/
COPY packages/validations/package.json ./packages/validations/

RUN npm ci

COPY packages ./packages
COPY apps/api ./apps/api

RUN npm run build --workspace=@futbol/api

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/prisma ./apps/api/prisma
COPY --from=base /app/apps/api/package.json ./apps/api/

RUN npm prune --omit=dev

WORKDIR /app/apps/api
CMD npx prisma migrate deploy && node dist/server.js
