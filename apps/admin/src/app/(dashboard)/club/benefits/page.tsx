'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Gift, ExternalLink, Building2, Eye, EyeOff, Image } from 'lucide-react';

const TYPE_CFG: Record<string, { label: string; bg: string; text: string }> = {
  EXTERNAL: { label: 'Descuento externo', bg: 'bg-blue-50', text: 'text-blue-700' },
  INTERNAL: { label: 'Beneficio del club', bg: 'bg-green-50', text: 'text-green-700' },
};

function BenefitModal({ benefit, sponsors, onClose, onSaved }: { benefit?: any; sponsors: any[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(
    benefit ? {
      title: benefit.title,
      description: benefit.description ?? '',
      imageUrl: benefit.imageUrl ?? '',
      type: benefit.type ?? 'EXTERNAL',
      sponsorId: benefit.sponsorId ?? '',
    } : { title: '', description: '', imageUrl: '', type: 'EXTERNAL', sponsorId: '' }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('El título es requerido'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = { title: form.title.trim() };
      if (form.description) payload.description = form.description;
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (form.type) payload.type = form.type;
      if (form.sponsorId) payload.sponsorId = form.sponsorId;

      if (benefit) {
        await api.benefits.update(benefit.id, payload);
      } else {
        await api.benefits.create(payload);
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? 'Error al guardar'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800">{benefit ? 'Editar beneficio' : 'Nuevo beneficio'}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Título *</label>
            <input value={form.title} onChange={set('title')} placeholder="Ej: 10% en Deportes Total"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Descripción del beneficio"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Imagen (URL JPG/PNG)</label>
            <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://...imagen.jpg"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            {form.imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
                <img src={form.imageUrl} alt="Preview" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <select value={form.type} onChange={set('type')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="EXTERNAL">Descuento externo</option>
                <option value="INTERNAL">Beneficio del club</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Auspiciante (opcional)</label>
              <select value={form.sponsorId} onChange={set('sponsorId')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sin auspiciante</option>
                {sponsors.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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

export default function BenefitsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editBenefit, setEditBenefit] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['benefits-admin'],
    queryFn: () => api.benefits.listAll(),
  });

  const { data: sponsorsData } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => api.sponsors.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.benefits.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['benefits-admin'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.benefits.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['benefits-admin'] }),
  });

  const benefits = data?.data ?? [];
  const sponsors = sponsorsData?.data ?? [];

  return (
    <div className="space-y-6">
      {(showNew || editBenefit) && (
        <BenefitModal benefit={editBenefit} sponsors={sponsors}
          onClose={() => { setShowNew(false); setEditBenefit(null); }}
          onSaved={() => { setShowNew(false); setEditBenefit(null); qc.invalidateQueries({ queryKey: ['benefits-admin'] }); }} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beneficios</h1>
          <p className="text-gray-500 text-sm mt-1">{benefits.length} beneficios registrados</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-medium hover:bg-brand-red-dark transition-colors">
          <Plus size={15} /> Nuevo beneficio
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400">Cargando beneficios...</div>
      ) : benefits.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <Gift size={40} className="mx-auto text-slate-200" />
          <p className="text-gray-400 font-medium">No hay beneficios registrados</p>
          <p className="text-gray-300 text-sm">Agregá beneficios para que los socios los vean en la app</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit: any) => {
            const typeCfg = TYPE_CFG[benefit.type] ?? TYPE_CFG.EXTERNAL;
            return (
              <div key={benefit.id} className="bg-white rounded-xl border overflow-hidden">
                {benefit.imageUrl ? (
                  <div className="h-40 bg-slate-100">
                    <img src={benefit.imageUrl} alt={benefit.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-brand-red/10 to-brand-red/5 flex items-center justify-center">
                    <Gift size={40} className="text-brand-red/30" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-800 text-sm">{benefit.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.text}`}>
                      {typeCfg.label}
                    </span>
                  </div>
                  {benefit.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{benefit.description}</p>
                  )}
                  {benefit.sponsor && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Building2 size={11} />
                      {benefit.sponsor.name}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${benefit.active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {benefit.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleMutation.mutate(benefit.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded" title={benefit.active ? 'Desactivar' : 'Activar'}>
                        {benefit.active ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button onClick={() => setEditBenefit(benefit)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded" title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar beneficio?')) removeMutation.mutate(benefit.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded" title="Eliminar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
