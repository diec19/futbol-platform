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
  const [target, setTarget] = useState<'players' | 'members'>('players');
  const [form, setForm] = useState({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    amount: '',
    dueDate: '',
    clubCategoryId: '',
  });
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ created: number; total: number; skipped?: number; waMessages?: any[] } | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!form.amount || !form.dueDate) { setError('Monto y vencimiento son requeridos'); return; }
    setSaving(true);
    setError('');
    setResult(null);
    try {
      const payload: any = {
        month: Number(form.month),
        year: Number(form.year),
        amount: Number(form.amount),
        dueDate: new Date(form.dueDate).toISOString(),
        sendWhatsapp,
      };
      let res: any;
      if (target === 'players') {
        payload.clubCategoryId = form.clubCategoryId || undefined;
        res = await api.players.subscriptions.bulk(payload);
      } else {
        res = await api.members.subscriptions.bulk(payload);
      }
      setResult(res.data ?? res);
    } catch (e: any) { setError(e.message ?? 'Error'); } finally { setSaving(false); }
  };

  const openWhatsApp = (waUrl: string) => {
    window.open(waUrl, '_blank');
  };

  if (result) {
    const waMsgs = result.waMessages ?? [];
    const waCount = waMsgs.length;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-800 flex items-center gap-2"><Zap size={16} className="text-green-600" />Cuotas generadas</p>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{result.created}/{result.total}</p>
            <p className="text-sm text-green-600">
              cuotas creadas
              {result.skipped ? <span className="text-amber-600 ml-1">({result.skipped} ya existían)</span> : null}
            </p>
          </div>

          {waCount > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">{waCount} WhatsApp listos para enviar</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {waMsgs.map((w: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                    <div className="text-sm">
                      <p className="font-medium text-slate-800">{w.name ?? w.playerName}</p>
                      <p className="text-xs text-slate-400">{w.month} {w.year}</p>
                    </div>
                    <button
                      onClick={() => openWhatsApp(w.waUrl)}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 whitespace-nowrap"
                      title="Se abre WhatsApp con el mensaje listo. Presioná Enter para enviar."
                    >
                      WhatsApp
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => waMsgs.forEach((w: any) => openWhatsApp(w.waUrl))}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Enviar todos los WhatsApp ({waCount})
              </button>
              <p className="text-xs text-slate-500 text-center">Se abre WhatsApp con el mensaje listo. Presioná <strong>Enter</strong> para enviar cada uno.</p>
            </div>
          )}

          <button onClick={onDone} className="w-full px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark">
            Finalizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800 flex items-center gap-2"><Zap size={16} className="text-brand-red" />Generar cuotas masivas</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
          <button onClick={() => setTarget('players')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${target === 'players' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Jugadores
          </button>
          <button onClick={() => setTarget('members')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${target === 'members' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Socios
          </button>
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

        {target === 'players' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Categoría (opcional)</label>
            <select value={form.clubCategoryId} onChange={(e) => setForm(f => ({ ...f, clubCategoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Todos los jugadores activos</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)}
            className="rounded border-slate-300 text-brand-red focus:ring-brand-red" />
          Generar link MP y enviar WhatsApp automáticamente
        </label>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button onClick={handleGenerate} disabled={saving}
            className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50">
            {saving ? 'Generando...' : `Generar ${target === 'players' ? 'Jugadores' : 'Socios'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Individual cuota modal ──────────────────────────────────────────────────────
function IndividualModal({ categories, players, onClose, onDone }: { categories: any[]; players: any[]; onClose: () => void; onDone: () => void }) {
  const now = new Date();
  const qc = useQueryClient();
  const [playerId, setPlayerId] = useState('');
  const [form, setForm] = useState({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    amount: '',
    dueDate: '',
  });
  const [generarLink, setGenerarLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!playerId || !form.amount || !form.dueDate) { setError('Completá todos los campos'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.players.subscriptions.create(playerId, {
        month: Number(form.month),
        year: Number(form.year),
        amount: Number(form.amount),
        dueDate: new Date(form.dueDate).toISOString(),
      });
      const sub = res.data ?? res;
      if (generarLink) {
        await api.players.subscriptions.sendLink(sub.id);
      }
      qc.invalidateQueries({ queryKey: ['player-subs'] });
      onDone();
    } catch (e: any) { setError(e.message ?? 'Error'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">Agregar cuota individual</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Jugador</label>
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Seleccionar jugador...</option>
            {players.map((p: any) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
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

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={generarLink} onChange={(e) => setGenerarLink(e.target.checked)}
            className="rounded border-slate-300 text-brand-red focus:ring-brand-red" />
          Generar link de pago MP
        </label>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button onClick={handleCreate} disabled={saving}
            className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50">
            {saving ? 'Creando...' : 'Crear cuota'}
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
  const [showIndividual, setShowIndividual] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mpAmountOpen, setMpAmountOpen] = useState<string | null>(null);
  const [mpAmountValue, setMpAmountValue] = useState<number>(0);

  const { data: catData } = useQuery({ queryKey: ['club-categories'], queryFn: () => api.club.categories.list() });
  const categories = catData?.data ?? [];

  const { data: playersData } = useQuery({
    queryKey: ['players-all'],
    queryFn: () => api.players.list({ isClubPlayer: 'true', limit: '500' }),
  });
  const players = playersData?.data ?? [];

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

  const createMutation = useMutation({
    mutationFn: ({ playerId, data }: { playerId: string; data: unknown }) => api.players.subscriptions.create(playerId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player-subs'] }),
  });

  const sendLinkMutation = useMutation({
    mutationFn: ({ subId, amount }: { subId: string; amount?: number }) =>
      api.players.subscriptions.sendLink(subId, amount !== undefined ? { amount } : {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['player-subs'] }); setMpAmountOpen(null); },
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
      {showIndividual && (
        <IndividualModal
          categories={categories}
          players={players}
          onClose={() => setShowIndividual(false)}
          onDone={() => { setShowIndividual(false); qc.invalidateQueries({ queryKey: ['player-subs'] }); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuotas de Jugadores</h1>
          <p className="text-gray-500 text-sm mt-1">{subs.length} cuotas — {MONTHS[Number(monthFilter) - 1]} {yearFilter}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowIndividual(true)}
            className="flex items-center gap-2 px-4 py-2 border border-brand-red text-brand-red rounded-xl text-sm font-medium hover:bg-brand-red/5 transition-colors">
            <Plus size={15} />
            Agregar cuota
          </button>
          <button onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-medium hover:bg-brand-red-dark transition-colors">
            <Zap size={15} />
            Generar cuotas masivas
          </button>
        </div>
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
                          mpAmountOpen === sub.id ? (
                            <div className="flex items-center gap-1">
                              <input type="number"
                                value={mpAmountValue}
                                onChange={(e) => setMpAmountValue(+e.target.value)}
                                className="w-20 px-1.5 py-1 border border-slate-200 rounded text-xs text-center"
                                autoFocus />
                              <button onClick={() => sendLinkMutation.mutate({ subId: sub.id, amount: mpAmountValue })}
                                disabled={sendLinkMutation.isPending}
                                className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">OK</button>
                              <button onClick={() => setMpAmountOpen(null)}
                                className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs">X</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setMpAmountOpen(sub.id); setMpAmountValue(sub.amount); }}
                              title="Generar link MP"
                              className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 whitespace-nowrap"
                            >
                              <Send size={11} className="inline mr-1" />
                              {sub.mpPaymentLink ? 'Reenviar' : 'Link MP'}
                            </button>
                          )
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
