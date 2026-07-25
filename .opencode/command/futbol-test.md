---
description: Genera tests para un archivo fuente especifico del proyecto. Analiza el codigo y genera tests unitarios o de integracion.
agent: build
---

Generate comprehensive tests for the specified source file in futbol-platform.

## Target File: $ARGUMENTS

## Instructions

1. **Read the target file** to understand its exports, functions, and dependencies

2. **Determine test type** based on file location:
   - `apps/api/src/modules/*/` → API service or controller test (Vitest + Supertest)
   - `apps/api/src/lib/` → Unit test (Vitest)
   - `apps/admin/src/` → Component test (Vitest + React Testing Library)
   - `apps/mobile/` → React Native test (Jest)

3. **Create test file** alongside source: `filename.test.ts`

4. **Generate tests covering**:
   - Happy path (expected behavior)
   - Error cases (not found, validation errors, auth errors)
   - Edge cases (empty data, null values, boundary conditions)
   - Mock external dependencies (database, API calls)

5. **Follow test conventions**:
   - Describe blocks in Spanish
   - Test names starting with "debe" or "should"
   - `beforeEach` to reset mocks
   - Proper assertion with `expect`

6. **Mock patterns**:
   - Database: `vi.mock('../../config/database', () => ({ db: { model: { findMany: vi.fn() } } }))`
   - Auth: Mock JWT verify
   - External APIs: Mock fetch

Use the file path provided in $ARGUMENTS.
