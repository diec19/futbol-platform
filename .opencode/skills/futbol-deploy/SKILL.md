---
name: futbol-deploy
description: Use when deploying, configuring Docker, Railway, CI/CD, or managing environment variables for futbol-platform. Trigger keywords: deploy, Docker, Railway, CI/CD, environment, variables, build, production, docker-compose.
---

# futbol-deploy — Guia de Deployment

## Stack de Deployment

- **Plataforma**: Railway (via `railway.toml`)
- **Container**: Docker (via `Dockerfile` + `docker-compose.yml`)
- **Monorepo**: Turborepo build pipeline

## Archivos de Config

### Dockerfile (multi-stage)

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

### docker-compose.yml

```yaml
services:
  api:
    build: .
    ports: ["3001:3001"]
    env_file: .env
    depends_on: [db]
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: futbol
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes: [pgdata:/var/lib/postgresql/data]
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
volumes:
  pgdata:
```

### railway.toml

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "sh -c 'npx prisma migrate deploy && node dist/server.js'"
healthcheckPath = "/api/v1/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

## Variables de Entorno

### API (apps/api/.env)

```
DATABASE_URL=postgresql://user:pass@host:5432/futbol
JWT_SECRET=<hex de 128 chars>
JWT_REFRESH_SECRET=<hex de 128 chars>
PORT=3001
NODE_ENV=production
MP_ACCESS_TOKEN=<MercadoPago token>
MP_WEBHOOK_SECRET=<webhook secret>
```

### Admin (apps/admin/.env.local)

```
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1
```

## Commands Utiles

```bash
# Desarrollo local
docker-compose up -d          # Levantar DB + Redis
npm run dev                   # Todos los apps en dev

# Build
npm run build                 # Build todos los apps
turbo run build --filter=@futbol/api  # Solo API

# Deploy
railway up                    # Deploy a Railway
railway logs                  # Ver logs

# DB
npx prisma migrate dev        # Migracion local
npx prisma migrate deploy     # Migracion production
npx prisma studio             # GUI de DB
```

## CI/CD (GitHub Actions - por crear)

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```
