'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MapPin, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';

const SURFACES = ['Césped natural', 'Césped sintético', 'Tierra', 'Cemento', 'Parquet', 'Otro'];

function FieldForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [mapUrl, setMapUrl] = useState(initial?.mapUrl ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? '');
  const [surface, setSurface] = useState(initial?.surface ?? '');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
      <p className="font-semibold text-sm text-slate-700">{initial ? 'Editar cancha' : 'Nueva cancha'}</p>
      <div className="grid grid-cols-2 gap-3">
        <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" placeholder="Nombre *" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red bg-white" value={surface} onChange={(e) => setSurface(e.target.value)}>
          <option value="">Tipo de superficie</option>
          {SURFACES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} />
        <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" placeholder="Capacidad (personas)" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" placeholder="Google Maps URL" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
        <button
          onClick={() => { if (!name) return; onSave({ name, address: address || undefined, mapUrl: mapUrl || undefined, capacity: capacity ? parseInt(capacity) : undefined, surface: surface || undefined }); }}
          className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg hover:bg-brand-red-dark"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

export default function ClubFieldsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['club-fields'], queryFn: () => api.club.fields.list() });
  const fields = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: (d: unknown) => api.club.fields.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-fields'] }); setShowForm(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.club.fields.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-fields'] }); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.fields.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-fields'] }),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="text-brand-red" size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Canchas / Sedes</h1>
            <p className="text-sm text-slate-500">{fields.length} canchas registradas</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark">
            <Plus size={15} /> Nueva cancha
          </button>
        )}
      </div>

      {showForm && <FieldForm onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : fields.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MapPin size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay canchas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field: any) => (
            <div key={field.id}>
              {editing?.id === field.id ? (
                <FieldForm initial={field} onSave={(d) => updateMutation.mutate({ id: field.id, ...d })} onCancel={() => setEditing(null)} />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-navy/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-brand-navy" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{field.name}</p>
                      {field.surface && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{field.surface}</span>}
                      {field.capacity && <span className="text-xs text-slate-400">{field.capacity.toLocaleString()} personas</span>}
                    </div>
                    {field.address && <p className="text-sm text-slate-500 mt-0.5">{field.address}</p>}
                    {field.mapUrl && (
                      <a href={field.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline mt-1">
                        <ExternalLink size={11} /> Ver en Google Maps
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(field)} className="p-1.5 text-slate-400 hover:text-brand-blue rounded">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(field.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
