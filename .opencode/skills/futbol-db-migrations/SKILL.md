---
name: futbol-db-migrations
description: Use when creating, modifying, or reviewing Prisma database migrations and schema changes. Covers schema.prisma editing, migration workflow, seed data, relations, enums. Trigger keywords: migration, Prisma, schema, database, model, relation, enum, seed, PostgreSQL.
---

# futbol-db-migrations — Guia de Migraciones de Base de Datos

Stack: Prisma 5 + PostgreSQL.

## Schema Location

`apps/api/prisma/schema.prisma`

## Workflow de Migraciones

1. **Editar schema.prisma** — Agregar/modificar modelos, enums, relaciones
2. **Generar migracion**: `cd apps/api && npx prisma migrate dev --name descripcion`
3. **Verificar**: `npx prisma generate` (regenera client)
4. **Seed si aplica**: `npx tsx prisma/seed.ts`

## Convenciones del Schema

- **IDs**: Siempre `String @id @default(cuid())`
- **Timestamps**: `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt`
- **Tablas**: `@@map("nombre_tabla_snake_case")`
- **Relaciones**: Usar `onDelete: Cascade` o `onDelete: SetNull` segun necesidad
- **Unique constraints**: `@@unique([field1, field2])` para compuestos
- **Enums**: Definir arriba del schema, usar en campos con `@default(valor)`

## Modelos Existentes (14)

User, Tournament, Category, Team, Player, PlayerSubscription, ClubCategory, Referee, Group, GroupTeam, Match, MatchEvent, Bracket, Sanction, Club, ClubNews, ClubGallery, ClubStaff, Field, PlayerCredential, Payment, Member, MemberPlayer, Subscription, Notification

## Enums Existentes (10)

Role, TournamentStatus, MatchStatus, EventType, Position, BracketStage, PhaseType, PaymentType, PaymentStatus, SubscriptionStatus

## Reglas

- Nunca editar migraciones ya aplicadas
- Siempre crear nueva migracion para cambios
- Usar `prisma migrate dev` en desarrollo, `prisma migrate deploy` en produccion
- Antes de deploy: `prisma generate` para regenerar client
- Relations con soft-delete: no usar, usar `active Boolean @default(true)` en su lugar
