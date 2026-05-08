'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { TOURNAMENT_STATUS_LABELS } from '@futbol/constants';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  FINISHED: 'bg-blue-100 text-blue-700',
};

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.tournaments.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournaments'] }),
  });

  const tournaments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torneos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {meta?.total ?? 0} torneos en total
          </p>
        </div>
        <Link
          href="/tournaments/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Nuevo torneo
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : tournaments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No hay torneos. <Link href="/tournaments/new" className="text-primary hover:underline">Crear el primero</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Torneo</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Fechas</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Categorías</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Estado</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tournaments.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/tournaments/${t.id}`}
                      className="font-medium text-gray-900 hover:text-primary"
                    >
                      {t.name}
                    </Link>
                    {t.sponsor && (
                      <p className="text-xs text-gray-400 mt-0.5">Sponsor: {t.sponsor}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatDate(t.startDate)} → {formatDate(t.endDate)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                      {t.categories?.length ?? 0} categorías
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[t.status] ?? ''}`}
                    >
                      {TOURNAMENT_STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleStatus.mutate({ id: t.id, current: t.status })}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                        title={t.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                      >
                        {t.status === 'ACTIVE' ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                      </button>
                      <Link
                        href={`/tournaments/${t.id}`}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar "${t.name}"?`)) remove.mutate(t.id);
                        }}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Página {meta.page} de {meta.totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
