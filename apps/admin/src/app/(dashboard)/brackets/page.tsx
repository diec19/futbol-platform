'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GitBranch } from 'lucide-react';
import { BRACKET_STAGE_LABELS } from '@futbol/constants';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
        <h1 className="text-2xl font-bold tracking-tight">Llaves</h1>
        <p className="text-sm text-muted-foreground">Bracket de eliminación directa</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Select
          value={tournamentId}
          onValueChange={(v) => { setTournamentId(v); setCategoryId(''); }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Seleccionar torneo" />
          </SelectTrigger>
          <SelectContent>
            {tournaments.map((t: any) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {tournamentId && (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!categoryId && (
        <Card>
          <CardContent className="p-12 text-center">
            <GitBranch size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">Seleccioná un torneo y una categoría</p>
            <p className="text-sm text-muted-foreground/70 mt-1">para ver el bracket</p>
          </CardContent>
        </Card>
      )}

      {categoryId && isLoading && (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-44" />
          ))}
        </div>
      )}

      {categoryId && !isLoading && brackets.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No hay bracket iniciado para esta categoría
          </CardContent>
        </Card>
      )}

      {stages.length > 0 && (
        <Card>
          <CardContent className="p-6 overflow-x-auto">
            <div className="flex gap-8 min-w-max">
              {stages.map((stage) => (
                <div key={stage} className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">
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
                          <div
                            className={cn(
                              'flex items-center justify-between px-3 py-2 border-b text-sm',
                              homeWon ? 'bg-emerald-50' : 'bg-muted'
                            )}
                          >
                            <span className={cn('font-medium truncate', homeWon ? 'text-emerald-700' : 'text-foreground')}>
                              {homeTeam?.name ?? 'Por definir'}
                            </span>
                            {isFinished && (
                              <span className={cn('font-bold ml-2', homeWon ? 'text-emerald-700' : 'text-muted-foreground')}>
                                {match.homeScore}
                              </span>
                            )}
                          </div>
                          <div
                            className={cn(
                              'flex items-center justify-between px-3 py-2 text-sm',
                              awayWon ? 'bg-emerald-50' : 'bg-background'
                            )}
                          >
                            <span className={cn('font-medium truncate', awayWon ? 'text-emerald-700' : 'text-foreground')}>
                              {awayTeam?.name ?? 'Por definir'}
                            </span>
                            {isFinished && (
                              <span className={cn('font-bold ml-2', awayWon ? 'text-emerald-700' : 'text-muted-foreground')}>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
