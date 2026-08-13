'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { UserMinus, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d));
}

const STATUS_META: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'destructive' },
};

export default function UnlinkRequestsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [approving, setApproving] = useState<any>(null);
  const [setActive, setSetActive] = useState<boolean | null>(null);
  const [rejecting, setRejecting] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['unlink-requests', filter],
    queryFn: () => api.members.unlinkRequests.list(filter === 'ALL' ? undefined : filter),
  });
  const requests = data?.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['unlink-requests'] });

  const approveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active?: boolean }) =>
      api.members.unlinkRequests.approve(id, active),
    onSuccess: () => {
      invalidate();
      setApproving(null);
      setSetActive(null);
      toast.success('Jugador desvinculado del socio');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.members.unlinkRequests.reject(id, note),
    onSuccess: () => {
      invalidate();
      setRejecting(null);
      setRejectNote('');
      toast.success('Solicitud rechazada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filterBtn = (value: typeof filter, label: string) => (
    <Button
      size="sm"
      variant={filter === value ? 'default' : 'outline'}
      onClick={() => setFilter(value)}
      className={filter === value ? '' : 'text-muted-foreground'}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Desvinculaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Socios que pidieron desvincular a un jugador de su cuenta
          </p>
        </div>
        <div className="flex gap-2">
          {filterBtn('PENDING', 'Pendientes')}
          {filterBtn('APPROVED', 'Aprobadas')}
          {filterBtn('REJECTED', 'Rechazadas')}
          {filterBtn('ALL', 'Todas')}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <UserMinus size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay solicitudes {filter === 'PENDING' ? 'pendientes' : ''}</p>
          <p className="mt-1 text-sm">Cuando un socio pida desvincular a un jugador, aparece acá</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r: any) => {
            const meta = STATUS_META[r.status] ?? STATUS_META.PENDING;
            return (
              <Card key={r.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{r.player?.fullName}</p>
                        <Badge variant={meta.variant} className="rounded-full text-xs">
                          {meta.label}
                        </Badge>
                        {r.setActive !== null && r.setActive !== undefined && (
                          <Badge variant={r.setActive ? 'success' : 'destructive'} className="rounded-full text-xs">
                            {r.setActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        DNI: {r.player?.dni} · Estado actual:{' '}
                        {r.player?.active ? 'Activo' : 'Inactivo'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Solicitado por: {r.member.fullName}{' '}
                        {r.member.phone ? `· ${r.member.phone}` : ''} · {formatDate(r.createdAt)}
                      </p>
                      {r.reason && (
                        <p className="mt-2 text-sm text-muted-foreground">Motivo: {r.reason}</p>
                      )}
                      {r.adminNote && (
                        <p className="mt-2 text-xs text-destructive">Nota del admin: {r.adminNote}</p>
                      )}
                    </div>

                    {r.status === 'PENDING' && (
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => { setApproving(r); setSetActive(r.player?.active ?? true); }}
                          disabled={approveMutation.isPending}
                        >
                          <Check size={14} /> Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600 hover:text-red-700"
                          onClick={() => { setRejecting(r); setRejectNote(''); }}
                        >
                          <X size={14} /> Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {approving && (
        <Dialog open onOpenChange={(open) => !open && setApproving(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Desvincular a {approving.player?.fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Se va a quitar el vínculo del socio con el jugador. Podés ajustar el estado del jugador en el club:
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={setActive === true ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSetActive(true)}
                >
                  Activo
                </Button>
                <Button
                  type="button"
                  variant={setActive === false ? 'destructive' : 'outline'}
                  className="flex-1"
                  onClick={() => setSetActive(false)}
                >
                  Inactivo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSetActive(null)}
                >
                  Sin cambio
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproving(null)}>
                Cancelar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => approveMutation.mutate({ id: approving.id, active: setActive ?? undefined })}
                disabled={approveMutation.isPending}
              >
                <Check size={14} className="mr-1" /> Confirmar desvinculación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {rejecting && (
        <Dialog open onOpenChange={(open) => !open && setRejecting(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rechazar desvinculación de {rejecting.player?.fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Motivo (opcional)</Label>
              <Textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Ej: el jugador tiene cuotas pendientes, falta documentación..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejecting(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate({ id: rejecting.id, note: rejectNote || undefined })}
                disabled={rejectMutation.isPending}
              >
                <X size={14} className="mr-1" /> Rechazar solicitud
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
