'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  DollarSign, Plus, Send, CheckCircle, Clock, AlertCircle,
  Copy, Filter, ChevronDown, Users, Zap,
} from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const STATUS_CFG = {
  PENDING:   { label: 'Pendiente',    bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock },
  LINK_SENT: { label: 'Link enviado', bg: 'bg-blue-50',   text: 'text-blue-600',  icon: Send },
  PAID:      { label: 'Pagada',       bg: 'bg-green-50',  text: 'text-green-700', icon: CheckCircle },
  OVERDUE:   { label: 'Vencida',      bg: 'bg-red-50',    text: 'text-red-600',   icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Bulk generation modal ─────────────────────────────────────────────────────
function BulkModal({ categories, onClose, onDone }: { categories: any[]; onClose: () => void; onDone: () => void }) {
  const now = new Date();
  const [form, setForm] = useState({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    amount: '',
    dueDate: '',
    clubCategoryId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!form.amount || !form.dueDate) { setError('Monto y vencimiento son requeridos'); return; }
    setSaving(true);
    setError('');
    try {
      const result = await api.players.subscriptions.bulk({
        month: Number(form.month),
        year: Number(form.year),
        amount: Number(form.amount),
        dueDate: new Date(form.dueDate).toISOString(),
        clubCategoryId: form.clubCategoryId || undefined,
      });
      onDone();
    } catch (e: any) { setError(e.message ?? 'Error'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800 flex items-center gap-2"><Zap size={16} className="text-brand-red" />Generar cuotas masivas</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Mes</label>
            <select value={form.month} onChange={(e) => setForm(f => ({ ...f, month: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Año</label>
            <input type="number" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Monto ($)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="3500"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Vencimiento</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Categoría (opcional — dejar vacío para todos)</label>
          <select value={form.clubCategoryId} onChange={(e) => setForm(f => ({ ...f, clubCategoryId: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Todos los jugadores activos</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button onClick={handleGenerate} disabled={saving}
            className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50">
            {saving ? 'Generando...' : 'Generar cuotas'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CuotasPage() {
  const qc = useQueryClient();
  const now = new Date();

  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: catData } = useQuery({ queryKey: ['club-categories'], queryFn: () => api.club.categories.list() });
  const categories = catData?.data ?? [];

  const params: Record<string, string> = {
    month: monthFilter,
    year: yearFilter,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(categoryFilter ? { clubCategoryId: categoryFilter } : {}),
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['player-subs', params],
    queryFn: () => api.players.subscriptions.all(params),
  });

  const sendLinkMutation = useMutation({
    mutationFn: (subId: string) => api.players.subscriptions.sendLink(subId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player-subs'] }),
  });

  const markPaidMutation = useMutation({
    mutationFn: (subId: string) => api.players.subscriptions.markPaid(subId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player-subs'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (subId: string) => api.players.subscriptions.remove(subId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player-subs'] }),
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

  // Summary stats
  const paid = subs.filter((s: any) => s.status === 'PAID').length;
  const pending = subs.filter((s: any) => s.status === 'PENDING').length;
  const linkSent = subs.filter((s: any) => s.status === 'LINK_SENT').length;
  const overdue = subs.filter((s: any) => s.status === 'OVERDUE').length;
  const totalCollected = subs.filter((s: any) => s.status === 'PAID').reduce((a: number, s: any) => a + s.amount, 0);

  return (
    <div className="space-y-6">
      {showBulk && (
        <BulkModal
          categories={categories}
          onClose={() => setShowBulk(false)}
          onDone={() => { setShowBulk(false); qc.invalidateQueries({ queryKey: ['player-subs'] }); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuotas de Jugadores</h1>
          <p className="text-gray-500 text-sm mt-1">{subs.length} cuotas — {MONTHS[Number(monthFilter) - 1]} {yearFilter}</p>
        </div>
        <button onClick={() => setShowBulk(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-medium hover:bg-brand-red-dark transition-colors">
          <Zap size={15} />
          Generar cuotas masivas
        </button>
      </div>

      {/* Summary cards */}
      {subs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: subs.length, color: 'text-slate-700', bg: 'bg-slate-50' },
            { label: 'Pagadas', value: paid, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Link enviado', value: linkSent, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Pendientes', value: pending, color: 'text-slate-600', bg: 'bg-slate-100' },
            { label: 'Vencidas', value: overdue, color: 'text-red-700', bg: 'bg-red-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {totalCollected > 0 && (
        <div className="bg-green-600 rounded-xl px-5 py-3 flex items-center gap-3">
          <DollarSign size={18} className="text-white/80" />
          <div>
            <p className="text-white font-bold text-lg">${totalCollected.toLocaleString('es-AR')}</p>
            <p className="text-green-100 text-xs">recaudado este mes</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-slate-400" />
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Todas las categorías</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendientes</option>
          <option value="LINK_SENT">Link enviado</option>
          <option value="PAID">Pagadas</option>
          <option value="OVERDUE">Vencidas</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Cargando cuotas...</div>
        ) : subs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <DollarSign size={40} className="mx-auto text-slate-200" />
            <p className="text-gray-400 font-medium">No hay cuotas generadas</p>
            <p className="text-gray-300 text-sm">Usá "Generar cuotas masivas" para crear las cuotas del mes de un golpe</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Jugador</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Categoría / Profe</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Monto</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Vence</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subs.map((sub: any) => {
                const p = sub.player;
                return (
                  <tr key={sub.id} className="hover:bg-gray-50 group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-navy/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-brand-navy">{p.fullName[0]}</span>
                          </div>
                        )}
                        <div>
                          {p.firstName && p.lastName ? (
                            <>
                              <span className="font-semibold text-slate-800">{p.lastName}</span>
                              <span className="text-slate-500">, {p.firstName}</span>
                            </>
                          ) : (
                            <span className="font-semibold text-slate-800">{p.fullName}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.clubCategory ? (
                        <div>
                          <p className="font-medium text-slate-700 text-xs">{p.clubCategory.name}</p>
                          {p.clubCategory.coach && (
                            <p className="text-slate-400 text-xs">Prof. {p.clubCategory.coach}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      ${sub.amount.toLocaleString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {new Date(sub.dueDate).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Generar / Enviar link MP */}
                        {sub.status !== 'PAID' && (
                          <button
                            onClick={() => sendLinkMutation.mutate(sub.id)}
                            disabled={sendLinkMutation.isPending}
                            title="Generar link MP"
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            <Send size={11} className="inline mr-1" />
                            {sub.mpPaymentLink ? 'Reenviar' : 'Link MP'}
                          </button>
                        )}

                        {/* Copy link */}
                        {sub.mpPaymentLink && sub.status !== 'PAID' && (
                          <button onClick={() => copyLink(sub)} title="Copiar link"
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                            <Copy size={13} />
                          </button>
                        )}

                        {/* WhatsApp */}
                        {sub.mpPaymentLink && sub.status !== 'PAID' && (
                          <button onClick={() => whatsapp(sub)} title="Enviar por WhatsApp"
                            className="p-1.5 text-green-500 hover:text-green-600 rounded text-xs font-bold">
                            WA
                          </button>
                        )}

                        {/* Marcar pagado */}
                        {sub.status !== 'PAID' && (
                          <button onClick={() => markPaidMutation.mutate(sub.id)} disabled={markPaidMutation.isPending}
                            title="Marcar pagada"
                            className="p-1.5 text-slate-400 hover:text-green-600 rounded">
                            <CheckCircle size={14} />
                          </button>
                        )}

                        {/* Eliminar */}
                        <button onClick={() => removeMutation.mutate(sub.id)} disabled={removeMutation.isPending}
                          title="Eliminar"
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded text-xs">
                          ✕
                        </button>
                      </div>

                      {copiedId === sub.id && (
                        <span className="text-xs text-green-600 font-medium">¡Copiado!</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
