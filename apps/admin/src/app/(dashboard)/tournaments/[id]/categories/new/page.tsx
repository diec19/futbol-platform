'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCategoryPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    birthYear: '',
    minAge: '',
    maxAge: '',
    maxPlayers: '22',
    phaseType: 'MIXED',
    rules: '',
  });
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.categories.create({
        tournamentId,
        name: form.name,
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        minAge: form.minAge ? Number(form.minAge) : undefined,
        maxAge: form.maxAge ? Number(form.maxAge) : undefined,
        maxPlayers: Number(form.maxPlayers),
        phaseType: form.phaseType,
        rules: form.rules || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      router.push(`/tournaments/${tournamentId}/categories/${res.data.id}`);
    },
    onError: (err: any) => setError(err.message),
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/tournaments/${tournamentId}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Categoría</h1>
          <p className="text-gray-500 text-sm">Se agregará al torneo actual</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            value={form.name} onChange={set('name')} required
            placeholder="Ej: Sub 13, Primera División, Femenino"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año de nacimiento</label>
            <input
              type="number" value={form.birthYear} onChange={set('birthYear')}
              placeholder="2013"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad mín.</label>
            <input
              type="number" value={form.minAge} onChange={set('minAge')}
              placeholder="10"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad máx.</label>
            <input
              type="number" value={form.maxAge} onChange={set('maxAge')}
              placeholder="13"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jugadores por equipo</label>
            <input
              type="number" value={form.maxPlayers} onChange={set('maxPlayers')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de fase</label>
            <select value={form.phaseType} onChange={set('phaseType')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="MIXED">Mixto (grupos + eliminación)</option>
              <option value="GROUP">Solo grupos</option>
              <option value="KNOCKOUT">Solo eliminación directa</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reglamento específico</label>
          <textarea
            value={form.rules} onChange={set('rules')} rows={3}
            placeholder="Reglamento particular de esta categoría..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href={`/tournaments/${tournamentId}`} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </Link>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.name}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {create.isPending ? 'Creando...' : 'Crear categoría'}
          </button>
        </div>
      </div>
    </div>
  );
}
