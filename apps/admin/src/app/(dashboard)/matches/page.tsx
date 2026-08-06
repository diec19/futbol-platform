'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { StatusBadge } from '@/components/domain/status-badge';

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
          <h1 className="text-2xl font-bold tracking-tight">Partidos</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? 0} partidos</p>
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="SCHEDULED">Programados</SelectItem>
            <SelectItem value="LIVE">En juego</SelectItem>
            <SelectItem value="FINISHED">Finalizados</SelectItem>
            <SelectItem value="POSTPONED">Postergados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay partidos</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cancha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <p className="font-medium">
                      {m.homeTeam?.name} vs {m.awayTeam?.name}
                    </p>
                    {m.group && (
                      <p className="text-xs text-muted-foreground">{m.group.name} · Fecha {m.round}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDateTime(m.scheduledAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{m.venue ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                  <TableCell className="font-bold">
                    {m.status === 'FINISHED'
                      ? `${m.homeScore} - ${m.awayScore}`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>Página {meta.page} de {meta.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
