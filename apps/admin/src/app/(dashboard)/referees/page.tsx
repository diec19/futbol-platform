'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Flag, Plus, X, Pencil, Check, Trash2 } from 'lucide-react';

interface RefereeForm {
  fullName: string;
  dni: string;
  phone: string;
  email: string;
}

const EMPTY_FORM: RefereeForm = { fullName: '', dni: '', phone: '', email: '' };

export default function RefereesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RefereeForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<RefereeForm>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['referees', page],
    queryFn: () => api.referees.list({ page: String(page), limit: '20' }),
  });

  const referees = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  const create = useMutation({
    mutationFn: () => api.referees.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referees'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      setError('');
    },
    onError: (err: any) => setError(err.message),
  });

  const update = useMutation({
    mutationFn: (id: string) => api.referees.update(id, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referees'] });
      setEditId(null);
    },
    onError: (err: any) => setError(err.message),
  });

  const toggle = useMutation({
    mutationFn: (id: string) => api.referees.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referees'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.referees.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referees'] }),
    onError: (err: any) => setError(err.message),
  });

  function startEdit(ref: any) {
    setEditId(ref.id);
    setEditForm({
      fullName: ref.fullName,
      dni: ref.dni ?? '',
      phone: ref.phone ?? '',
      email: ref.email ?? '',
    });
  }

  const set = (field: keyof RefereeForm, setter: React.Dispatch<React.SetStateAction<RefereeForm>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setter(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Árbitros</h1>
          <p className="text-gray-500 text-sm mt-1">{meta?.total ?? referees.length} árbitros registrados</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus size={14} /> Nuevo árbitro
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Nuevo árbitro</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input value={form.fullName} onChange={set('fullName', setForm)} placeholder="Nombre y apellido"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
              <input value={form.dni} onChange={set('dni', setForm)} placeholder="12345678"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input value={form.phone} onChange={set('phone', setForm)} placeholder="+54 9 11 1234-5678"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email', setForm)} placeholder="arbitro@email.com"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.fullName}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {create.isPending ? 'Creando...' : 'Crear árbitro'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : referees.length === 0 ? (
          <div className="p-8 text-center">
            <Flag size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay árbitros registrados</p>
            <p className="text-gray-400 text-sm mt-1">Agregá árbitros para asignarlos a los partidos</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Árbitro</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">DNI</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Teléfono</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {referees.map((ref: any) => (
                editId === ref.id ? (
                  <tr key={ref.id} className="bg-blue-50">
                    <td className="px-4 py-3">
                      <input value={editForm.fullName} onChange={set('fullName', setEditForm)}
                        className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={editForm.dni} onChange={set('dni', setEditForm)}
                        className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={editForm.phone} onChange={set('phone', setEditForm)}
                        className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={editForm.email} onChange={set('email', setEditForm)}
                        className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => update.mutate(ref.id)} disabled={update.isPending}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={ref.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                          {ref.fullName[0]?.toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-900">{ref.fullName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{ref.dni ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{ref.phone ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{ref.email ?? '—'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggle.mutate(ref.id)}
                        className={`text-xs font-medium px-2 py-1 rounded-full cursor-pointer transition-colors ${ref.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {ref.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => startEdit(ref)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar a "${ref.fullName}"?`)) remove.mutate(ref.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
            <span>Página {meta.page} de {meta.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={meta.page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">Anterior</button>
              <button disabled={meta.page >= meta.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
