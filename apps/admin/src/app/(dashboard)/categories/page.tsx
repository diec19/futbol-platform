'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ListOrdered, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ActiveBadge } from '@/components/domain/status-badge';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

const PHASE_LABELS: Record<string, string> = {
  MIXED: 'Mixto',
  GROUP: 'Solo grupos',
  KNOCKOUT: 'Eliminación directa',
};

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [tournamentId, setTournamentId] = useState('');
  const [search, setSearch] = useState('');

  const { data: tournamentsData } = useQuery({
    queryKey: ['tournaments-list'],
    queryFn: () => api.tournaments.list({ limit: '50' }),
  });

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories-all', tournamentId],
    queryFn: () => api.categories.list({
      limit: '100',
      ...(tournamentId ? { tournamentId } : {}),
    }),
  });

  const toggle = useMutation({
    mutationFn: (id: string) => api.categories.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-all'] });
      toast.success('Estado actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.categories.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-all'] });
      toast.success('Categoría eliminada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const tournaments = tournamentsData?.data ?? [];
  const allCategories = categoriesData?.data ?? [];
  const categories = search
    ? allCategories.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()))
    : allCategories;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categorías</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Select value={tournamentId} onValueChange={setTournamentId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todos los torneos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los torneos</SelectItem>
            {tournaments.map((t: any) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoría..."
            className="pl-9 w-64"
          />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center">
            <ListOrdered size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No hay categorías</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Creá categorías desde la página de cada torneo
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Torneo</TableHead>
                <TableHead>Tipo de fase</TableHead>
                <TableHead>Equipos</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <Link
                      href={`/tournaments/${cat.tournamentId}/categories/${cat.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{cat.tournament?.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{PHASE_LABELS[cat.phaseType] ?? cat.phaseType}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.teams?.length ?? cat._count?.teams ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {cat.birthYear
                      ? `Año ${cat.birthYear}`
                      : (cat.minAge || cat.maxAge)
                        ? `${cat.minAge ?? '?'}-${cat.maxAge ?? '?'} años`
                        : '—'}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={cat.active} label={cat.active ? 'Activa' : 'Inactiva'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggle.mutate(cat.id)}
                        title={cat.active ? 'Desactivar' : 'Activar'}
                        aria-label={cat.active ? 'Desactivar categoría' : 'Activar categoría'}
                      >
                        {cat.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <ConfirmDialog
                        title="Eliminar categoría"
                        description={`¿Eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`}
                        confirmLabel="Eliminar"
                        destructive
                        onConfirm={() => remove.mutate(cat.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label="Eliminar categoría">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
