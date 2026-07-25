---
name: futbol-api-dev
description: Use when developing new API modules, endpoints, services, or controllers in apps/api. Covers Express + Prisma + Zod patterns, router/service/controller architecture, and validation schemas. Trigger keywords: module, endpoint, router, service, controller, API, REST, Prisma, Zod, validation.
---

# futbol-api-dev — Guia de Desarrollo API

Stack: Express 4 + Prisma 5 (PostgreSQL) + Zod validations + TypeScript.

## Arquitectura de Modulos

Cada modulo vive en `apps/api/src/modules/<nombre>/` con esta estructura:

```
modules/<nombre>/
  <nombre>.router.ts    — Definicion de rutas Express
  <nombre>.controller.ts — Manejo de request/response
  <nombre>.service.ts   — Logica de negocio + Prisma queries
```

## Patron de Router

```typescript
import { Router } from 'express';
import { <Name>Controller } from './<nombre>.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { create<Name>Schema } from '@futbol/validations';

const router = Router();
const ctrl = new <Name>Controller();

router.get('/', ctrl.findAll);
router.get('/:id', ctrl.findById);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(create<Name>Schema), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.update);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), ctrl.remove);

export { router as <nombre>Router };
```

## Patron de Controller

```typescript
import { Request, Response, NextFunction } from 'express';
import { <Name>Service } from './<nombre>.service';

const service = new <Name>Service();

export class <Name>Controller {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.findAll(req.query);
      res.json({ data });
    } catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.findById(req.params.id);
      res.json({ data });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.create(req.body);
      res.status(201).json({ data });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.update(req.params.id, req.body);
      res.json({ data });
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.remove(req.params.id);
      res.status(204).end();
    } catch (err) { next(err); }
  }
}
```

## Patron de Service

```typescript
import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export class <Name>Service {
  async findAll(query: Record<string, unknown>) {
    const { page = 1, limit = 20, ...filters } = query;
    const where: Record<string, unknown> = {};
    // Aplicar filtros...
    const [data, total] = await Promise.all([
      db.<model>.findMany({ where, skip: (+page - 1) * +limit, take: +limit }),
      db.<model>.count({ where }),
    ]);
    return { data, meta: { page: +page, limit: +limit, total } };
  }

  async findById(id: string) {
    const item = await db.<model>.findUnique({ where: { id } });
    if (!item) throw new AppError('No encontrado', 404);
    return item;
  }

  async create(data: any) {
    return db.<model>.create({ data });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return db.<model>.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await db.<model>.delete({ where: { id } });
  }
}
```

## Convenciones

- **Errores**: Usar `AppError` con codigo HTTP. El middleware `error.middleware.ts` los formatea.
- **Auth**: `authenticate` middleware extrae `req.user`. `authorize roles)` valida permisos.
- **Validacion**: Schemas Zod en `packages/validations/src/index.ts`. Usar `validate()` middleware.
- **Respuestas**: Siempre `{ data: ... }` para items, `{ data: [], meta: {...} }` para listas paginadas.
- **Paginacion**: Parametros `page` y `limit` en query string. Max limit: 100.
- **Relaciones Prisma**: Usar `include` o `select` para traer relaciones necesarias.
- **Naming**: Router en plural (`/api/v1/players`), modelo en singular Prisma (`player`).

## Registrar Router en App

En `apps/api/src/app.ts`, agregar:
```typescript
import { <nombre>Router } from './modules/<nombre>/<nombre>.router';
app.use('/api/v1/<nombre>', <nombre>Router);
```

## Enums Disponibles (from @futbol/constants)

`TOURNAMENT_STATUS`, `MATCH_STATUS`, `EVENT_TYPE`, `POSITION`, `BRACKET_STAGE`, `ROLE`, `PHASE_TYPE`
