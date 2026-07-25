---
name: futbol-testing
description: Use when writing, reviewing, or running tests for the futbol-platform project. Covers unit tests, integration tests, API tests, component tests. Trigger keywords: test, testing, Jest, Vitest, spec, mock, assertion, coverage, e2e.
---

# futbol-testing — Guia de Testing

El proyecto actualmente NO tiene tests. Esta guia establece el framework y patrones a seguir.

## Framework Recomendado

- **API (apps/api)**: Vitest + Supertest para tests de endpoints
- **Admin (apps/admin)**: Vitest + React Testing Library para componentes
- **Mobile (apps/mobile)**: Jest (Expo default) + React Native Testing Library

## Instalacion

```bash
# API
cd apps/api && npm install -D vitest supertest @types/supertest

# Admin
cd apps/admin && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Mobile (ya incluido con Expo)
```

## Test de API (endpoint test)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('GET /api/v1/tournaments', () => {
  it('debe retornar lista de torneos', async () => {
    const res = await request(app)
      .get('/api/v1/tournaments')
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
```

## Test de Service (unit test)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentsService } from './tournaments.service';

vi.mock('../../config/database', () => ({
  db: { tournament: { findMany: vi.fn(), create: vi.fn() } },
}));

describe('TournamentsService', () => {
  const service = new TournamentsService();

  it('debe retornar torneos', async () => {
    const mockTournaments = [{ id: '1', name: 'Test' }];
    vi.mocked(require('../../config/database').db.tournament.findMany).mockResolvedValue(mockTournaments);

    const result = await service.findAll({});
    expect(result.data).toEqual(mockTournaments);
  });
});
```

## Test de Componente (admin)

```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TournamentsPage from '../app/(dashboard)/tournaments/page';

const qc = new QueryClient();

render(
  <QueryClientProvider client={qc}>
    <TournamentsPage />
  </QueryClientProvider>
);
```

## Convenciones

- Archivos: `*.test.ts` o `*.spec.ts` junto al archivo fuente
- Describir en espanol: `it('debe retornar 404 cuando no existe')`
- Mockear solo la capa de DB, no la logica
- Tests de integracion para endpoints criticos (auth, payments)
- Coverge minimo: 70% en modules nuevos
