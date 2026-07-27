'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Plus, X, Pencil, Trash2, Handshake, DollarSign, Calendar,
  CheckCircle, Clock, Pause, Link as LinkIcon,
} from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Sponsor Modal ────────────────────────────────────────────────────────────
function SponsorModal({ sponsor, onClose, onSaved }: { sponsor?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(
    sponsor ? {
      name: sponsor.name,
      contactName: sponsor.contactName ?? '',
      phone: sponsor.phone ?? '',
      email: sponsor.email ?? '',
      logoUrl: sponsor.logoUrl ?? '',
      website: sponsor.website ?? '',
    } : { name: '', contactName: '', phone: '', email: '', logoUrl: '', website: '' }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = { name: form.name.trim() };
      if (form.contactName) payload.contactName = form.contactName;
      if (form.phone) payload.phone = form.phone;
      if (form.email) payload.email = form.email;
      if (form.logoUrl) payload.logoUrl = form.logoUrl;
      if (form.website) payload.website = form.website;
      if (sponsor) {
        await api.sponsors.update(sponsor.id, payload);
      } else {
        await api.sponsors.create(payload);
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? 'Error al guardar'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">{sponsor ? 'Editar auspiciante' : 'Nuevo auspiciante'}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
            <input value={form.name} onChange={set('name')} placeholder="Ej: Coca-Cola"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Contacto</label>
              <input value={form.contactName} onChange={set('contactName')} placeholder="Nombre del contacto"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
              <input value={form.phone} onChange={set('phone')} placeholder="11-1234-5678"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <input value={form.email} onChange={set('email')} type="email" placeholder="contacto@coca-cola.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Logo URL</label>
            <input value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sitio web</label>
            <input value={form.website} onChange={set('website')} placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan Modal ───────────────────────────────────────────────────────────────
function PlanModal({ plan, onClose, onSaved }: { plan?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(
    plan ? {
      name: plan.name,
      monthlyAmount: String(plan.monthlyAmount),
      durationMonths: String(plan.durationMonths),
      description: plan.description ?? '',
    } : { name: '', monthlyAmount: '', durationMonths: '6', description: '' }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.monthlyAmount) { setError('Nombre y monto son requeridos'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = {
        name: form.name.trim(),
        monthlyAmount: Number(form.monthlyAmount),
        durationMonths: Number(form.durationMonths) || 6,
      };
      if (form.description) payload.description = form.description;
      if (plan) {
        await api.sponsors.plans.update(plan.id, payload);
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? 'Error al guardar'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">{plan ? 'Editar plan' : 'Nuevo plan'}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del plan *</label>
            <input value={form.name} onChange={set('name')} placeholder="Ej: Plan Oro"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Monto mensual ($) *</label>
              <input type="number" value={form.monthlyAmount} onChange={set('monthlyAmount')} placeholder="50000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Duración (meses)</label>
              <input type="number" value={form.durationMonths} onChange={set('durationMonths')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
            <input value={form.description} onChange={set('description')} placeholder="Descripción del plan"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sponsorship Modal ────────────────────────────────────────────────────────
function SponsorshipModal({ sponsor, plans, onClose, onSaved }: { sponsor: any; plans: any[]; onClose: () => void; onSaved: () => void }) {
  const now = new Date();
  const [form, setForm] = useState({
    planId: plans[0]?.id ?? '',
    startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    endDate: `${now.getFullYear()}-${String(now.getMonth() + 7).padStart(2, '0')}-01`,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.planId) { setError('Seleccioná un plan'); return; }
    setSaving(true); setError('');
    try {
      await api.sponsorships.create({
        sponsorId: sponsor.id,
        planId: form.planId,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      onSaved();
    } catch (e: any) { setError(e.message ?? 'Error al crear'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">Crear auspiciarion para {sponsor.name}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Plan</label>
            <select value={form.planId} onChange={(e) => setForm(f => ({ ...f, planId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {plans.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} — ${p.monthlyAmount.toLocaleString('es-AR')}/mes</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Inicio</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fin</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50">
            {saving ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  ACTIVE:  { label: 'Activo',   bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
  PAUSED:  { label: 'Pausado',  bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Pause },
  EXPIRED: { label: 'Vencido',  bg: 'bg-slate-100', text: 'text-slate-600',  icon: Clock },
  CANCELLED: { label: 'Cancelado', bg: 'bg-red-50', text: 'text-red-600',   icon: X },
};

const PAYMENT_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:   { label: 'Pendiente', bg: 'bg-slate-100', text: 'text-slate-600' },
  LINK_SENT: { label: 'Link enviado', bg: 'bg-blue-50', text: 'text-blue-600' },
  PAID:      { label: 'Pagada',   bg: 'bg-green-50',  text: 'text-green-700' },
  OVERDUE:   { label: 'Vencida',  bg: 'bg-red-50',    text: 'text-red-600' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SponsorsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editSponsor, setEditSponsor] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPlanFor, setShowPlanFor] = useState<any>(null);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [showSponsorshipFor, setShowSponsorshipFor] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => api.sponsors.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.sponsors.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsors'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.sponsors.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsors'] }),
  });

  const removePlanMutation = useMutation({
    mutationFn: (planId: string) => api.sponsors.plans.remove(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsors'] }),
  });

  const cancelSponsorshipMutation = useMutation({
    mutationFn: (id: string) => api.sponsorships.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsors'] }),
  });

  const sponsors = data?.data ?? [];

  // Fetch expanded sponsor details
  const { data: expandedData } = useQuery({
    queryKey: ['sponsor-detail', expandedId],
    queryFn: () => api.sponsors.get(expandedId!),
    enabled: !!expandedId,
  });
  const expandedSponsor = expandedData?.data;

  return (
    <div className="space-y-6">
      {(showNew || editSponsor) && (
        <SponsorModal sponsor={editSponsor} onClose={() => { setShowNew(false); setEditSponsor(null); }}
          onSaved={() => { setShowNew(false); setEditSponsor(null); qc.invalidateQueries({ queryKey: ['sponsors'] }); }} />
      )}
      {showPlanFor && (
        <PlanModal onClose={() => setShowPlanFor(null)}
          onSaved={() => { setShowPlanFor(null); qc.invalidateQueries({ queryKey: ['sponsors'] }); }} />
      )}
      {editPlan && (
        <PlanModal plan={editPlan} onClose={() => setEditPlan(null)}
          onSaved={() => { setEditPlan(null); qc.invalidateQueries({ queryKey: ['sponsors'] }); }} />
      )}
      {showSponsorshipFor && (
        <SponsorshipModal sponsor={showSponsorshipFor.sponsor} plans={showSponsorshipFor.plans}
          onClose={() => setShowSponsorshipFor(null)}
          onSaved={() => { setShowSponsorshipFor(null); qc.invalidateQueries({ queryKey: ['sponsors'] }); }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auspiciantes</h1>
          <p className="text-gray-500 text-sm mt-1">{sponsors.length} auspiciantes registrados</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-medium hover:bg-brand-red-dark transition-colors">
          <Plus size={15} /> Nuevo auspiciante
        </button>
      </div>

      {/* Sponsors list */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400">Cargando auspiciantes...</div>
      ) : sponsors.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <Handshake size={40} className="mx-auto text-slate-200" />
          <p className="text-gray-400 font-medium">No hay auspiciantes registrados</p>
          <p className="text-gray-300 text-sm">Agregá auspiciantes para gestionar sus planes y cuotas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsors.map((sponsor: any) => {
            const isExpanded = expandedId === sponsor.id;
            const plans = expandedSponsor?.plans ?? sponsor.plans ?? [];
            const sponsorships = expandedSponsor?.sponsorships ?? [];
            return (
              <div key={sponsor.id} className="bg-white rounded-xl border overflow-hidden">
                {/* Sponsor header */}
                <div className="flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : sponsor.id)}>
                  <div className="flex items-center gap-4">
                    {sponsor.logoUrl ? (
                      <img src={sponsor.logoUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-brand-red/10 flex items-center justify-center">
                        <Handshake size={20} className="text-brand-red" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800">{sponsor.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {sponsor.contactName && <span>{sponsor.contactName}</span>}
                        {sponsor.phone && <span>{sponsor.phone}</span>}
                        {sponsor.email && <span>{sponsor.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={sponsor.active ? 'ACTIVE' : 'PAUSED'} />
                    <div className="flex items-center gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); setEditSponsor(sponsor); }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(sponsor.id); }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded" title={sponsor.active ? 'Pausar' : 'Activar'}>
                        <Pause size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar auspiciante?')) removeMutation.mutate(sponsor.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && expandedSponsor && (
                  <div className="border-t bg-gray-50 p-5 space-y-5">
                    {/* Plans */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-700 text-sm">Planes</h4>
                        <button onClick={() => setShowPlanFor(sponsor)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                          <Plus size={12} /> Agregar plan
                        </button>
                      </div>
                      {plans.length === 0 ? (
                        <p className="text-slate-400 text-sm">Sin planes definidos</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {plans.map((plan: any) => (
                            <div key={plan.id} className="bg-white rounded-lg border p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-slate-800">{plan.name}</h5>
                                <div className="flex gap-1">
                                  <button onClick={() => setEditPlan(plan)} className="p-1 text-slate-400 hover:text-slate-700"><Pencil size={12} /></button>
                                  <button onClick={() => { if (confirm('¿Eliminar plan?')) removePlanMutation.mutate(plan.id); }}
                                    className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-brand-red">${plan.monthlyAmount.toLocaleString('es-AR')}<span className="text-sm font-normal text-slate-400">/mes</span></p>
                              <p className="text-xs text-slate-500">{plan.durationMonths} meses</p>
                              {plan.description && <p className="text-xs text-slate-500">{plan.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sponsorships */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-700 text-sm">Auspiciariones</h4>
                        {plans.length > 0 && (
                          <button onClick={() => setShowSponsorshipFor({ sponsor, plans })}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                            <Plus size={12} /> Nuevo auspiciarion
                          </button>
                        )}
                      </div>
                      {sponsorships.length === 0 ? (
                        <p className="text-slate-400 text-sm">Sin auspiciariones activos</p>
                      ) : (
                        <div className="space-y-2">
                          {sponsorships.map((sub: any) => (
                            <div key={sub.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-800">{sub.plan.name} — ${sub.plan.monthlyAmount.toLocaleString('es-AR')}/mes</p>
                                <p className="text-xs text-slate-500">
                                  {new Date(sub.startDate).toLocaleDateString('es-AR')} — {new Date(sub.endDate).toLocaleDateString('es-AR')}
                                </p>
                                <p className="text-xs text-slate-400">{sub.payments?.length ?? 0} cuotas</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={sub.status} />
                                {sub.status === 'ACTIVE' && (
                                  <button onClick={() => { if (confirm('¿Cancelar auspiciarion?')) cancelSponsorshipMutation.mutate(sub.id); }}
                                    className="text-xs text-red-500 hover:text-red-700">Cancelar</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
