'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart3, Trophy, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">Goleadores, tarjetas y fair play por categoría</p>
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
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!tournamentId && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">Seleccioná un torneo para ver estadísticas</p>
          </CardContent>
        </Card>
      )}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Partidos jugados', value: summary.matchesPlayed ?? 0, icon: Trophy, color: 'bg-blue-500' },
            { label: 'Goles totales', value: summary.goals ?? 0, icon: Target, color: 'bg-green-500' },
            { label: 'Tarjetas amarillas', value: summary.yellowCards ?? 0, icon: AlertTriangle, color: 'bg-yellow-500' },
            { label: 'Tarjetas rojas', value: summary.redCards ?? 0, icon: AlertTriangle, color: 'bg-red-500' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {categoryId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scorers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-green-600" /> Goleadores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {scorers.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Sin datos</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Jugador</TableHead>
                      <TableHead className="text-center text-xs">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scorers.slice(0, 10).map((s: any, i: number) => (
                      <TableRow key={s.playerId}>
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell>
                          <p className="font-medium text-xs">{s.player?.fullName}</p>
                          <p className="text-xs text-muted-foreground">{s.player?.team?.name}</p>
                        </TableCell>
                        <TableCell className="text-center font-bold">{s.goals}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500" /> Tarjetas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cards.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Sin datos</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Jugador</TableHead>
                      <TableHead className="text-center text-xs">🟨</TableHead>
                      <TableHead className="text-center text-xs">🟥</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cards.slice(0, 10).map((c: any) => (
                      <TableRow key={c.playerId}>
                        <TableCell>
                          <p className="font-medium text-xs">{c.player?.fullName}</p>
                          <p className="text-xs text-muted-foreground">{c.player?.team?.name}</p>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-xs">{c.yellowCards ?? 0}</TableCell>
                        <TableCell className="text-center text-muted-foreground text-xs">{c.redCards ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Fair Play */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-blue-500" /> Fair Play (equipos)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {fairPlay.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Sin datos</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Equipo</TableHead>
                      <TableHead className="text-center text-xs">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fairPlay.slice(0, 10).map((f: any, i: number) => (
                      <TableRow key={f.teamId ?? i}>
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="font-medium text-xs">{f.team?.name}</TableCell>
                        <TableCell className="text-center font-bold text-xs">{f.fairPlayPoints ?? f.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
