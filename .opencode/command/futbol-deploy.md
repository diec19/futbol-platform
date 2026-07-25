---
description: Build y deploy completo del proyecto futbol-platform. Ejecuta lint, build, y prepara para deploy.
agent: build
permission:
  bash: allow
---

Run the full build and deployment preparation for futbol-platform.

## Instructions

1. **Install dependencies** (if needed):
   ```bash
   cd D:\dcaceres\Desktop\DiegoC\futbol-platform && npm install
   ```

2. **Generate Prisma client**:
   ```bash
   cd apps/api && npx prisma generate
   ```

3. **Run lint** across all apps:
   ```bash
   npm run lint
   ```

4. **Build all apps** via Turborepo:
   ```bash
   npm run build
   ```

5. **Verify build outputs**:
   - `apps/api/dist/` — Compiled API
   - `apps/admin/.next/` — Built admin
   - `packages/*/dist/` — Built shared packages

6. **If deploying to Railway**:
   ```bash
   railway up
   ```

7. **Report results**: Summary of build status, any errors, and deployment URL if applicable.

Execute each step sequentially. Report any failures immediately with the error details.
