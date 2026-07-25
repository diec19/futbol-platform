---
name: futbol-admin-dev
description: Use when creating new pages, components, or features in the admin dashboard (apps/admin). Covers Next.js 14 App Router, React 18, TanStack Query, Tailwind CSS, shadcn/ui patterns. Trigger keywords: page, component, admin, dashboard, Next.js, React, TanStack Query, UI, form, table.
---

# futbol-admin-dev — Guia de Desarrollo Admin

Stack: Next.js 14 (App Router) + React 18.3 + TanStack Query + Tailwind CSS + Lucide icons.

## Estructura de Directorios

```
apps/admin/src/
  app/
    (dashboard)/           — Rutas autenticadas (layout con sidebar)
      page.tsx             — Dashboard principal
      tournaments/         — CRUD torneos
      matches/             — Partidos
      standings/           — Posiciones
      brackets/            — Llaves
      statistics/          — Estadisticas
      players/             — Jugadores
      teams/               — Equipos
      referees/            — Arbitros
      sanctions/           — Sanciones
      categories/          — Categorias
      club/                — Gestion del club
    login/                 — Pagina de login
  components/
    domain/                — Componentes de dominio (sidebar, modals)
  lib/
    api.ts                 — Cliente API con refresh token
    auth.ts                — Helpers de autenticacion
    utils.ts               — Utilidades (formatDate, cn, etc.)
  providers/
    auth-provider.tsx      — Context de autenticacion
    query-provider.tsx     — TanStack Query provider
```

## Crear Nueva Pagina

1. Crear directorio en `app/(dashboard)/<nombre>/`
2. Crear `page.tsx` con `'use client'`
3. Usar `useQuery` de TanStack Query para datos
4. Usar `api.<modulo>` del cliente API en `lib/api.ts`

## Patron de Pagina con CRUD

```tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function MiPagina() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['mi-recurso'],
    queryFn: () => api.miRecurso.list(),
  });

  const create = useMutation({
    mutationFn: (data: any) => api.miRecurso.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mi-recurso'] }),
  });

  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi Recurso</h1>
      {/* Tabla, formularios, etc. */}
    </div>
  );
}
```

## Convenciones UI

- **Estilos**: Tailwind CSS. Colores primarios via `text-primary`, `bg-primary`.
- **Iconos**: Lucide React (`import { Plus } from 'lucide-react'`)
- **Tablas**: `<table className="w-full text-sm">` con `<thead className="bg-gray-50 border-b">`
- **Formularios**: Inputs con `px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary`
- **Modales**: Div overlay con `fixed inset-0 bg-black/50 flex items-center justify-center`
- **Botones**: `bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90`
- **Estados**: Loading spinner, empty states con icono centrado, error messages en `bg-red-50 border border-red-200`

## Agregar Ruta al Sidebar

En `components/domain/sidebar.tsx`, agregar entrada al array `navigation`:
```typescript
{ name: 'Mi Pagina', href: '/mi-pagina', icon: MiIcono }
```

## Cliente API

El cliente esta en `lib/api.ts`. Para agregar un nuevo modulo:
```typescript
export const api = {
  // ...existing modules...
  miModulo: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return get<{ data: any[] }>(`/mi-modulo${qs}`);
    },
    get: (id: string) => get<{ data: any }>(`/mi-modulo/${id}`),
    create: (data: unknown) => post<{ data: any }>('/mi-modulo', data),
    update: (id: string, data: unknown) => put<{ data: any }>(`/mi-modulo/${id}`, data),
    remove: (id: string) => del<void>(`/mi-modulo/${id}`),
  },
};
```

## Auth

- `AuthProvider` maneja el estado de sesion
- Tokens en `localStorage`: `access_token`, `refresh_token`, `user`
- Auto-refresh en 401 via interceptor en `api.ts`
- Redirect a `/login` si no autenticado
