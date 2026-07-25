---
description: Crea una migracion de Prisma para el proyecto futbol-platform basada en una descripcion del cambio requerido.
agent: build
---

Create a Prisma migration for futbol-platform based on the described change.

## Migration Description: $ARGUMENTS

## Instructions

1. **Read current schema**: `apps/api/prisma/schema.prisma`

2. **Analyze the request** and determine what schema changes are needed:
   - New model → add full model block with fields, relations, indexes
   - New field → add to existing model with proper type and default
   - New enum → add enum definition and update relevant fields
   - New relation → add foreign key + relation field
   - New index → add `@@index([field])` to model

3. **Apply changes** to `schema.prisma` following conventions:
   - IDs: `String @id @default(cuid())`
   - Timestamps: `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt`
   - Table mapping: `@@map("table_name_snake_case")`
   - Relations: explicit `onDelete` behavior

4. **Generate migration** by running:
   ```bash
   cd apps/api && npx prisma migrate dev --name <description-in-kebab-case>
   ```

5. **Verify** by running:
   ```bash
   cd apps/api && npx prisma generate
   ```

6. **Update seed** if applicable (`apps/api/prisma/seed.ts`)

Use the migration description provided in $ARGUMENTS to create appropriate schema changes.
