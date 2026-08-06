'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { AlertTriangle, Plus, X, CheckCircle, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

export default function SanctionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterResolved, setFilterResolved] = useState('');
  const [form, setForm] = useState({
    playerId: '',
    reason: '',
    matchesBan: '',
    startDate: '',
    notes: '',
  });

  const { data: sanctionsData, isLoading } = useQuery({
    queryKey: ['sanctions', filterResolved],
    queryFn: () => api.sanctions.list({
      ...(filterResolved !== '' ? { resolved: filterResolved } : {}),
      limit: '50',
    }),
  });

  const { data: playersData } = useQuery({
    queryKey: ['players-all'],
    queryFn: () => api.players.list({ limit: '200' }),
    enabled: showForm,
  });

  const sanctions = sanctionsData?.data ?? [];
  const players = playersData?.data ?? [];

  const create = useMutation({
    mutationFn: () => api.sanctions.create({
      playerId: form.playerId,
      reason: form.reason,
      matchesBan: Number(form.matchesBan),
      startDate: form.startDate || new Date().toISOString(),
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sanctions'] });
      setShowForm(false);
      setForm({ playerId: '', reason: '', matchesBan: '', startDate: '', notes: '' });
      toast.success('Sanción creada correctamente');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resolve = useMutation({
    mutationFn: (id: string) => api.sanctions.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sanctions'] });
      toast.success('Sanción resuelta');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.sanctions.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sanctions'] });
      toast.success('Sanción eliminada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const pending = sanctions.filter((s: any) => !s.resolved);
  const resolved = sanctions.filter((s: any) => s.resolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sanciones</h1>
          <p className="text-sm text-muted-foreground">
            {pending.length} pendientes · {resolved.length} resueltas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterResolved} onValueChange={setFilterResolved}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="false">Pendientes</SelectItem>
              <SelectItem value="true">Resueltas</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva sanción
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Nueva sanción</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Jugador *</Label>
                <Select value={form.playerId} onValueChange={(v) => setForm(f => ({ ...f, playerId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar jugador" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName}{p.team ? ` (${p.team.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fechas de suspensión *</Label>
                <Input type="number" min={1} value={form.matchesBan} onChange={set('matchesBan')} placeholder="1" />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de inicio *</Label>
                <Input type="date" value={form.startDate} onChange={set('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Notas</Label>
                <Input type="text" value={form.notes} onChange={set('notes')} placeholder="Notas adicionales" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Motivo *</Label>
                <Textarea value={form.reason} onChange={set('reason')} rows={2} placeholder="Descripción del motivo de la sanción" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending || !form.playerId || !form.reason || !form.matchesBan}
              >
                {create.isPending ? 'Guardando...' : 'Crear sanción'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border overflow-hidden bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sanctions.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No hay sanciones</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sanctions.map((s: any) => (
                <TableRow key={s.id} className={s.resolved ? 'opacity-60' : ''}>
                  <TableCell>
                    <p className="font-medium">{s.player?.fullName ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{s.player?.team?.name}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-xs truncate">{s.reason ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.matchesBan ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDate(s.startDate)}</TableCell>
                  <TableCell>
                    <Badge variant={s.resolved ? 'success' : 'destructive'}>
                      {s.resolved ? 'Resuelta' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {!s.resolved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => resolve.mutate(s.id)}
                          disabled={resolve.isPending}
                          title="Marcar como resuelta"
                          className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <ConfirmDialog
                        title="Eliminar sanción"
                        description="¿Eliminar esta sanción? Esta acción no se puede deshacer."
                        confirmLabel="Eliminar"
                        destructive
                        onConfirm={() => remove.mutate(s.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
