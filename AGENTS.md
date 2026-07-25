# futbol-platform — Guia del Proyecto

## Descripcion General

Plataforma de gestion de futbol/ deportes. Monorepo con 3 aplicaciones y 3 paquetes compartidos.

## Arquitectura

```
futbol-platform/
├── apps/
│   ├── api/          → Express + Prisma + PostgreSQL (REST API)
│   ├── admin/        → Next.js 14 + React 18 + Tailwind (Dashboard)
│   └── mobile/       → Expo 51 + React Native (App jugadores)
├── packages/
│   ├── types/        → Tipos TypeScript compartidos
│   ├── constants/    → Labels, enums, valores constantes
│   └── validations/  → Schemas Zod para validacion
└── turbo.json        → Configuracion de Turborepo
```

## Stack Tecnologico

- **Backend**: Express 4, Prisma 5, PostgreSQL, Zod, JWT, MercadoPago
- **Frontend**: Next.js 14 (App Router), React 18, TanStack Query, Tailwind CSS
- **Mobile**: Expo SDK 51, React Native 0.74, React Navigation 6
- **Build**: Turborepo, TypeScript 5.5
- **Deploy**: Docker, Railway

## Comandos Principales

```bash
npm run dev              # Todos los apps en desarrollo
npm run build            # Build completo
npm run lint             # Lint completo
npm run db:migrate       # Migracion de Prisma
npm run db:studio        # GUI de base de datos
npm run db:seed          # Datos de prueba
```

## Modulos de la API (15)

auth, tournaments, categories, teams, players, referees, matches, standings, brackets, statistics, sanctions, club, members, webhooks, notifications

## Convenciones de Codigo

- **API**: Patron router → controller → service. Usar `AppError` para errores.
- **Admin**: Paginas con `'use client'`, datos via TanStack Query, UI con Tailwind.
- **Mobile**: Screens funcionales, estilos con `StyleSheet.create()`, datos via fetch.
- **DB**: IDs con cuid(), timestamps automaticos, soft-delete via `active` boolean.
- **Shared**: Tipos en `@futbol/types`, constants en `@futbol/constants`, schemas en `@futbol/validations`.

## Variables de Entorno

### API
- `DATABASE_URL` — Connection string PostgreSQL
- `JWT_SECRET` — Secret para access tokens
- `JWT_REFRESH_SECRET` — Secret para refresh tokens
- `PORT` — Puerto del servidor (default: 3001)
- `MP_ACCESS_TOKEN` — Token de MercadoPago
- `MP_WEBHOOK_SECRET` — Secret de webhooks MercadoPago

### Admin
- `NEXT_PUBLIC_API_URL` — URL base de la API

## Seguridad

- `.env` en `.gitignore` — Nunca commitear secrets
- JWT con expiracion (15min access, 7d refresh)
- Roles: SUPER_ADMIN, ADMIN, OPERATOR, DELEGATE
- CORS configurado por环境
- Helmet para headers de seguridad
