'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
        <h1 className="text-2xl font-bold tracking-tight">Posiciones</h1>
        <p className="text-sm text-muted-foreground">Tabla de posiciones por grupo</p>
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
            <BarChart3 size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">Seleccioná un torneo y una categoría</p>
            <p className="text-sm text-muted-foreground/70 mt-1">para ver las posiciones</p>
          </CardContent>
        </Card>
      )}

      {categoryId && isLoading && (
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {categoryId && !isLoading && groups.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No hay grupos con posiciones para esta categoría
          </CardContent>
        </Card>
      )}

      {groups.map((group: any) => (
        <Card key={group.id}>
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b bg-muted/50">
              <h3 className="font-semibold">{group.name}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="text-center">PJ</TableHead>
                  <TableHead className="text-center">G</TableHead>
                  <TableHead className="text-center">E</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">GF</TableHead>
                  <TableHead className="text-center">GC</TableHead>
                  <TableHead className="text-center">DG</TableHead>
                  <TableHead className="text-center font-bold">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(group.standings ?? group.teams ?? []).map((row: any, i: number) => (
                  <TableRow key={row.teamId ?? row.id} className={i < 2 ? 'border-l-2 border-l-emerald-500' : ''}>
                    <TableCell className="text-muted-foreground text-center text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium">{row.team?.name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.played}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.won}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.drawn}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.lost}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.goalsFor}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.goalsAgainst}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                    </TableCell>
                    <TableCell className="text-center font-bold">{row.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
