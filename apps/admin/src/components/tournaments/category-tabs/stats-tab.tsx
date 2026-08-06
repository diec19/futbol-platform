'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function StatsTab({ categoryId }: { categoryId: string }) {
  const { data: scorersData } = useQuery({
    queryKey: ['scorers', categoryId],
    queryFn: () => api.statistics.scorers(categoryId),
  });
  const { data: cardsData } = useQuery({
    queryKey: ['cards', categoryId],
    queryFn: () => api.statistics.cards(categoryId),
  });
  const { data: fairPlayData } = useQuery({
    queryKey: ['fairplay', categoryId],
    queryFn: () => api.statistics.fairPlay(categoryId),
  });

  const scorers = scorersData?.data ?? [];
  const cards = cardsData?.data ?? [];
  const fairPlay = fairPlayData?.data ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scorers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">⚽ Goleadores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {scorers.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Sin goles registrados</p>
          ) : (
            <Table>
              <TableBody>
                {scorers.map((p: any, i: number) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground w-8">{i + 1}</TableCell>
                    <TableCell>
                      <p className="font-medium">{p.fullName}</p>
                      <p className="text-xs text-muted-foreground">{p.team?.name}</p>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">{p.goals}</TableCell>
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
          <CardTitle className="text-sm">🟨 Tarjetas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cards.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Sin tarjetas registradas</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Jugador</TableHead>
                  <TableHead className="text-center text-amber-600 text-xs">🟨</TableHead>
                  <TableHead className="text-center text-red-600 text-xs">🟥</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium text-xs">{p.fullName}</p>
                      <p className="text-xs text-muted-foreground">{p.team?.name}</p>
                    </TableCell>
                    <TableCell className="text-center font-bold text-amber-600">{p.yellow}</TableCell>
                    <TableCell className="text-center font-bold text-red-600">{p.red}</TableCell>
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
          <CardTitle className="text-sm">🤝 Fair Play</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fairPlay.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Sin datos</p>
          ) : (
            <Table>
              <TableBody>
                {fairPlay.map((t: any, i: number) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground w-8">{i + 1}</TableCell>
                    <TableCell className="font-medium text-xs">{t.name}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
                        {t.yellow}A {t.red}R
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
