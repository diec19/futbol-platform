'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Search, Plus, QrCode, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, Camera } from 'lucide-react';
import { POSITION_LABELS } from '@futbol/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActiveBadge } from '@/components/domain/status-badge';
import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { CredentialModal } from '@/components/domain/credential-modal';

const POSITIONS = [
  { value: 'ALL', label: 'Todas las posiciones' },
  { value: 'GOALKEEPER', label: 'Arquero' },
  { value: 'DEFENDER', label: 'Defensor' },
  { value: 'MIDFIELDER', label: 'Mediocampista' },
  { value: 'FORWARD', label: 'Delantero' },
];

const FORM_POSITIONS = [
  { value: 'none', label: 'Sin posición' },
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
        className={`${s} rounded-full border-2 border-muted object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${s} rounded-full bg-brand-navy/10 flex items-center justify-center flex-shrink-0`}>
      <span className="font-bold text-brand-navy">{player.fullName[0].toUpperCase()}</span>
    </div>
  );
}

// ── Player form modal ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  dni: '',
  birthDate: '',
  clubCategoryId: 'none',
  teamId: 'none',
  position: 'none',
  shirtNumber: '',
  medicalStatus: '',
  observations: '',
  photoUrl: '',
};

function PlayerModal({ player, onClose, onSaved }: { player?: any; onClose: () => void; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(
    player
      ? {
          firstName: player.firstName ?? '',
          lastName: player.lastName ?? '',
          dni: player.dni,
          birthDate: player.birthDate ? new Date(player.birthDate).toISOString().split('T')[0] : '',
          clubCategoryId: player.clubCategoryId ?? 'none',
          teamId: player.teamId ?? 'none',
          position: player.position ?? 'none',
          shirtNumber: player.shirtNumber ? String(player.shirtNumber) : '',
          medicalStatus: player.medicalStatus ?? '',
          observations: player.observations ?? '',
          photoUrl: player.photoUrl ?? '',
        }
      : EMPTY_FORM
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

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Nombre y apellido son requeridos');
      return;
    }
    if (!form.dni.trim()) {
      setError('El DNI es requerido');
      return;
    }
    if (!form.birthDate) {
      setError('La fecha de nacimiento es requerida');
      return;
    }
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
        clubCategoryId: form.clubCategoryId === 'none' ? undefined : form.clubCategoryId,
        teamId: form.teamId === 'none' ? undefined : form.teamId,
        position: form.position === 'none' ? undefined : form.position,
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{player ? 'Editar jugador' : 'Nuevo jugador'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="Foto" className="h-20 w-20 rounded-full border-2 border-muted object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted">
                  <Camera size={22} className="text-muted-foreground" />
                </div>
              )}
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                onClick={() => fileRef.current?.click()}
                aria-label="Cambiar foto del jugador"
              >
                <Camera size={13} />
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Foto del jugador</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                JPG, PNG. Se recomienda imagen cuadrada.
              </p>
              {form.photoUrl && (
                <button
                  onClick={() => setForm((f) => ({ ...f, photoUrl: '' }))}
                  className="mt-1 text-xs text-red-500 hover:underline"
                >
                  Quitar foto
                </button>
              )}
            </div>
          </div>

          {/* Nombre y apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.firstName} onChange={set('firstName')} placeholder="Matías" />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido *</Label>
              <Input value={form.lastName} onChange={set('lastName')} placeholder="García" />
            </div>
          </div>

          {/* DNI y fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>DNI *</Label>
              <Input value={form.dni} onChange={set('dni')} placeholder="44123456" />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de nacimiento *</Label>
              <Input type="date" value={form.birthDate} onChange={set('birthDate')} />
            </div>
          </div>

          {/* Categoría y posición */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría del club</Label>
              <Select
                value={form.clubCategoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, clubCategoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Posición</Label>
              <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORM_POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Equipo de torneo */}
          <div className="space-y-1.5">
            <Label>
              Equipo de torneo{' '}
              <span className="font-normal text-muted-foreground">(opcional — para participar en un torneo)</span>
            </Label>
            <Select value={form.teamId} onValueChange={(v) => setForm((f) => ({ ...f, teamId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {teams.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.category?.name ? `— ${t.category.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Camiseta y estado médico */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>N° de camiseta</Label>
              <Input type="number" value={form.shirtNumber} onChange={set('shirtNumber')} placeholder="7" />
            </div>
            <div className="space-y-1.5">
              <Label>Estado médico</Label>
              <Input value={form.medicalStatus} onChange={set('medicalStatus')} placeholder="Apto, En tratamiento..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observaciones</Label>
            <Textarea value={form.observations} onChange={set('observations')} rows={2} placeholder="Notas adicionales..." />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : player ? 'Guardar cambios' : 'Crear jugador'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlantelPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [position, setPosition] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [credentialPlayer, setCredentialPlayer] = useState<any>(null);

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
    ...(position !== 'ALL' ? { position } : {}),
    ...(activeFilter !== 'ALL' ? { active: activeFilter } : {}),
    ...(categoryFilter !== 'ALL' ? { clubCategoryId: categoryFilter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['plantel', queryParams],
    queryFn: () => api.players.list(queryParams),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.players.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plantel'] }),
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.players.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plantel'] });
      toast.success('Jugador eliminado');
    },
    onError: (err: any) => toast.error(err.message),
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
    toast.success('Jugador guardado');
  };

  return (
    <div className="space-y-6">
      {showCreate && <PlayerModal onClose={() => setShowCreate(false)} onSaved={onSaved} />}
      {editingPlayer && <PlayerModal player={editingPlayer} onClose={() => setEditingPlayer(null)} onSaved={onSaved} />}
      {credentialPlayer && <CredentialModal player={credentialPlayer} onClose={() => setCredentialPlayer(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plantel del Club</h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta?.total ?? 0} jugadores registrados</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nuevo jugador
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar nombre o DNI..."
            className="w-52 pl-9"
          />
        </div>
        <Filter size={14} className="text-muted-foreground" />
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las categorías</SelectItem>
            {categories.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={position} onValueChange={(v) => { setPosition(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Player cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="space-y-2 rounded-xl border bg-card p-12 text-center">
          <p className="font-medium text-muted-foreground">No hay jugadores registrados</p>
          <p className="text-sm text-muted-foreground/70">
            {debouncedSearch || position !== 'ALL' || activeFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'Probá con otros filtros'
              : 'Creá el primer jugador del plantel'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {players.map((p: any) => (
              <Card key={p.id} className="group relative flex flex-col items-center p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                {/* Actions overlay */}
                <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 rounded-full text-muted-foreground shadow hover:text-brand-blue"
                    onClick={() => setEditingPlayer(p)}
                    title="Editar"
                    aria-label="Editar jugador"
                  >
                    <Pencil size={11} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 rounded-full text-muted-foreground shadow hover:text-brand-blue"
                    onClick={() => setCredentialPlayer(p)}
                    title="QR"
                    aria-label="Ver credencial del jugador"
                  >
                    <QrCode size={11} />
                  </Button>
                  <ConfirmDialog
                    title="Eliminar jugador"
                    description={`Se eliminará ${p.fullName}. Esta acción no se puede deshacer.`}
                    confirmLabel="Eliminar"
                    destructive
                    onConfirm={() => deleteMutation.mutate(p.id)}
                    trigger={
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6 rounded-full text-muted-foreground shadow hover:text-destructive"
                        title="Eliminar"
                        aria-label="Eliminar jugador"
                      >
                        <Trash2 size={11} />
                      </Button>
                    }
                  />
                </div>

                {/* Photo */}
                <PlayerAvatar player={p} size="lg" />

                {/* Name */}
                <div className="mt-3 w-full">
                  {p.firstName && p.lastName ? (
                    <>
                      <p className="text-xs leading-tight text-muted-foreground">{p.firstName}</p>
                      <p className="text-sm font-bold leading-tight">{p.lastName}</p>
                    </>
                  ) : (
                    <p className="line-clamp-2 text-sm font-bold leading-tight">{p.fullName}</p>
                  )}
                </div>

                {/* Category badge */}
                {p.clubCategory ? (
                  <Badge variant="secondary" className="mt-1.5 rounded-full">
                    {p.clubCategory.name}
                  </Badge>
                ) : (
                  <Badge variant="warning" className="mt-1.5 rounded-full">
                    Sin cat.
                  </Badge>
                )}

                {/* Tournament team badge */}
                {p.team && (
                  <Badge variant="success" className="mt-1 line-clamp-1 rounded-full">
                    {p.team.name}
                  </Badge>
                )}

                {/* Position + shirt */}
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  {p.position ? <span>{POSITION_LABELS[p.position] ?? p.position}</span> : null}
                  {p.shirtNumber ? <span className="font-bold text-muted-foreground">#{p.shirtNumber}</span> : null}
                </div>

                {/* Status toggle */}
                <button
                  onClick={() => toggleMutation.mutate(p.id)}
                  disabled={toggleMutation.isPending}
                  className="mt-2.5"
                >
                  <ActiveBadge active={p.active} />
                </button>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {(meta.page - 1) * meta.limit + 1}–
                {Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={meta.page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Página anterior">
                  <ChevronLeft size={15} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
