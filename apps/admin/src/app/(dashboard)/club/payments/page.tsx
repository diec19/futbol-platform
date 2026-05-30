'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreditCard, Plus, Trash2, CheckCircle, AlertCircle, Clock, Users, User } from 'lucide-react';

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  team_payment:         { label: 'Equipo',     bg: 'bg-slate-100', text: 'text-slate-700' },
  member_subscription: { label: 'Socio',      bg: 'bg-blue-50',   text: 'text-blue-700' },
  player_subscription: { label: 'Jugador',    bg: 'bg-amber-50',  text: 'text-amber-700' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  PENDING:   { label: 'Pendiente', icon: Clock,       color: 'text-amber-600 bg-amber-50' },
  LINK_SENT: { label: 'Link enviado', icon: Clock,    color: 'text-blue-600 bg-blue-50' },
  PAID:      { label: 'Pagado',     icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  OVERDUE:   { label: 'Vencido',    icon: AlertCircle, color: 'text-red-600 bg-red-50' },
};

function PaymentForm({ teams, onSave, onCancel }: { teams: any[]; onSave: (d: any) => void; onCancel: () => void }) {
  const [teamId, setTeamId] = useState('');
  const [type, setType] = useState('MONTHLY_FEE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
      <p className="font-semibold text-sm text-slate-700">Registrar pago / deuda de equipo</p>
      <div className="grid grid-cols-2 gap-3">
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red bg-white" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">Seleccionar equipo *</option>
          {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red bg-white" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="MONTHLY_FEE">Cuota mensual</option>
          <option value="REGISTRATION">Inscripción</option>
          <option value="FINE">Multa</option>
          <option value="OTHER">Otro</option>
        </select>
        <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" type="number" placeholder="Monto ($) *" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" type="date" placeholder="Fecha vencimiento" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <input className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
        <button
          onClick={() => { if (!teamId || !amount) return; onSave({ teamId, type, amount: parseFloat(amount), description: description || undefined, dueDate: dueDate || undefined }); }}
          className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-brand-red-dark"
        >Registrar</button>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.team_payment;
  const Icon = type === 'member_subscription' ? Users : type === 'player_subscription' ? User : CreditCard;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon size={10} />{cfg.label}
    </span>
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
  const { data: teamsData } = useQuery({ queryKey: ['teams-all'], queryFn: () => api.teams.list() });

  const items = data?.data ?? [];
  const teams = teamsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.club.payments.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-finance'] }); setShowForm(false); },
  });
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.club.payments.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-finance'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.payments.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-finance'] }),
  });

  const totalAmount = items.reduce((s: number, i: any) => s + i.amount, 0);
  const pendingAmount = items.filter((i: any) => i.status === 'PENDING' || i.status === 'OVERDUE' || i.status === 'LINK_SENT').reduce((s: number, i: any) => s + i.amount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="text-brand-red" size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pagos y Cuotas</h1>
            <p className="text-sm text-slate-500">{items.length} registros — incluye equipos, socios y jugadores</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark">
            <Plus size={15} /> Registrar pago de equipo
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-medium">Pendiente + Vencido</p>
          <p className="text-2xl font-bold text-amber-700">${pendingAmount.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Total mostrado</p>
          <p className="text-2xl font-bold text-slate-800">${totalAmount.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Registros</p>
          <p className="text-2xl font-bold text-slate-800">{items.length}</p>
        </div>
      </div>

      {showForm && <PaymentForm teams={teams} onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        {['ALL', 'PENDING', 'LINK_SENT', 'PAID', 'OVERDUE'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {s === 'ALL' ? 'Todos' : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
        {/* Type filter */}
        <span className="text-slate-300 mx-1">|</span>
        {['ALL', 'team_payment', 'member_subscription', 'player_subscription'].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {t === 'ALL' ? 'Todos' : TYPE_CONFIG[t]?.label ?? t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay registros financieros</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Entidad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vencimiento</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: any) => {
                const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
                const Icon = cfg.icon;
                return (
                  <tr key={`${item._type}-${item.id}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={item._type} />
                        <span className="font-medium text-slate-800">{item.entityName}</span>
                      </div>
                      {item.entityDetail && <p className="text-xs text-slate-400 mt-0.5">{item.entityDetail}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{item.description}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">${item.amount.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>
                        <Icon size={11} />{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.dueDate ? new Date(item.dueDate).toLocaleDateString('es-AR') : '—'}</td>
                    <td className="px-4 py-3">
                      {item._type === 'team_payment' && (
                        <div className="flex gap-1 justify-end">
                          {(item.status === 'PENDING' || item.status === 'OVERDUE') && (
                            <button onClick={() => markPaidMutation.mutate(item.id)} title="Marcar pagado" className="px-2.5 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium">
                              Pagado ✓
                            </button>
                          )}
                          <button onClick={() => deleteMutation.mutate(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
