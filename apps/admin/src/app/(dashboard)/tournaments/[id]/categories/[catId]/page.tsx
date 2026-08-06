'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Play, RotateCcw, Trophy } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { MatchResultModal } from '@/components/domain/match-result-modal';
import { MATCH_STATUS_LABELS, BRACKET_STAGE_LABELS } from '@futbol/constants';

type Tab = 'equipos' | 'grupos' | 'partidos' | 'llaves' | 'estadisticas';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-gray-100 text-gray-600',
  LIVE: 'bg-green-100 text-green-700',
  FINISHED: 'bg-blue-100 text-blue-700',
  POSTPONED: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

// ─── Tab: Equipos ──────────────────────────────────────────────
function TeamsTab({ categoryId }: { categoryId: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', delegateName: '', contact: '' });

  const { data } = useQuery({
    queryKey: ['teams', categoryId],
    queryFn: () => api.teams.list({ categoryId }),
  });

  const create = useMutation({
    mutationFn: () => api.teams.create({ categoryId, ...form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams', categoryId] }); setShowForm(false); setForm({ name: '', delegateName: '', contact: '' }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.teams.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', categoryId] }),
  });

  const teams = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{teams.length} equipos registrados</p>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus size={14} /> {showForm ? 'Cancelar' : 'Agregar equipo'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl border p-4 space-y-3">
          <h3 className="font-medium text-gray-900 text-sm">Nuevo equipo</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Club Atlético" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Delegado</label>
              <input value={form.delegateName} onChange={e => setForm(f => ({ ...f, delegateName: e.target.value }))} placeholder="Nombre del delegado" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contacto</label>
              <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Teléfono o email" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <button onClick={() => create.mutate()} disabled={create.isPending || !form.name} className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">
            {create.isPending ? 'Guardando...' : 'Guardar equipo'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {teams.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No hay equipos en esta categoría</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Equipo</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Delegado</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Contacto</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Jugadores</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {teams.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-5 py-3 text-gray-500">{t.delegateName ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{t.contact ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                      {t._count?.players ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${t.name}"?`)) remove.mutate(t.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
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

// ─── Tab: Grupos ───────────────────────────────────────────────
function GroupsTab({ categoryId }: { categoryId: string }) {
  const qc = useQueryClient();
  const [newGroupName, setNewGroupName] = useState('');
  const [fixtureConfig, setFixtureConfig] = useState<Record<string, { startDate: string; venue: string; interval: string }>>({});

  const { data: standingsData } = useQuery({
    queryKey: ['standings', categoryId],
    queryFn: () => api.standings.byCategory(categoryId),
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams', categoryId],
    queryFn: () => api.teams.list({ categoryId }),
  });

  const createGroup = useMutation({
    mutationFn: () => api.standings.createGroup({ categoryId, name: newGroupName }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['standings', categoryId] }); setNewGroupName(''); },
  });

  const addTeam = useMutation({
    mutationFn: ({ groupId, teamIds }: { groupId: string; teamIds: string[] }) =>
      api.standings.addTeams(groupId, teamIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standings', categoryId] }),
  });

  const generateFixture = useMutation({
    mutationFn: ({ groupId }: { groupId: string }) => {
      const cfg = fixtureConfig[groupId] ?? {};
      return api.matches.generateFixture({
        groupId,
        startDate: cfg.startDate ? new Date(cfg.startDate).toISOString() : new Date().toISOString(),
        venue: cfg.venue || undefined,
        intervalDays: cfg.interval ? Number(cfg.interval) : 7,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });

  const recalculate = useMutation({
    mutationFn: (groupId: string) => api.standings.recalculate(groupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standings', categoryId] }),
  });

  const groups = standingsData?.data ?? [];
  const allTeams = teamsData?.data ?? [];

  function getUnassignedTeamsForGroup(group: any) {
    const assignedIds = new Set(group.teams.map((gt: any) => gt.teamId));
    return allTeams.filter((t: any) => !assignedIds.has(t.id));
  }

  return (
    <div className="space-y-4">
      {/* Create group */}
      <div className="flex gap-2">
        <input
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          placeholder="Nombre del grupo (ej: Grupo A)"
          className="flex-1 max-w-xs px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={() => createGroup.mutate()}
          disabled={!newGroupName || createGroup.isPending}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus size={14} /> Crear grupo
        </button>
      </div>

      {groups.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          No hay grupos. Creá el primero para empezar.
        </div>
      )}

      {groups.map((group: any) => {
        const unassigned = getUnassignedTeamsForGroup(group);
        const cfg = fixtureConfig[group.id] ?? { startDate: '', venue: '', interval: '7' };

        return (
          <div key={group.id} className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900">{group.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => recalculate.mutate(group.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-2 py-1 border rounded hover:bg-gray-100"
                  title="Recalcular posiciones"
                >
                  <RotateCcw size={12} /> Recalcular
                </button>
              </div>
            </div>

            {/* Standings table */}
            {group.teams.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-gray-500 font-medium">Equipo</th>
                      {['PJ', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'PTS'].map(h => (
                        <th key={h} className="px-2 py-2 text-gray-500 font-medium text-center w-8">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...group.teams]
                      .sort((a: any, b: any) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor)
                      .map((gt: any, idx: number) => (
                        <tr key={gt.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-2 font-medium text-gray-900">{gt.team?.name}</td>
                          {[gt.played, gt.won, gt.drawn, gt.lost, gt.goalsFor, gt.goalsAgainst, gt.goalDiff].map((v, i) => (
                            <td key={i} className="px-2 py-2 text-center text-gray-600">{v}</td>
                          ))}
                          <td className="px-2 py-2 text-center font-bold text-primary">{gt.points}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add teams to group */}
            {unassigned.length > 0 && (
              <div className="px-4 py-3 border-t bg-gray-50/50 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 mr-1">Agregar equipo:</span>
                {unassigned.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => addTeam.mutate({ groupId: group.id, teamIds: [t.id] })}
                    className="text-xs px-2.5 py-1 bg-white border rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    + {t.name}
                  </button>
                ))}
              </div>
            )}

            {/* Fixture generation */}
            <div className="px-4 py-3 border-t">
              <p className="text-xs font-medium text-gray-600 mb-2">Generar fixture</p>
              <div className="flex items-end gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={cfg.startDate}
                    onChange={e => setFixtureConfig(f => ({ ...f, [group.id]: { ...cfg, startDate: e.target.value } }))}
                    className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cancha</label>
                  <input
                    placeholder="Cancha principal"
                    value={cfg.venue}
                    onChange={e => setFixtureConfig(f => ({ ...f, [group.id]: { ...cfg, venue: e.target.value } }))}
                    className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary w-36"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Días entre fechas</label>
                  <input
                    type="number" min={1} value={cfg.interval}
                    onChange={e => setFixtureConfig(f => ({ ...f, [group.id]: { ...cfg, interval: e.target.value } }))}
                    className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary w-20"
                  />
                </div>
                <button
                  onClick={() => generateFixture.mutate({ groupId: group.id })}
                  disabled={generateFixture.isPending || group.teams.length < 2 || !cfg.startDate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <Play size={12} /> Generar
                </button>
              </div>
              {group.teams.length < 2 && (
                <p className="text-xs text-amber-600 mt-1">Necesitás al menos 2 equipos en el grupo</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Partidos ─────────────────────────────────────────────
function MatchesTab({ categoryId }: { categoryId: string }) {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data } = useQuery({
    queryKey: ['matches', categoryId, statusFilter],
    queryFn: () => api.matches.list({
      categoryId,
      limit: '50',
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
  });

  const matches = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data?.meta?.total ?? 0} partidos</p>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos</option>
          <option value="SCHEDULED">Programados</option>
          <option value="FINISHED">Finalizados</option>
          <option value="POSTPONED">Postergados</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {matches.length === 0 ? (
          <p className="p-8 text-center text-gray-400">
            No hay partidos. Generá el fixture desde la pestaña Grupos.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Partido</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Fecha</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Grupo / Fase</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Estado</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Resultado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {matches.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {m.homeTeam?.name} vs {m.awayTeam?.name}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{formatDateTime(m.scheduledAt)}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {m.group ? `${m.group.name} · Fecha ${m.round}` : m.bracketStage ? BRACKET_STAGE_LABELS[m.bracketStage] : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[m.status] ?? ''}`}>
                      {MATCH_STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-bold text-gray-900">
                    {m.status === 'FINISHED' ? `${m.homeScore} - ${m.awayScore}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {m.status !== 'FINISHED' && m.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="text-xs px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        Cargar resultado
                      </button>
                    )}
                    {m.status === 'FINISHED' && (
                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="text-xs px-3 py-1 border rounded-lg hover:bg-gray-50 text-gray-500"
                      >
                        Ver detalles
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedMatch && (
        <MatchResultModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}

// ─── Tab: Llaves ───────────────────────────────────────────────
function BracketsTab({ categoryId }: { categoryId: string }) {
  const qc = useQueryClient();
  const [initForm, setInitForm] = useState({ stage: 'QUARTER_FINAL', scheduledAt: '', teamIds: [] as string[] });

  const { data: bracketsData } = useQuery({
    queryKey: ['brackets', categoryId],
    queryFn: () => api.brackets.byCategory(categoryId),
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams', categoryId],
    queryFn: () => api.teams.list({ categoryId }),
  });

  const initBracket = useMutation({
    mutationFn: () => api.brackets.init({
      categoryId,
      stage: initForm.stage,
      teamIds: initForm.teamIds,
      scheduledAt: new Date(initForm.scheduledAt).toISOString(),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brackets', categoryId] }),
  });

  const brackets = bracketsData?.data ?? [];
  const teams = teamsData?.data ?? [];

  function toggleTeam(id: string) {
    setInitForm(f => ({
      ...f,
      teamIds: f.teamIds.includes(id) ? f.teamIds.filter(t => t !== id) : [...f.teamIds, id],
    }));
  }

  return (
    <div className="space-y-6">
      {/* Existing brackets */}
      {brackets.length > 0 && (
        <div className="space-y-4">
          {brackets.map((bracket: any) => (
            <div key={bracket.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-900">
                  {BRACKET_STAGE_LABELS[bracket.stage] ?? bracket.stage}
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {bracket.matches.map((m: any) => (
                  <div key={m.id} className="border rounded-lg overflow-hidden">
                    <div className={`flex items-center justify-between px-3 py-2 text-sm ${m.status === 'FINISHED' && m.homeScore > m.awayScore ? 'bg-green-50 font-semibold' : ''}`}>
                      <span>{m.homeTeam?.name ?? 'Por definir'}</span>
                      {m.status === 'FINISHED' && <span className="font-bold">{m.homeScore}</span>}
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className={`flex items-center justify-between px-3 py-2 text-sm ${m.status === 'FINISHED' && m.awayScore > m.homeScore ? 'bg-green-50 font-semibold' : ''}`}>
                      <span>{m.awayTeam?.name ?? 'Por definir'}</span>
                      {m.status === 'FINISHED' && <span className="font-bold">{m.awayScore}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Initialize new bracket */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy size={16} className="text-primary" /> Inicializar nueva fase eliminatoria
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
            <select
              value={initForm.stage}
              onChange={e => setInitForm(f => ({ ...f, stage: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.entries(BRACKET_STAGE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha tentativa</label>
            <input
              type="datetime-local"
              value={initForm.scheduledAt}
              onChange={e => setInitForm(f => ({ ...f, scheduledAt: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccioná los equipos ({initForm.teamIds.length} seleccionados — necesitás un número par)
          </label>
          <div className="flex flex-wrap gap-2">
            {teams.map((t: any) => (
              <button
                key={t.id}
                onClick={() => toggleTeam(t.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  initForm.teamIds.includes(t.id)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => initBracket.mutate()}
          disabled={
            initBracket.isPending ||
            initForm.teamIds.length < 2 ||
            initForm.teamIds.length % 2 !== 0 ||
            !initForm.scheduledAt
          }
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <Play size={14} /> {initBracket.isPending ? 'Creando...' : 'Crear llaves'}
        </button>
        {initForm.teamIds.length > 0 && initForm.teamIds.length % 2 !== 0 && (
          <p className="text-xs text-amber-600 mt-2">Seleccioná un número par de equipos</p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Estadísticas ─────────────────────────────────────────
function StatsTab({ categoryId }: { categoryId: string }) {
  const { data: scorersData } = useQuery({
    queryKey: ['scorers', categoryId],
    queryFn: () => api.statistics.scorers(categoryId),
  });
  const { data: cardsData } = useQuery({
    queryKey: ['cards', categoryId],
    queryFn: () => api.statistics.cards(categoryId),
  });
  const { data: fairPlayData } = useQuery({
    queryKey: ['fairplay', categoryId],
    queryFn: () => api.statistics.fairPlay(categoryId),
  });

  const scorers = scorersData?.data ?? [];
  const cards = cardsData?.data ?? [];
  const fairPlay = fairPlayData?.data ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scorers */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">⚽ Goleadores</h3>
        </div>
        {scorers.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">Sin goles registrados</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {scorers.map((p: any, i: number) => (
                <tr key={p.id} className="px-5 py-2">
                  <td className="px-4 py-2 text-gray-400 w-8">{i + 1}</td>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-900">{p.fullName}</p>
                    <p className="text-xs text-gray-400">{p.team?.name}</p>
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-primary">{p.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cards */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">🟨 Tarjetas</h3>
        </div>
        {cards.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">Sin tarjetas registradas</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Jugador</th>
                <th className="px-3 py-2 text-center text-yellow-500 font-medium text-xs">🟨</th>
                <th className="px-3 py-2 text-center text-red-500 font-medium text-xs">🟥</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cards.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-900 text-xs">{p.fullName}</p>
                    <p className="text-xs text-gray-400">{p.team?.name}</p>
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-yellow-600">{p.yellow}</td>
                  <td className="px-3 py-2 text-center font-bold text-red-600">{p.red}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Fair Play */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">🤝 Fair Play</h3>
        </div>
        {fairPlay.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">Sin datos</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {fairPlay.map((t: any, i: number) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 text-gray-400 w-8">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-900 text-xs">{t.name}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                      {t.yellow}A {t.red}R
                    </span>
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

// ─── Main Page ─────────────────────────────────────────────────
export default function CategoryPage() {
  const { id: tournamentId, catId } = useParams<{ id: string; catId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('equipos');

  const { data } = useQuery({
    queryKey: ['category', catId],
    queryFn: () => api.categories.get(catId),
  });

  const category = data?.data;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'equipos', label: 'Equipos' },
    { id: 'grupos', label: 'Grupos y Posiciones' },
    { id: 'partidos', label: 'Partidos' },
    { id: 'llaves', label: 'Llaves' },
    { id: 'estadisticas', label: 'Estadísticas' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/tournaments/${tournamentId}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{category?.name ?? 'Categoría'}</h1>
            {category && (
              <span className={`text-xs px-2 py-1 rounded-full ${category.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {category.active ? 'Activa' : 'Inactiva'}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {category?.tournament?.name} · {category?.phaseType === 'MIXED' ? 'Grupos + Eliminación' : category?.phaseType}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'equipos' && <TeamsTab categoryId={catId} />}
        {activeTab === 'grupos' && <GroupsTab categoryId={catId} />}
        {activeTab === 'partidos' && <MatchesTab categoryId={catId} />}
        {activeTab === 'llaves' && <BracketsTab categoryId={catId} />}
        {activeTab === 'estadisticas' && <StatsTab categoryId={catId} />}
      </div>
    </div>
  );
}
