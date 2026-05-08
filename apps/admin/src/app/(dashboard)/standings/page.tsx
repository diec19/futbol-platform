'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart3 } from 'lucide-react';

export default function StandingsPage() {
  const [tournamentId, setTournamentId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data: tournamentsData } = useQuery({
    queryKey: ['tournaments-list'],
    queryFn: () => api.tournaments.list({ limit: '50' }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-by-tournament', tournamentId],
    queryFn: () => api.categories.list({ tournamentId, limit: '50' }),
    enabled: !!tournamentId,
  });

  const { data: standingsData, isLoading } = useQuery({
    queryKey: ['standings-category', categoryId],
    queryFn: () => api.standings.byCategory(categoryId),
    enabled: !!categoryId,
  });

  const tournaments = tournamentsData?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const groups: any[] = standingsData?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Posiciones</h1>
        <p className="text-gray-500 text-sm mt-1">Tabla de posiciones por grupo</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={tournamentId}
          onChange={(e) => { setTournamentId(e.target.value); setCategoryId(''); }}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
        >
          <option value="">Seleccionar torneo</option>
          {tournaments.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {tournamentId && (
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {!categoryId && (
        <div className="p-12 text-center bg-white rounded-xl border">
          <BarChart3 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Seleccioná un torneo y una categoría</p>
          <p className="text-gray-400 text-sm mt-1">para ver las posiciones</p>
        </div>
      )}

      {categoryId && isLoading && (
        <div className="p-8 text-center text-gray-400">Cargando posiciones...</div>
      )}

      {categoryId && !isLoading && groups.length === 0 && (
        <div className="p-8 text-center bg-white rounded-xl border text-gray-400">
          No hay grupos con posiciones para esta categoría
        </div>
      )}

      {groups.map((group: any) => (
        <div key={group.id} className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">{group.name}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-gray-500 font-medium w-8">#</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Equipo</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">PJ</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">G</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">E</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">P</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">GF</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">GC</th>
                <th className="text-center px-3 py-3 text-gray-500 font-medium">DG</th>
                <th className="text-center px-3 py-3 text-gray-900 font-bold">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(group.standings ?? group.teams ?? []).map((row: any, i: number) => (
                <tr key={row.teamId ?? row.id} className={`hover:bg-gray-50 ${i < 2 ? 'border-l-2 border-l-green-500' : ''}`}>
                  <td className="px-4 py-3 text-gray-400 text-center text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.team?.name}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.played}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.won}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.drawn}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.lost}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.goalsFor}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{row.goalsAgainst}</td>
                  <td className="px-3 py-3 text-center text-gray-600">
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-gray-900">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
