'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/domain/status-badge';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

export default function TournamentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', page],
    queryFn: () => api.tournaments.list({ page: String(page), limit: '20' }),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, current }: { id: string; current: string }) => {
      const next = current === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
      return api.tournaments.updateStatus(id, next);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Estado actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.tournaments.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Torneo eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const tournaments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Torneos</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? 0} torneos en total</p>
        </div>
        <Button asChild>
          <Link href="/tournaments/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo torneo
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay torneos.{' '}
            <Link href="/tournaments/new" className="text-primary hover:underline">
              Crear el primero
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Torneo</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Categorías</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={`/tournaments/${t.id}`} className="font-medium hover:text-primary">
                      {t.name}
                    </Link>
                    {t.sponsor && (
                      <p className="text-xs text-muted-foreground mt-0.5">Sponsor: {t.sponsor}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(t.startDate)} → {formatDate(t.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t.categories?.length ?? 0} categorías</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus.mutate({ id: t.id, current: t.status })}
                        title={t.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                        aria-label={t.status === 'ACTIVE' ? 'Desactivar torneo' : 'Activar torneo'}
                      >
                        {t.status === 'ACTIVE' ? (
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/tournaments/${t.id}`} aria-label="Editar torneo">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        title="Eliminar torneo"
                        description={`¿Eliminar "${t.name}"? Esta acción no se puede deshacer.`}
                        confirmLabel="Eliminar"
                        destructive
                        onConfirm={() => remove.mutate(t.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label="Eliminar torneo">
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

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>Página {meta.page} de {meta.totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
