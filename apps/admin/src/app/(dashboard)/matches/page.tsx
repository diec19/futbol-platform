'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { MATCH_STATUS_LABELS } from '@futbol/constants';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-gray-100 text-gray-600',
  LIVE: 'bg-green-100 text-green-700',
  FINISHED: 'bg-blue-100 text-blue-700',
  POSTPONED: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function MatchesPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['matches', status, page],
    queryFn: () =>
      api.matches.list({
        page: String(page),
        limit: '20',
        ...(status ? { status } : {}),
      }),
  });

  const matches = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partidos</h1>
          <p className="text-gray-500 text-sm mt-1">{meta?.total ?? 0} partidos</p>
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos</option>
          <option value="SCHEDULED">Programados</option>
          <option value="LIVE">En juego</option>
          <option value="FINISHED">Finalizados</option>
          <option value="POSTPONED">Postergados</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay partidos</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Partido</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Fecha</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Cancha</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Estado</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {matches.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {m.homeTeam?.name} vs {m.awayTeam?.name}
                    </p>
                    {m.group && (
                      <p className="text-xs text-gray-400">{m.group.name} · Fecha {m.round}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {formatDateTime(m.scheduledAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{m.venue ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[m.status] ?? ''}`}>
                      {MATCH_STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {m.status === 'FINISHED'
                      ? `${m.homeScore} - ${m.awayScore}`
                      : '—'}
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
              <button disabled={meta.page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">Anterior</button>
              <button disabled={meta.page >= meta.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
