'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { UserPlus, Check, X, Clock } from 'lucide-react';
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

export default function JoinRequestsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejecting, setRejecting] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['join-requests', filter],
    queryFn: () => api.members.joinRequests.list(filter === 'ALL' ? undefined : filter),
  });
  const requests = data?.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['join-requests'] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.members.joinRequests.approve(id),
    onSuccess: () => {
      invalidate();
      toast.success('Jugador creado y vinculado al socio');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.members.joinRequests.reject(id, note),
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
          <h1 className="text-2xl font-bold tracking-tight">Altas de jugadores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Socios que pidieron cargar a un jugador que no estaba en el plantel
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
          <UserPlus size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay solicitudes {filter === 'PENDING' ? 'pendientes' : ''}</p>
          <p className="mt-1 text-sm">
            Cuando un socio pida dar de alta a un jugador, aparece acá
          </p>
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
                        <p className="font-semibold">{r.fullName}</p>
                        <Badge variant={meta.variant} className="rounded-full text-xs">
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        DNI: {r.dni} · Nacimiento:{' '}
                        {new Date(r.birthDate).toLocaleDateString('es-AR')}
                        {r.category ? ` · ${r.category.name}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Solicitado por: {r.member.fullName}{' '}
                        {r.member.phone ? `· ${r.member.phone}` : ''} · {formatDate(r.createdAt)}
                      </p>
                      {r.adminNote && (
                        <p className="mt-2 text-xs text-destructive">Motivo: {r.adminNote}</p>
                      )}
                    </div>

                    {r.status === 'PENDING' && (
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate(r.id)}
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

      {rejecting && (
        <Dialog open onOpenChange={(open) => !open && setRejecting(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rechazar alta de {rejecting.fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Motivo (opcional)</Label>
              <Textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Ej: el jugador ya está cargado con otro DNI, falta documentación..."
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
