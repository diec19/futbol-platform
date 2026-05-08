'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Pencil, Save, X,
  Trophy, Users, UserRound, Calendar, Zap,
} from 'lucide-react';
import { TOURNAMENT_STATUS_LABELS } from '@futbol/constants';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  FINISHED: 'bg-blue-100 text-blue-700',
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.tournaments.get(id),
  });

  const { data: statsData } = useQuery({
    queryKey: ['tournament-stats', id],
    queryFn: () => api.tournaments.stats(id),
    enabled: !!id,
  });

  const update = useMutation({
    mutationFn: () => api.tournaments.update(id, {
      ...form,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournament', id] });
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      setEditing(false);
    },
  });

  const tournament = data?.data;
  const stats = statsData?.data;

  if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!tournament) return <div className="p-8 text-center text-gray-400">Torneo no encontrado</div>;

  function startEdit() {
    setForm({
      name: tournament.name,
      description: tournament.description ?? '',
      startDate: tournament.startDate.slice(0, 10),
      endDate: tournament.endDate.slice(0, 10),
      sponsor: tournament.sponsor ?? '',
      status: tournament.status,
    });
    setEditing(true);
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/tournaments" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[tournament.status] ?? ''}`}>
              {TOURNAMENT_STATUS_LABELS[tournament.status] ?? tournament.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}
            {tournament.sponsor && ` · Sponsor: ${tournament.sponsor}`}
          </p>
        </div>
        {!editing && (
          <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Pencil size={14} /> Editar
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Editar torneo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input value={form.name} onChange={set('name')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input type="date" value={form.startDate} onChange={set('startDate')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input type="date" value={form.endDate} onChange={set('endDate')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.status} onChange={set('status')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activo</option>
                <option value="SUSPENDED">Suspendido</option>
                <option value="FINISHED">Finalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor</label>
              <input value={form.sponsor} onChange={set('sponsor')} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={set('description')} rows={2} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"><X size={14} /> Cancelar</button>
            <button onClick={() => update.mutate()} disabled={update.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
              <Save size={14} /> {update.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Categorías" value={stats.categories} icon={Trophy} color="bg-green-500" />
          <StatCard label="Equipos" value={stats.teams} icon={Users} color="bg-blue-500" />
          <StatCard label="Jugadores" value={stats.players} icon={UserRound} color="bg-purple-500" />
          <StatCard label="Partidos jugados" value={stats.matchesPlayed} icon={Calendar} color="bg-orange-500" />
          <StatCard label="Goles" value={stats.goals} icon={Zap} color="bg-red-500" />
        </div>
      )}

      {/* Categories */}
      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Categorías</h2>
          <Link
            href={`/tournaments/${id}/categories/new`}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Nueva categoría
          </Link>
        </div>

        {tournament.categories?.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay categorías</p>
            <p className="text-gray-400 text-sm mt-1">Creá la primera categoría para empezar a organizar el torneo</p>
            <Link
              href={`/tournaments/${id}/categories/new`}
              className="inline-flex items-center gap-2 mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              <Plus size={14} /> Crear categoría
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {tournament.categories?.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/tournaments/${id}/categories/${cat.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${cat.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">{cat.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cat.teams?.length ?? 0} equipos
                      {cat.phaseType && ` · ${cat.phaseType === 'GROUP' ? 'Fase de grupos' : cat.phaseType === 'KNOCKOUT' ? 'Eliminación directa' : 'Mixto'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.active ? 'Activa' : 'Inactiva'}
                  </span>
                  <span className="text-gray-400 group-hover:text-gray-600">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
