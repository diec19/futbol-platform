'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreditCard, Plus, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const PAYMENT_TYPES = [
  { value: 'REGISTRATION', label: 'Inscripción' },
  { value: 'MONTHLY_FEE', label: 'Cuota mensual' },
  { value: 'FINE', label: 'Multa' },
  { value: 'OTHER', label: 'Otro' },
];

const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  PAID: { label: 'Pagado', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  OVERDUE: { label: 'Vencido', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
};

function PaymentForm({ teams, onSave, onCancel }: { teams: any[]; onSave: (d: any) => void; onCancel: () => void }) {
  const [teamId, setTeamId] = useState('');
  const [type, setType] = useState('MONTHLY_FEE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
      <p className="font-semibold text-sm text-slate-700">Registrar pago / deuda</p>
      <div className="grid grid-cols-2 gap-3">
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red bg-white" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">Seleccionar equipo *</option>
          {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red bg-white" value={type} onChange={(e) => setType(e.target.value)}>
          {PAYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
        >
          Registrar
        </button>
      </div>
    </div>
  );
}

export default function ClubPaymentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['club-payments'], queryFn: () => api.club.payments.list() });
  const { data: teamsData } = useQuery({ queryKey: ['teams-all'], queryFn: () => api.teams.list() });

  const payments = (data?.data ?? []).filter((p: any) => filter === 'ALL' || p.status === filter);
  const teams = teamsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.club.payments.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-payments'] }); setShowForm(false); },
  });
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.club.payments.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-payments'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.payments.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-payments'] }),
  });

  const total = payments.reduce((s: number, p: any) => s + p.amount, 0);
  const pending = (data?.data ?? []).filter((p: any) => p.status === 'PENDING').reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="text-brand-red" size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pagos y Cuotas</h1>
            <p className="text-sm text-slate-500">{data?.data?.length ?? 0} registros</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark">
            <Plus size={15} /> Registrar
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-medium">Pendiente total</p>
          <p className="text-2xl font-bold text-amber-700">${pending.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Filtrado actual</p>
          <p className="text-2xl font-bold text-slate-800">${total.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Registros</p>
          <p className="text-2xl font-bold text-slate-800">{payments.length}</p>
        </div>
      </div>

      {showForm && <PaymentForm teams={teams} onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      {/* Filter */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'PAID', 'OVERDUE'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {s === 'ALL' ? 'Todos' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay registros de pagos</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Equipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vencimiento</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p: any) => {
                const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG];
                const Icon = cfg?.icon ?? Clock;
                const typeLabel = PAYMENT_TYPES.find((t) => t.value === p.type)?.label ?? p.type;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.team?.name}</td>
                    <td className="px-4 py-3 text-slate-600">{typeLabel}{p.description && <span className="text-slate-400 ml-1">— {p.description}</span>}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">${p.amount.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cfg?.color}`}>
                        <Icon size={11} />{cfg?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.dueDate ? new Date(p.dueDate).toLocaleDateString('es-AR') : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        {p.status === 'PENDING' && (
                          <button onClick={() => markPaidMutation.mutate(p.id)} title="Marcar como pagado" className="px-2.5 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium">
                            Pagado ✓
                          </button>
                        )}
                        <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
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
