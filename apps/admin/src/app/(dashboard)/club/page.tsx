'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Building2, Save, Globe, Phone, Mail, Instagram, Facebook, MessageCircle, CreditCard, Eye, EyeOff } from 'lucide-react';

export default function ClubInfoPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['club'], queryFn: () => api.club.get() });
  const club = data?.data;

  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [showMpToken, setShowMpToken] = useState(false);
  const [showMpSecret, setShowMpSecret] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (d: unknown) => api.club.update(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) return <div className="p-8 text-slate-500">Cargando...</div>;

  const val = (field: string) => (field in form ? form[field] : club?.[field] ?? '');
  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    const payload: Record<string, any> = {};
    Object.keys(form).forEach((k) => { payload[k] = form[k] || undefined; });
    if (form.foundedYear) payload.foundedYear = parseInt(form.foundedYear);
    updateMutation.mutate(payload);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="text-brand-red" size={24} />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Info del Club</h1>
          <p className="text-sm text-slate-500">Datos generales, redes sociales y presentación pública</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {/* Datos generales */}
        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">Datos generales</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Nombre del club *</label>
              <input className="input-base" value={val('name')} onChange={(e) => set('name', e.target.value)} placeholder="Club Atlético..." />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nombre corto</label>
              <input className="input-base" value={val('shortName')} onChange={(e) => set('shortName', e.target.value)} placeholder="CA..." />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Año de fundación</label>
              <input className="input-base" type="number" value={val('foundedYear')} onChange={(e) => set('foundedYear', e.target.value)} placeholder="1985" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Descripción / Historia</label>
              <textarea className="input-base min-h-[100px] resize-none" value={val('description')} onChange={(e) => set('description', e.target.value)} placeholder="Historia del club..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Dirección</label>
              <input className="input-base" value={val('address')} onChange={(e) => set('address', e.target.value)} placeholder="Calle Falsa 123, Ciudad" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Logo (URL)</label>
              <input className="input-base" value={val('logo')} onChange={(e) => set('logo', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">Contacto</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Phone size={11} />Teléfono</label>
              <input className="input-base" value={val('phone')} onChange={(e) => set('phone', e.target.value)} placeholder="+54 11 ..." />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Mail size={11} />Email</label>
              <input className="input-base" value={val('email')} onChange={(e) => set('email', e.target.value)} placeholder="club@..." />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Globe size={11} />Sitio web</label>
              <input className="input-base" value={val('website')} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MessageCircle size={11} />WhatsApp</label>
              <input className="input-base" value={val('whatsapp')} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+54 9 11 ..." />
            </div>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">Redes sociales</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Instagram size={11} />Instagram</label>
              <input className="input-base" value={val('instagram')} onChange={(e) => set('instagram', e.target.value)} placeholder="@clubname" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Facebook size={11} />Facebook</label>
              <input className="input-base" value={val('facebook')} onChange={(e) => set('facebook', e.target.value)} placeholder="facebook.com/club" />
            </div>
          </div>
        </div>

        {/* Mercado Pago */}
        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <CreditCard size={14} /> Mercado Pago
          </p>
          <p className="text-xs text-slate-400">Configuración de cobros con Mercado Pago. Cada cliente usa su propio Access Token.</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Access Token</label>
              <div className="flex gap-2">
                <input
                  className="input-base flex-1"
                  type={showMpToken ? 'text' : 'password'}
                  value={val('mpAccessToken')}
                  onChange={(e) => set('mpAccessToken', e.target.value)}
                  placeholder="APP_USR-..."
                />
                <button
                  type="button"
                  onClick={() => setShowMpToken(!showMpToken)}
                  className="px-3 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  {showMpToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Webhook Secret (opcional)</label>
              <div className="flex gap-2">
                <input
                  className="input-base flex-1"
                  type={showMpSecret ? 'text' : 'password'}
                  value={val('mpWebhookSecret')}
                  onChange={(e) => set('mpWebhookSecret', e.target.value)}
                  placeholder="Tu Webhook Secret"
                />
                <button
                  type="button"
                  onClick={() => setShowMpSecret(!showMpSecret)}
                  className="px-3 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  {showMpSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50"
        >
          <Save size={15} />
          {saved ? '¡Guardado!' : updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <style jsx>{`
        .input-base {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus { border-color: #DC2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.08); }
      `}</style>
    </div>
  );
}
