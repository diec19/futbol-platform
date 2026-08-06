'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { DollarSign, Plus, Zap, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BulkModal } from './generacion-masiva';
import { IndividualModal } from './individual-modal';
import { TablaCuotas } from './tabla-cuotas';
import { MONTHS } from './constants';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'LINK_SENT', label: 'Link enviado' },
  { value: 'PAID', label: 'Pagadas' },
  { value: 'OVERDUE', label: 'Vencidas' },
];

export default function CuotasPage() {
  const qc = useQueryClient();
  const now = new Date();

  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showBulk, setShowBulk] = useState(false);
  const [showIndividual, setShowIndividual] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mpAmountOpen, setMpAmountOpen] = useState<string | null>(null);
  const [mpAmountValue, setMpAmountValue] = useState<number>(0);

  const { data: catData } = useQuery({
    queryKey: ['club-categories'],
    queryFn: () => api.club.categories.list(),
  });
  const categories = catData?.data ?? [];

  const { data: playersData } = useQuery({
    queryKey: ['players-all'],
    queryFn: () => api.players.list({ isClubPlayer: 'true', limit: '500' }),
  });
  const players = playersData?.data ?? [];

  const params: Record<string, string> = {
    month: monthFilter,
    year: yearFilter,
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(categoryFilter !== 'ALL' ? { clubCategoryId: categoryFilter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['player-subs', params],
    queryFn: () => api.players.subscriptions.all(params),
  });

  const sendLinkMutation = useMutation({
    mutationFn: ({ subId, amount }: { subId: string; amount?: number }) =>
      api.players.subscriptions.sendLink(subId, amount !== undefined ? { amount } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player-subs'] });
      setMpAmountOpen(null);
      toast.success('Link de pago generado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const markPaidMutation = useMutation({
    mutationFn: (subId: string) => api.players.subscriptions.markPaid(subId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player-subs'] });
      toast.success('Cuota marcada como pagada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (subId: string) => api.players.subscriptions.remove(subId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player-subs'] });
      toast.success('Cuota eliminada');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const subs = data?.data ?? [];

  const copyLink = (sub: any) => {
    navigator.clipboard.writeText(sub.mpPaymentLink);
    setCopiedId(sub.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const whatsapp = (sub: any) => {
    const msg = encodeURIComponent(
      `Hola! Te enviamos el link de pago de la cuota ${MONTHS[sub.month - 1]} ${sub.year} de ${sub.player.fullName}: ${sub.mpPaymentLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const paid = subs.filter((s: any) => s.status === 'PAID').length;
  const pending = subs.filter((s: any) => s.status === 'PENDING').length;
  const linkSent = subs.filter((s: any) => s.status === 'LINK_SENT').length;
  const overdue = subs.filter((s: any) => s.status === 'OVERDUE').length;
  const totalCollected = subs
    .filter((s: any) => s.status === 'PAID')
    .reduce((a: number, s: any) => a + (s.totalAmount ?? s.amount), 0);

  const summary = [
    { label: 'Total', value: subs.length, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'Pagadas', value: paid, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Link enviado', value: linkSent, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Pendientes', value: pending, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'Vencidas', value: overdue, color: 'text-red-700', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {showBulk && (
        <BulkModal
          categories={categories}
          onClose={() => setShowBulk(false)}
          onDone={() => {
            setShowBulk(false);
            qc.invalidateQueries({ queryKey: ['player-subs'] });
            toast.success('Cuotas generadas');
          }}
        />
      )}
      {showIndividual && (
        <IndividualModal
          players={players}
          onClose={() => setShowIndividual(false)}
          onDone={() => {
            setShowIndividual(false);
            qc.invalidateQueries({ queryKey: ['player-subs'] });
            toast.success('Cuota creada');
          }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cuotas de Jugadores</h1>
          <p className="text-sm text-muted-foreground">
            {subs.length} cuotas — {MONTHS[Number(monthFilter) - 1]} {yearFilter}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-brand-red hover:bg-brand-red/5" onClick={() => setShowIndividual(true)}>
            <Plus size={15} />
            Agregar cuota
          </Button>
          <Button className="gap-2" onClick={() => setShowBulk(true)}>
            <Zap size={15} />
            Generar cuotas masivas
          </Button>
        </div>
      </div>

      {subs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {summary.map((s) => (
            <div key={s.label} className={`rounded-xl p-4 text-center ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {totalCollected > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-green-600 px-5 py-3">
          <DollarSign size={18} className="text-white/80" />
          <div>
            <p className="text-lg font-bold text-white">
              ${totalCollected.toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-green-100">recaudado este mes</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-muted-foreground" />
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las categorías</SelectItem>
            {categories.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <TablaCuotas
          subs={subs}
          isLoading={isLoading}
          copiedId={copiedId}
          mpAmountOpen={mpAmountOpen}
          mpAmountValue={mpAmountValue}
          sendLinkPending={sendLinkMutation.isPending}
          markPaidPending={markPaidMutation.isPending}
          onCopy={copyLink}
          onOpenMpAmount={(sub) => {
            setMpAmountOpen(sub.id);
            setMpAmountValue(sub.amount);
          }}
          onMpAmountChange={setMpAmountValue}
          onConfirmLink={(sub) => sendLinkMutation.mutate({ subId: sub.id, amount: mpAmountValue })}
          onCancelLink={() => setMpAmountOpen(null)}
          onWhatsapp={whatsapp}
          onMarkPaid={(sub) => markPaidMutation.mutate(sub.id)}
          onRemove={(sub) => removeMutation.mutate(sub.id)}
        />
      </div>
    </div>
  );
}
