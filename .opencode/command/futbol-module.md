---
description: Genera un modulo completo de la API (router + service + controller + validacion Zod) con el patron establecido del proyecto.
agent: build
---

Generate a complete new API module for futbol-platform following the established patterns.

## Module Name: $ARGUMENTS

## Instructions

1. **Create the module directory**: `apps/api/src/modules/<module-name>/`

2. **Create `<module-name>.router.ts`** following the pattern:
   - Import Express Router, controller, auth middleware, role middleware, validate middleware
   - Import Zod schema from `@futbol/validations`
   - Define routes: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
   - Apply `authenticate` + `authorize` to mutation routes
   - Apply `validate(schema)` to POST/PUT routes

3. **Create `<module-name>.controller.ts`** following the pattern:
   - Import service
   - Each method: try/catch with `next(err)`
   - GET list: `res.json({ data })` or `res.json({ data, meta })`
   - GET by id: `res.json({ data })`
   - POST: `res.status(201).json({ data })`
   - PUT: `res.json({ data })`
   - DELETE: `res.status(204).end()`

4. **Create `<module-name>.service.ts`** following the pattern:
   - Import `db` from config/database and `AppError` from lib/app-error
   - `findAll(query)`: support pagination (page, limit) and filters
   - `findById(id)`: throw AppError 404 if not found
   - `create(data)`: return created item
   - `update(id, data)`: verify exists, then update
   - `remove(id)`: verify exists, then delete

5. **Add Zod schema** to `packages/validations/src/index.ts`:
   - `create<ModuleName>Schema` with proper field validations
   - `update<ModuleName>Schema` as partial of create

6. **Register router** in `apps/api/src/app.ts`:
   - Import and use at `/api/v1/<module-name>`

Use the module name provided in $ARGUMENTS. Use appropriate Prisma model names and field types based on the module purpose.
