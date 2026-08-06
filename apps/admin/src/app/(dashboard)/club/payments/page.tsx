'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { CreditCard, Plus, Trash2, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';

const TYPE_CONFIG: Record<string, { label: string; variant: NonNullable<BadgeProps['variant']> }> = {
  team_payment: { label: 'Equipo', variant: 'secondary' },
  member_subscription: { label: 'Socio', variant: 'info' },
  player_subscription: { label: 'Jugador', variant: 'warning' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: NonNullable<BadgeProps['variant']> }> = {
  PENDING: { label: 'Pendiente', variant: 'neutral' },
  LINK_SENT: { label: 'Link enviado', variant: 'info' },
  PAID: { label: 'Pagado', variant: 'success' },
  OVERDUE: { label: 'Vencido', variant: 'destructive' },
};

function PaymentForm({ teams, onSave, onCancel }: { teams: any[]; onSave: (d: any) => void; onCancel: () => void }) {
  const [teamId, setTeamId] = useState('');
  const [type, setType] = useState('MONTHLY_FEE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm font-semibold">Registrar pago / deuda de equipo</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Equipo *</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY_FEE">Cuota mensual</SelectItem>
                <SelectItem value="REGISTRATION">Inscripción</SelectItem>
                <SelectItem value="FINE">Multa</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Monto ($) *</Label>
            <Input type="number" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha vencimiento</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!teamId || !amount) return;
              onSave({
                teamId,
                type,
                amount: parseFloat(amount),
                description: description || undefined,
                dueDate: dueDate || undefined,
              });
            }}
          >
            Registrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.team_payment;
  const Icon = type === 'member_subscription' ? Users : type === 'player_subscription' ? User : CreditCard;
  return (
    <Badge variant={cfg.variant} className="gap-1 rounded-full">
      <Icon size={10} />
      {cfg.label}
    </Badge>
  );
}

export default function ClubPaymentsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (statusFilter !== 'ALL') p.status = statusFilter;
    if (typeFilter !== 'ALL') p.type = typeFilter;
    return p;
  }, [statusFilter, typeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['club-finance', params],
    queryFn: () => api.club.finance.all(Object.keys(params).length ? params : undefined),
  });
  const { data: teamsData } = useQuery({
    queryKey: ['teams-all'],
    queryFn: () => api.teams.list(),
  });

  const items = data?.data ?? [];
  const teams = teamsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.club.payments.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-finance'] });
      setShowForm(false);
      toast.success('Pago registrado');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.club.payments.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-finance'] });
      toast.success('Pago marcado como pagado');
    },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.payments.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-finance'] });
      toast.success('Registro eliminado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalAmount = items.reduce((s: number, i: any) => s + i.amount, 0);
  const pendingAmount = items
    .filter((i: any) => i.status === 'PENDING' || i.status === 'OVERDUE' || i.status === 'LINK_SENT')
    .reduce((s: number, i: any) => s + i.amount, 0);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="text-brand-red" size={24} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pagos y Cuotas</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} registros — incluye equipos, socios y jugadores
            </p>
          </div>
        </div>
        {!showForm && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Registrar pago de equipo
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-amber-600">Pendiente + Vencido</p>
            <p className="text-2xl font-bold text-amber-700">
              ${pendingAmount.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-muted-foreground">Total mostrado</p>
            <p className="text-2xl font-bold">${totalAmount.toLocaleString('es-AR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-muted-foreground">Registros</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && <PaymentForm teams={teams} onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'PENDING', 'LINK_SENT', 'PAID', 'OVERDUE'].map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            className={statusFilter === s ? '' : 'text-muted-foreground'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? 'Todos' : STATUS_CONFIG[s]?.label ?? s}
          </Button>
        ))}
        <span className="mx-1 text-muted-foreground/40">|</span>
        {['ALL', 'team_payment', 'member_subscription', 'player_subscription'].map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={typeFilter === t ? 'default' : 'outline'}
            className={typeFilter === t ? '' : 'text-muted-foreground'}
            onClick={() => setTypeFilter(t)}
          >
            {t === 'ALL' ? 'Todos' : TYPE_CONFIG[t]?.label ?? t}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay registros financieros</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entidad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={`${item._type}-${item.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeBadge type={item._type} />
                      <span className="font-medium">{item.entityName}</span>
                    </div>
                    {item.entityDetail && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.entityDetail}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.description}</TableCell>
                  <TableCell className="font-semibold">${item.amount.toLocaleString('es-AR')}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[item.status]?.variant ?? 'neutral'} className="gap-1 rounded-full">
                      {STATUS_CONFIG[item.status]?.label ?? item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString('es-AR') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item._type === 'team_payment' && (
                      <div className="flex justify-end gap-1">
                        {(item.status === 'PENDING' || item.status === 'OVERDUE') && (
                          <Button
                            size="sm"
                            className="bg-green-100 text-xs text-green-700 hover:bg-green-200"
                            onClick={() => markPaidMutation.mutate(item.id)}
                            title="Marcar pagado"
                          >
                            Pagado ✓
                          </Button>
                        )}
                        <ConfirmDialog
                          title="Eliminar registro"
                          description="¿Eliminar este registro financiero? Esta acción no se puede deshacer."
                          confirmLabel="Eliminar"
                          destructive
                          onConfirm={() => deleteMutation.mutate(item.id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 size={14} />
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
