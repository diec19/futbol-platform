'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GitBranch } from 'lucide-react';
import { BRACKET_STAGE_LABELS } from '@futbol/constants';

const STAGE_ORDER = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
];

export default function BracketsPage() {
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

  const { data: bracketsData, isLoading } = useQuery({
    queryKey: ['brackets', categoryId],
    queryFn: () => api.brackets.byCategory(categoryId),
    enabled: !!categoryId,
  });

  const tournaments = tournamentsData?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const brackets: any[] = (bracketsData as any)?.data ?? [];

  const byStage = brackets.reduce((acc: Record<string, any[]>, b: any) => {
    const stage = b.stage ?? b.match?.bracketStage;
    if (!stage) return acc;
    acc[stage] = [...(acc[stage] ?? []), b];
    return acc;
  }, {});

  const stages = STAGE_ORDER.filter(s => byStage[s]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Llaves</h1>
        <p className="text-gray-500 text-sm mt-1">Bracket de eliminación directa</p>
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
          <GitBranch size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Seleccioná un torneo y una categoría</p>
          <p className="text-gray-400 text-sm mt-1">para ver el bracket</p>
        </div>
      )}

      {categoryId && isLoading && (
        <div className="p-8 text-center text-gray-400">Cargando bracket...</div>
      )}

      {categoryId && !isLoading && brackets.length === 0 && (
        <div className="p-8 text-center bg-white rounded-xl border text-gray-400">
          No hay bracket iniciado para esta categoría
        </div>
      )}

      {stages.length > 0 && (
        <div className="bg-white rounded-xl border p-6 overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            {stages.map((stage) => (
              <div key={stage} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide text-center">
                  {BRACKET_STAGE_LABELS[stage] ?? stage}
                </h3>
                <div className="flex flex-col gap-6 justify-around flex-1">
                  {byStage[stage].map((b: any) => {
                    const match = b.match ?? b;
                    const homeTeam = match.homeTeam;
                    const awayTeam = match.awayTeam;
                    const isFinished = match.status === 'FINISHED';
                    const homeWon = isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
                    const awayWon = isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0);

                    return (
                      <div key={b.id} className="w-44 border rounded-lg overflow-hidden shadow-sm">
                        <div className={`flex items-center justify-between px-3 py-2 border-b text-sm ${homeWon ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <span className={`font-medium truncate ${homeWon ? 'text-green-700' : 'text-gray-700'}`}>
                            {homeTeam?.name ?? 'Por definir'}
                          </span>
                          {isFinished && (
                            <span className={`font-bold ml-2 ${homeWon ? 'text-green-700' : 'text-gray-500'}`}>
                              {match.homeScore}
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center justify-between px-3 py-2 text-sm ${awayWon ? 'bg-green-50' : 'bg-white'}`}>
                          <span className={`font-medium truncate ${awayWon ? 'text-green-700' : 'text-gray-700'}`}>
                            {awayTeam?.name ?? 'Por definir'}
                          </span>
                          {isFinished && (
                            <span className={`font-bold ml-2 ${awayWon ? 'text-green-700' : 'text-gray-500'}`}>
                              {match.awayScore}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
