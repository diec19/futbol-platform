'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { UserRound, Search, QrCode } from 'lucide-react';
import { POSITION_LABELS } from '@futbol/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ActiveBadge } from '@/components/domain/status-badge';
import { CredentialModal } from '@/components/domain/credential-modal';

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [credentialPlayer, setCredentialPlayer] = useState<any>(null);

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
      {credentialPlayer && (
        <CredentialModal player={credentialPlayer} onClose={() => setCredentialPlayer(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jugadores</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? 0} jugadores registrados</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setTimeout(() => setDebouncedSearch(e.target.value), 300);
          }}
          placeholder="Buscar por nombre o DNI..."
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No se encontraron jugadores</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>F. Nac.</TableHead>
                <TableHead>Posición</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <UserRound size={14} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{p.fullName}</p>
                        {p.shirtNumber && (
                          <p className="text-xs text-muted-foreground">#{p.shirtNumber}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.dni}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.birthDate)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.position ? POSITION_LABELS[p.position] ?? p.position : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.team?.name ?? '—'}</TableCell>
                  <TableCell>
                    <ActiveBadge active={p.active} label={p.active ? 'Activo' : 'Inactivo'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCredentialPlayer(p)}
                      title="Credencial / QR"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
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
