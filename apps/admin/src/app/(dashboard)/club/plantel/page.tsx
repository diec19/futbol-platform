'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Search, Plus, X, QrCode, Pencil, Trash2,
  ChevronLeft, ChevronRight, Filter, Camera,
} from 'lucide-react';
import { POSITION_LABELS } from '@futbol/constants';

const POSITIONS = [
  { value: '', label: 'Todas las posiciones' },
  { value: 'GOALKEEPER', label: 'Arquero' },
  { value: 'DEFENDER', label: 'Defensor' },
  { value: 'MIDFIELDER', label: 'Mediocampista' },
  { value: 'FORWARD', label: 'Delantero' },
];

// ── Player avatar ─────────────────────────────────────────────────────────────
function PlayerAvatar({ player, size = 'md' }: { player: any; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'md' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';
  if (player.photoUrl) {
    return (
      <img
        src={player.photoUrl}
        alt={player.fullName}
        className={`${s} rounded-full object-cover flex-shrink-0 border-2 border-slate-100`}
      />
    );
  }
  return (
    <div className={`${s} rounded-full bg-brand-navy/10 flex items-center justify-center flex-shrink-0`}>
      <span className="font-bold text-brand-navy">{player.fullName[0].toUpperCase()}</span>
    </div>
  );
}

// ── Credential modal ──────────────────────────────────────────────────────────
function CredentialModal({ player, onClose }: { player: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['credential', player.id],
    queryFn: () => api.club.credentials.get(player.id),
  });
  const generateMutation = useMutation({
    mutationFn: () => api.club.credentials.generate(player.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credential', player.id] }),
  });
  const credential = data?.data?.credential;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <p className="font-bold text-slate-800">Credencial del Jugador</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-brand-navy rounded-xl p-4 text-white flex gap-4 items-center">
            <PlayerAvatar player={player} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base leading-tight">{player.fullName}</p>
              <p className="text-white/70 text-xs">DNI: {player.dni}</p>
              {player.clubCategory && <p className="text-white/60 text-xs mt-0.5">{player.clubCategory.name}</p>}
              {player.shirtNumber && <p className="text-brand-red text-xs font-bold mt-0.5">#{player.shirtNumber}</p>}
            </div>
            {credential?.qrCode && (
              <img src={credential.qrCode} alt="QR" className="w-16 h-16 rounded bg-white p-1 flex-shrink-0" />
            )}
          </div>
          {isLoading ? (
            <p className="text-center text-slate-400 text-sm">Cargando...</p>
          ) : !credential ? (
            <div className="text-center space-y-2">
              <p className="text-slate-500 text-sm">No tiene credencial generada aún</p>
              <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
                className="px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50">
                {generateMutation.isPending ? 'Generando...' : 'Generar credencial'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 text-center">Válida hasta: {new Date(credential.expiresAt).toLocaleDateString('es-AR')}</p>
              <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
                className="w-full px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                Regenerar QR
              </button>
              <button onClick={() => { const a = document.createElement('a'); a.href = credential.qrCode; a.download = `credencial-${player.fullName.replace(/ /g, '_')}.png`; a.click(); }}
                className="w-full px-4 py-2 bg-brand-blue text-white rounded-lg text-sm hover:bg-brand-blue-dark">
                Descargar QR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Player form modal ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  firstName: '', lastName: '', dni: '', birthDate: '',
  clubCategoryId: '', teamId: '', position: '', shirtNumber: '',
  medicalStatus: '', observations: '', photoUrl: '',
};

function PlayerModal({ player, onClose, onSaved }: { player?: any; onClose: () => void; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(
    player ? {
      firstName: player.firstName ?? '',
      lastName: player.lastName ?? '',
      dni: player.dni,
      birthDate: player.birthDate ? new Date(player.birthDate).toISOString().split('T')[0] : '',
      clubCategoryId: player.clubCategoryId ?? '',
      teamId: player.teamId ?? '',
      position: player.position ?? '',
      shirtNumber: player.shirtNumber ? String(player.shirtNumber) : '',
      medicalStatus: player.medicalStatus ?? '',
      observations: player.observations ?? '',
      photoUrl: player.photoUrl ?? '',
    } : EMPTY_FORM
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ['club-categories'],
    queryFn: () => api.club.categories.list(),
  });
  const categories = catData?.data ?? [];

  const { data: teamsData } = useQuery({
    queryKey: ['all-teams'],
    queryFn: () => api.teams.list(),
  });
  const teams = teamsData?.data ?? [];

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { setError('Nombre y apellido son requeridos'); return; }
    if (!form.dni.trim()) { setError('El DNI es requerido'); return; }
    if (!form.birthDate) { setError('La fecha de nacimiento es requerida'); return; }
    setSaving(true);
    setError('');
    try {
      const firstName = form.firstName.trim();
      const lastName = form.lastName.trim();
      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        dni: form.dni.trim(),
        birthDate: new Date(form.birthDate).toISOString(),
        clubCategoryId: form.clubCategoryId || undefined,
        teamId: form.teamId || undefined,
        position: form.position || undefined,
        shirtNumber: form.shirtNumber ? Number(form.shirtNumber) : undefined,
        medicalStatus: form.medicalStatus || undefined,
        observations: form.observations || undefined,
        photoUrl: form.photoUrl || undefined,
        isClubPlayer: true,
      };
      if (player) {
        await api.players.update(player.id, payload);
      } else {
        await api.players.create(payload);
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
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <p className="font-bold text-slate-800">{player ? 'Editar jugador' : 'Nuevo jugador'}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="Foto" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                  <Camera size={22} className="text-slate-400" />
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-red rounded-full flex items-center justify-center shadow"
              >
                <Camera size={13} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Foto del jugador</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG. Se recomienda imagen cuadrada.</p>
              {form.photoUrl && (
                <button onClick={() => setForm((f) => ({ ...f, photoUrl: '' }))} className="text-xs text-red-500 mt-1 hover:underline">
                  Quitar foto
                </button>
              )}
            </div>
          </div>

          {/* Nombre y apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
              <input value={form.firstName} onChange={set('firstName')} placeholder="Matías"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Apellido *</label>
              <input value={form.lastName} onChange={set('lastName')} placeholder="García"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {/* DNI y fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">DNI *</label>
              <input value={form.dni} onChange={set('dni')} placeholder="44123456"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fecha de nacimiento *</label>
              <input type="date" value={form.birthDate} onChange={set('birthDate')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {/* Categoría y posición */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Categoría del club</label>
              <select value={form.clubCategoryId} onChange={set('clubCategoryId')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sin categoría</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Posición</label>
              <select value={form.position} onChange={set('position')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipo de torneo */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Equipo de torneo <span className="text-slate-300 font-normal">(opcional — para participar en un torneo)</span>
            </label>
            <select value={form.teamId} onChange={set('teamId')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Sin asignar</option>
              {teams.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.category?.name ? `— ${t.category.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Camiseta y estado médico */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">N° de camiseta</label>
              <input type="number" value={form.shirtNumber} onChange={set('shirtNumber')} placeholder="7"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Estado médico</label>
              <input value={form.medicalStatus} onChange={set('medicalStatus')} placeholder="Apto, En tratamiento..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Observaciones</label>
            <textarea value={form.observations} onChange={set('observations')} rows={2} placeholder="Notas adicionales..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red-dark disabled:opacity-50">
              {saving ? 'Guardando...' : player ? 'Guardar cambios' : 'Crear jugador'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlantelPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [position, setPosition] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [credentialPlayer, setCredentialPlayer] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const { data: catData } = useQuery({
    queryKey: ['club-categories'],
    queryFn: () => api.club.categories.list(),
  });
  const categories = catData?.data ?? [];

  const queryParams: Record<string, string> = {
    page: String(page),
    limit: '24',
    isClubPlayer: 'true',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(position ? { position } : {}),
    ...(activeFilter !== '' ? { active: activeFilter } : {}),
    ...(categoryFilter ? { clubCategoryId: categoryFilter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['plantel', queryParams],
    queryFn: () => api.players.list(queryParams),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.players.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plantel'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.players.remove(id),
    onSuccess: () => { setConfirmDelete(null); qc.invalidateQueries({ queryKey: ['plantel'] }); },
  });

  const players = data?.data ?? [];
  const meta = data?.meta;

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const onSaved = () => {
    setShowCreate(false);
    setEditingPlayer(null);
    qc.invalidateQueries({ queryKey: ['plantel'] });
    qc.invalidateQueries({ queryKey: ['club-categories'] });
  };

  return (
    <div className="space-y-6">
      {showCreate && <PlayerModal onClose={() => setShowCreate(false)} onSaved={onSaved} />}
      {editingPlayer && <PlayerModal player={editingPlayer} onClose={() => setEditingPlayer(null)} onSaved={onSaved} />}
      {credentialPlayer && <CredentialModal player={credentialPlayer} onClose={() => setCredentialPlayer(null)} />}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <p className="font-bold text-slate-800">¿Eliminar jugador?</p>
            <p className="text-sm text-slate-500">Se eliminará <strong>{confirmDelete.fullName}</strong>. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={() => deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantel del Club</h1>
          <p className="text-gray-500 text-sm mt-1">{meta?.total ?? 0} jugadores registrados</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-medium hover:bg-brand-red-dark transition-colors">
          <Plus size={16} />
          Nuevo jugador
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar nombre o DNI..."
            className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-52" />
        </div>
        <Filter size={14} className="text-slate-400" />
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Todas las categorías</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={position} onChange={(e) => { setPosition(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Player cards grid */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400">Cargando plantel...</div>
      ) : players.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center space-y-2">
          <p className="text-gray-400 font-medium">No hay jugadores registrados</p>
          <p className="text-gray-300 text-sm">
            {debouncedSearch || position || activeFilter || categoryFilter
              ? 'Probá con otros filtros'
              : 'Creá el primer jugador del plantel'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {players.map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-4 group hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col items-center text-center relative">
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingPlayer(p)} title="Editar"
                    className="w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-slate-400 hover:text-brand-blue">
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => setCredentialPlayer(p)} title="QR"
                    className="w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-slate-400 hover:text-brand-blue">
                    <QrCode size={11} />
                  </button>
                  <button onClick={() => setConfirmDelete(p)} title="Eliminar"
                    className="w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-slate-400 hover:text-red-500">
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Photo */}
                <PlayerAvatar player={p} size="lg" />

                {/* Name */}
                <div className="mt-3 w-full">
                  {p.firstName && p.lastName ? (
                    <>
                      <p className="text-xs text-slate-400 leading-tight">{p.firstName}</p>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{p.lastName}</p>
                    </>
                  ) : (
                    <p className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{p.fullName}</p>
                  )}
                </div>

                {/* Category badge */}
                {p.clubCategory && (
                  <span className="mt-1.5 text-xs font-semibold px-2 py-0.5 bg-brand-navy/10 text-brand-navy rounded-full">
                    {p.clubCategory.name}
                  </span>
                )}
                {!p.clubCategory && (
                  <span className="mt-1.5 text-xs font-medium px-2 py-0.5 bg-amber-50 text-amber-500 rounded-full">
                    Sin cat.
                  </span>
                )}

                {/* Tournament team badge */}
                {p.team && (
                  <span className="mt-1 text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium line-clamp-1">
                    {p.team.name}
                  </span>
                )}

                {/* Position + shirt */}
                <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                  {p.position ? <span>{POSITION_LABELS[p.position] ?? p.position}</span> : null}
                  {p.shirtNumber ? <span className="font-bold text-slate-600">#{p.shirtNumber}</span> : null}
                </div>

                {/* Status toggle */}
                <button onClick={() => toggleMutation.mutate(p.id)} disabled={toggleMutation.isPending}
                  className={`mt-2.5 text-xs font-medium px-2.5 py-0.5 rounded-full transition-colors ${
                    p.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {p.active ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Mostrando {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} de {meta.total}</span>
              <div className="flex gap-2">
                <button disabled={meta.page <= 1} onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft size={15} />
                </button>
                <button disabled={meta.page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-40">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
