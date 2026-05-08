'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { UserRound, Search } from 'lucide-react';
import { POSITION_LABELS } from '@futbol/constants';

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['players', page, debouncedSearch],
    queryFn: () =>
      api.players.list({
        page: String(page),
        limit: '20',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
  });

  const players = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jugadores</h1>
          <p className="text-gray-500 text-sm mt-1">{meta?.total ?? 0} jugadores registrados</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setTimeout(() => setDebouncedSearch(e.target.value), 300);
          }}
          placeholder="Buscar por nombre o DNI..."
          className="w-full max-w-sm pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : players.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No se encontraron jugadores</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Jugador</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">DNI</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">F. Nac.</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Posición</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Equipo</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {players.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserRound size={14} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.fullName}</p>
                        {p.shirtNumber && (
                          <p className="text-xs text-gray-400">#{p.shirtNumber}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.dni}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(p.birthDate)}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.position ? POSITION_LABELS[p.position] ?? p.position : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.team?.name ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
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
