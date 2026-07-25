---
description: Genera una pagina completa en el admin dashboard (page.tsx + componentes + integracion con API) siguiendo los patrones del proyecto.
agent: build
---

Generate a complete new admin page for futbol-platform following the established patterns.

## Page Name: $ARGUMENTS

## Instructions

1. **Create page directory**: `apps/admin/src/app/(dashboard)/<page-name>/`

2. **Create `page.tsx`** with:
   - `'use client'` directive
   - Imports: `useQuery`, `useMutation`, `useQueryClient` from TanStack Query
   - Import `api` from `@/lib/api`
   - Import icons from `lucide-react`
   - State for form visibility, filters, form data

3. **Implement CRUD operations**:
   - `useQuery` for list with queryKey `['<resource>']`
   - `useMutation` for create/update/delete with cache invalidation
   - Form with proper validation
   - Table with columns for key fields
   - Empty state with icon
   - Loading state

4. **Follow UI conventions**:
   - Page title: `<h1 className="text-2xl font-bold text-gray-900">`
   - Stats row: `{count} items`
   - Table: `<table className="w-full text-sm">` with `<thead className="bg-gray-50 border-b">`
   - Form: `<div className="bg-white rounded-xl border p-5 space-y-4">`
   - Inputs: `px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary`
   - Buttons: `bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90`
   - Error display: `<p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">`

5. **Add sidebar entry** in `components/domain/sidebar.tsx`:
   - Add to the `navigation` array with name, href, and icon

6. **Add API client methods** in `lib/api.ts`:
   - Add `<module>` section with list, get, create, update, remove methods

Use the page name provided in $ARGUMENTS. Match the entity's fields with appropriate form inputs (text, number, select, date, textarea).
