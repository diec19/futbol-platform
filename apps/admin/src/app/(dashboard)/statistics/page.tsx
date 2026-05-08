'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart3, Trophy, Target, AlertTriangle } from 'lucide-react';
import { POSITION_LABELS } from '@futbol/constants';

export default function StatisticsPage() {
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

  const { data: summaryData } = useQuery({
    queryKey: ['tournament-summary', tournamentId],
    queryFn: () => api.statistics.summary(tournamentId),
    enabled: !!tournamentId,
  });

  const { data: scorersData } = useQuery({
    queryKey: ['scorers', categoryId],
    queryFn: () => api.statistics.scorers(categoryId),
    enabled: !!categoryId,
  });

  const { data: cardsData } = useQuery({
    queryKey: ['cards', categoryId],
    queryFn: () => api.statistics.cards(categoryId),
    enabled: !!categoryId,
  });

  const { data: fairPlayData } = useQuery({
    queryKey: ['fairplay', categoryId],
    queryFn: () => api.statistics.fairPlay(categoryId),
    enabled: !!categoryId,
  });

  const tournaments = tournamentsData?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const summary = summaryData?.data;
  const scorers: any[] = scorersData?.data ?? [];
  const cards: any[] = cardsData?.data ?? [];
  const fairPlay: any[] = fairPlayData?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-gray-500 text-sm mt-1">Goleadores, tarjetas y fair play por categoría</p>
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
            <option value="">Todas las categorías</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {!tournamentId && (
        <div className="p-12 text-center bg-white rounded-xl border">
          <BarChart3 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Seleccioná un torneo para ver estadísticas</p>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Partidos jugados', value: summary.matchesPlayed ?? 0, icon: Trophy, color: 'bg-blue-500' },
            { label: 'Goles totales', value: summary.goals ?? 0, icon: Target, color: 'bg-green-500' },
            { label: 'Tarjetas amarillas', value: summary.yellowCards ?? 0, icon: AlertTriangle, color: 'bg-yellow-500' },
            { label: 'Tarjetas rojas', value: summary.redCards ?? 0, icon: AlertTriangle, color: 'bg-red-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {categoryId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scorers */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
              <Target size={14} className="text-green-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Goleadores</h3>
            </div>
            {scorers.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">Sin datos</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">#</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Jugador</th>
                    <th className="text-center px-4 py-2 text-xs text-gray-500 font-medium">Goles</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {scorers.slice(0, 10).map((s: any, i: number) => (
                    <tr key={s.playerId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900 text-xs">{s.player?.fullName}</p>
                        <p className="text-xs text-gray-400">{s.player?.team?.name}</p>
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold text-gray-900">{s.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cards */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Tarjetas</h3>
            </div>
            {cards.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">Sin datos</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Jugador</th>
                    <th className="text-center px-3 py-2 text-xs text-gray-500 font-medium">🟨</th>
                    <th className="text-center px-3 py-2 text-xs text-gray-500 font-medium">🟥</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cards.slice(0, 10).map((c: any) => (
                    <tr key={c.playerId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900 text-xs">{c.player?.fullName}</p>
                        <p className="text-xs text-gray-400">{c.player?.team?.name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-700 text-xs">{c.yellowCards ?? 0}</td>
                      <td className="px-3 py-2.5 text-center text-gray-700 text-xs">{c.redCards ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Fair Play */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
              <Trophy size={14} className="text-blue-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Fair Play (equipos)</h3>
            </div>
            {fairPlay.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">Sin datos</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">#</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Equipo</th>
                    <th className="text-center px-4 py-2 text-xs text-gray-500 font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fairPlay.slice(0, 10).map((f: any, i: number) => (
                    <tr key={f.teamId ?? i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900 text-xs">{f.team?.name}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-gray-900 text-xs">{f.fairPlayPoints ?? f.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
