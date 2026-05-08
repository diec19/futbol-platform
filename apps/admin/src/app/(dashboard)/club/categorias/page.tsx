'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, X, Pencil, Trash2, Users, GraduationCap, UserCheck, Layers } from 'lucide-react';

const EMPTY_FORM = { name: '', description: '', birthYear: '', coach: '', assistant: '' };

function CategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    category
      ? {
          name: category.name,
          description: category.description ?? '',
          birthYear: category.birthYear ? String(category.birthYear) : '',
          coach: category.coach ?? '',
          assistant: category.assistant ?? '',
        }
      : EMPTY_FORM
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        coach: form.coach || undefined,
        assistant: form.assistant || undefined,
      };
      if (category) {
        await api.club.categories.update(category.id, payload);
      } else {
        await api.club.categories.create(payload);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <p className="font-bold text-slate-800">
            {category ? 'Editar categoría' : 'Nueva categoría'}
          </p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
            <input
              value={form.name}
              onChange={set('name')}
              placeholder="Sub-13, Infantil, Reserva..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Año de nacimiento</label>
              <input
                type="number"
                value={form.birthYear}
                onChange={set('birthYear')}
                placeholder="2012"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
              <input
                value={form.description}
                onChange={set('description')}
                placeholder="Detalles opcionales"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <GraduationCap size={12} className="inline mr-1" />Profesor / DT
              </label>
              <input
                value={form.coach}
                onChange={set('coach')}
                placeholder="Nombre del profe"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                <UserCheck size={12} className="inline mr-1" />Ayudante
              </label>
              <input
                value={form.assistant}
                onChange={set('assistant')}
                placeholder="Nombre del ayudante"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50"
            >
              {saving ? 'Guardando...' : category ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClubCategoriasPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['club-categories'],
    queryFn: () => api.club.categories.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: (cat: any) => api.club.categories.update(cat.id, { active: !cat.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.club.categories.remove(id),
    onSuccess: () => { setConfirmDelete(null); qc.invalidateQueries({ queryKey: ['club-categories'] }); },
  });

  const categories = data?.data ?? [];

  const onSaved = () => {
    setShowCreate(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ['club-categories'] });
  };

  return (
    <div className="space-y-6">
      {showCreate && <CategoryModal onClose={() => setShowCreate(false)} onSaved={onSaved} />}
      {editing && <CategoryModal category={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <p className="font-bold text-slate-800">¿Eliminar categoría?</p>
            <p className="text-sm text-slate-500">
              Se eliminará <strong>{confirmDelete.name}</strong>. Los jugadores asignados quedarán sin categoría.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías del Club</h1>
          <p className="text-gray-500 text-sm mt-1">{categories.length} categorías registradas</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-medium hover:bg-brand-red-dark transition-colors"
        >
          <Plus size={16} />
          Nueva categoría
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400">Cargando categorías...</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center space-y-3">
          <Layers size={40} className="mx-auto text-slate-200" />
          <p className="text-gray-400 font-medium">No hay categorías registradas</p>
          <p className="text-gray-300 text-sm">Creá la primera categoría del club (Sub-11, Sub-13, Infantil, etc.)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat: any) => (
            <div key={cat.id} className="bg-white rounded-xl border border-slate-100 p-5 group hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-navy/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-navy font-bold text-sm">{cat.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{cat.name}</p>
                    {cat.birthYear && (
                      <p className="text-xs text-slate-400">Año {cat.birthYear}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(cat)}
                    className="p-1.5 text-slate-400 hover:text-brand-blue rounded transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(cat)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Staff */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap size={14} className="text-brand-red flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs text-slate-400">Profe / DT: </span>
                    <span className="text-sm font-medium text-slate-700">
                      {cat.coach ?? <span className="text-slate-300 italic">Sin asignar</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-brand-blue flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs text-slate-400">Ayudante: </span>
                    <span className="text-sm font-medium text-slate-700">
                      {cat.assistant ?? <span className="text-slate-300 italic">Sin asignar</span>}
                    </span>
                  </div>
                </div>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{cat.description}</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users size={13} />
                  <span className="text-xs font-medium">{cat._count?.players ?? 0} jugadores</span>
                </div>
                <button
                  onClick={() => toggleMutation.mutate(cat)}
                  disabled={toggleMutation.isPending}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                    cat.active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat.active ? 'Activa' : 'Inactiva'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

