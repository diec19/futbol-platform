'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ListOrdered, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import Link from 'next/link';

const PHASE_LABELS: Record<string, string> = {
  MIXED: 'Mixto',
  GROUP: 'Solo grupos',
  KNOCKOUT: 'Eliminación directa',
};

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [tournamentId, setTournamentId] = useState('');
  const [search, setSearch] = useState('');

  const { data: tournamentsData } = useQuery({
    queryKey: ['tournaments-list'],
    queryFn: () => api.tournaments.list({ limit: '50' }),
  });

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories-all', tournamentId],
    queryFn: () => api.categories.list({
      limit: '100',
      ...(tournamentId ? { tournamentId } : {}),
    }),
  });

  const toggle = useMutation({
    mutationFn: (id: string) => api.categories.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories-all'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.categories.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories-all'] }),
    onError: (err: any) => alert(err.message),
  });

  const tournaments = tournamentsData?.data ?? [];
  const allCategories = categoriesData?.data ?? [];
  const categories = search
    ? allCategories.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()))
    : allCategories;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">{categories.length} categorías</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
        >
          <option value="">Todos los torneos</option>
          {tournaments.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoría..."
            className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center">
            <ListOrdered size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay categorías</p>
            <p className="text-gray-400 text-sm mt-1">
              Creá categorías desde la página de cada torneo
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Categoría</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Torneo</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Tipo de fase</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Equipos</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Edad</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/tournaments/${cat.tournamentId}/categories/${cat.id}`}
                      className="font-medium text-gray-900 hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{cat.tournament?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{PHASE_LABELS[cat.phaseType] ?? cat.phaseType}</td>
                  <td className="px-6 py-4 text-gray-500">{cat.teams?.length ?? cat._count?.teams ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {cat.birthYear
                      ? `Año ${cat.birthYear}`
                      : (cat.minAge || cat.maxAge)
                        ? `${cat.minAge ?? '?'}-${cat.maxAge ?? '?'} años`
                        : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => toggle.mutate(cat.id)}
                        title={cat.active ? 'Desactivar' : 'Activar'}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        {cat.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`)) {
                            remove.mutate(cat.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
