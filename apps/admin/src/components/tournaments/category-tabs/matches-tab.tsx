'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { BRACKET_STAGE_LABELS } from '@futbol/constants';
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
import { StatusBadge } from '@/components/domain/status-badge';
import { MatchResultModal } from '@/components/domain/match-result-modal';

export function MatchesTab({ categoryId }: { categoryId: string }) {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data } = useQuery({
    queryKey: ['matches', categoryId, statusFilter],
    queryFn: () => api.matches.list({
      categoryId,
      limit: '50',
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
  });

  const matches = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta?.total ?? 0} partidos</p>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="SCHEDULED">Programados</SelectItem>
            <SelectItem value="FINISHED">Finalizados</SelectItem>
            <SelectItem value="POSTPONED">Postergados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden bg-card">
        {matches.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            No hay partidos. Generá el fixture desde la pestaña Grupos.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Grupo / Fase</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.homeTeam?.name} vs {m.awayTeam?.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDateTime(m.scheduledAt)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {m.group ? `${m.group.name} · Fecha ${m.round}` : m.bracketStage ? BRACKET_STAGE_LABELS[m.bracketStage] : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                  <TableCell className="font-bold">
                    {m.status === 'FINISHED' ? `${m.homeScore} - ${m.awayScore}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.status !== 'FINISHED' && m.status !== 'CANCELLED' && (
                      <Button size="sm" onClick={() => setSelectedMatch(m)}>
                        Cargar resultado
                      </Button>
                    )}
                    {m.status === 'FINISHED' && (
                      <Button variant="outline" size="sm" onClick={() => setSelectedMatch(m)}>
                        Ver detalles
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {selectedMatch && (
        <MatchResultModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}
