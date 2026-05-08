'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Shield, Plus, X, Pencil, Check, Trash2, Search } from 'lucide-react';

interface TeamForm {
  name: string;
  delegateName: string;
  delegateContact: string;
  categoryId: string;
}

const EMPTY_FORM: TeamForm = { name: '', delegateName: '', delegateContact: '', categoryId: '' };

export default function TeamsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<TeamForm>(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams', page, debouncedSearch],
    queryFn: () => api.teams.list({
      page: String(page),
      limit: '20',
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => api.categories.list({ limit: '100' }),
  });

  const teams = (teamsData as any)?.data ?? [];
  const meta = (teamsData as any)?.meta;
  const categories = categoriesData?.data ?? [];

  const create = useMutation({
    mutationFn: () => api.teams.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      setError('');
    },
    onError: (err: any) => setError(err.message),
  });

  const update = useMutation({
    mutationFn: (id: string) => api.teams.update(id, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setEditId(null);
    },
    onError: (err: any) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.teams.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
    onError: (err: any) => setError(err.message),
  });

  function startEdit(team: any) {
    setEditId(team.id);
    setEditForm({
      name: team.name,
      delegateName: team.delegateName ?? '',
      delegateContact: team.delegateContact ?? '',
      categoryId: team.categoryId ?? '',
    });
  }

  const set = (field: keyof TeamForm, setter: React.Dispatch<React.SetStateAction<TeamForm>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setter(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
          <p className="text-gray-500 text-sm mt-1">{meta?.total ?? teams.length} equipos registrados</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus size={14} /> Nuevo equipo
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Nuevo equipo</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                value={form.name} onChange={set('name', setForm)} placeholder="Nombre del equipo"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={form.categoryId} onChange={set('categoryId', setForm)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sin categoría</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delegado</label>
              <input
                value={form.delegateName} onChange={set('delegateName', setForm)} placeholder="Nombre del delegado"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
              <input
                value={form.delegateContact} onChange={set('delegateContact', setForm)} placeholder="Teléfono / email"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.name}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {create.isPending ? 'Creando...' : 'Crear equipo'}
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            setTimeout(() => setDebouncedSearch(e.target.value), 300);
          }}
          placeholder="Buscar equipo..."
          className="w-full max-w-sm pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : teams.length === 0 ? (
          <div className="p-8 text-center">
            <Shield size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay equipos</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Equipo</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Delegado</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Contacto</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Categoría</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Jugadores</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {teams.map((team: any) => (
                editId === team.id ? (
                  <tr key={team.id} className="bg-blue-50">
                    <td className="px-4 py-3">
                      <input value={editForm.name} onChange={set('name', setEditForm)}
                        className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={editForm.delegateName} onChange={set('delegateName', setEditForm)}
                        className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={editForm.delegateContact} onChange={set('delegateContact', setEditForm)}
                        className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </td>
                    <td className="px-4 py-3" colSpan={2}>
                      <select value={editForm.categoryId} onChange={set('categoryId', setEditForm)}
                        className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="">Sin categoría</option>
                        {categories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => update.mutate(team.id)} disabled={update.isPending}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Shield size={14} className="text-gray-400" />
                        </div>
                        <p className="font-medium text-gray-900">{team.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{team.delegateName ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{team.delegateContact ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{team.category?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{team._count?.players ?? team.players?.length ?? '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => startEdit(team)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar el equipo "${team.name}"?`)) remove.mutate(team.id);
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
