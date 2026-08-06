'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Pencil, Save, X,
  Trophy, Users, UserRound, Calendar, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/domain/status-badge';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
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
      toast.success('Torneo actualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const tournament = data?.data;
  const stats = statsData?.data;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!tournament) return <div className="p-8 text-center text-muted-foreground">Torneo no encontrado</div>;

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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/tournaments" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{tournament.name}</h1>
            <StatusBadge status={tournament.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}
            {tournament.sponsor && ` · Sponsor: ${tournament.sponsor}`}
          </p>
        </div>
        {!editing && (
          <Button variant="outline" onClick={startEdit} className="gap-2">
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold">Editar torneo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre</Label>
                <Input value={form.name} onChange={set('name')} />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha inicio</Label>
                <Input type="date" value={form.startDate} onChange={set('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha fin</Label>
                <Input type="date" value={form.endDate} onChange={set('endDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                    <SelectItem value="FINISHED">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sponsor</Label>
                <Input value={form.sponsor} onChange={set('sponsor')} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={set('description')} rows={2} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditing(false)} className="gap-1.5">
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={() => update.mutate()} disabled={update.isPending} className="gap-1.5">
                <Save className="h-4 w-4" /> {update.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>
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
      <Card>
        <CardContent className="p-0">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-semibold">Categorías</h2>
            <Button asChild size="sm" className="gap-2">
              <Link href={`/tournaments/${id}/categories/new`}>
                <Plus className="h-4 w-4" /> Nueva categoría
              </Link>
            </Button>
          </div>

          {tournament.categories?.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No hay categorías</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Creá la primera categoría para empezar a organizar el torneo
              </p>
              <Button asChild className="mt-4 gap-2">
                <Link href={`/tournaments/${id}/categories/new`}>
                  <Plus className="h-4 w-4" /> Crear categoría
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {tournament.categories?.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/tournaments/${id}/categories/${cat.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cat.active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">{cat.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat.teams?.length ?? 0} equipos
                        {cat.phaseType && ` · ${cat.phaseType === 'GROUP' ? 'Fase de grupos' : cat.phaseType === 'KNOCKOUT' ? 'Eliminación directa' : 'Mixto'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${cat.active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                      {cat.active ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="text-muted-foreground group-hover:text-foreground">›</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
