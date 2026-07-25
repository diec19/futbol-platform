'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AlertTriangle, Plus, X, CheckCircle, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SanctionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterResolved, setFilterResolved] = useState('');
  const [form, setForm] = useState({
    playerId: '',
    reason: '',
    matchesBan: '',
    startDate: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const { data: sanctionsData, isLoading } = useQuery({
    queryKey: ['sanctions', filterResolved],
    queryFn: () => api.sanctions.list({
      ...(filterResolved !== '' ? { resolved: filterResolved } : {}),
      limit: '50',
    }),
  });

  const { data: playersData } = useQuery({
    queryKey: ['players-all'],
    queryFn: () => api.players.list({ limit: '200' }),
    enabled: showForm,
  });

  const sanctions = sanctionsData?.data ?? [];
  const players = playersData?.data ?? [];

  const create = useMutation({
    mutationFn: () => api.sanctions.create({
      playerId: form.playerId,
      reason: form.reason,
      matchesBan: Number(form.matchesBan),
      startDate: form.startDate || new Date().toISOString(),
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sanctions'] });
      setShowForm(false);
      setForm({ playerId: '', reason: '', matchesBan: '', startDate: '', notes: '' });
      setError('');
    },
    onError: (err: any) => setError(err.message),
  });

  const resolve = useMutation({
    mutationFn: (id: string) => api.sanctions.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanctions'] }),
    onError: (err: any) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.sanctions.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sanctions'] }),
    onError: (err: any) => setError(err.message),
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const pending = sanctions.filter((s: any) => !s.resolved);
  const resolved = sanctions.filter((s: any) => s.resolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sanciones</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pending.length} pendientes · {resolved.length} resueltas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterResolved}
            onChange={(e) => setFilterResolved(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todas</option>
            <option value="false">Pendientes</option>
            <option value="true">Resueltas</option>
          </select>
          <button
            onClick={() => { setShowForm(true); setError(''); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={14} /> Nueva sanción
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Nueva sanción</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jugador *</label>
              <select value={form.playerId} onChange={set('playerId')}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Seleccionar jugador</option>
                {players.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}{p.team ? ` (${p.team.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fechas de suspensión *</label>
              <input type="number" min={1} value={form.matchesBan} onChange={set('matchesBan')} placeholder="1"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio *</label>
              <input type="date" value={form.startDate} onChange={set('startDate')}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input type="text" value={form.notes} onChange={set('notes')} placeholder="Notas adicionales"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
              <textarea value={form.reason} onChange={set('reason')} rows={2} placeholder="Descripción del motivo de la sanción"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.playerId || !form.reason || !form.matchesBan}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {create.isPending ? 'Guardando...' : 'Crear sanción'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : sanctions.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay sanciones</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Jugador</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Motivo</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Fechas</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Inicio</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sanctions.map((s: any) => (
                <tr key={s.id} className={`hover:bg-gray-50 ${s.resolved ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{s.player?.fullName ?? '—'}</p>
                    <p className="text-xs text-gray-400">{s.player?.team?.name}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate">{s.reason ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{s.matchesBan ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(s.startDate)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.resolved ? 'Resuelta' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      {!s.resolved && (
                        <button
                          onClick={() => resolve.mutate(s.id)}
                          disabled={resolve.isPending}
                          title="Marcar como resuelta"
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar esta sanción?')) remove.mutate(s.id);
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
