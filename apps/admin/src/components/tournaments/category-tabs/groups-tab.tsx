'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Plus, RotateCcw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function GroupsTab({ categoryId }: { categoryId: string }) {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['standings', categoryId] });
      setNewGroupName('');
      toast.success('Grupo creado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addTeam = useMutation({
    mutationFn: ({ groupId, teamIds }: { groupId: string; teamIds: string[] }) =>
      api.standings.addTeams(groupId, teamIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standings', categoryId] }),
    onError: (err: any) => toast.error(err.message),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Fixture generado correctamente');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const recalculate = useMutation({
    mutationFn: (groupId: string) => api.standings.recalculate(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['standings', categoryId] });
      toast.success('Posiciones recalculadas');
    },
    onError: (err: any) => toast.error(err.message),
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
        <Input
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          placeholder="Nombre del grupo (ej: Grupo A)"
          className="max-w-xs"
        />
        <Button
          onClick={() => createGroup.mutate()}
          disabled={!newGroupName || createGroup.isPending}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Crear grupo
        </Button>
      </div>

      {groups.length === 0 && (
        <div className="rounded-xl border p-8 text-center text-muted-foreground">
          No hay grupos. Creá el primero para empezar.
        </div>
      )}

      {groups.map((group: any) => {
        const unassigned = getUnassignedTeamsForGroup(group);
        const cfg = fixtureConfig[group.id] ?? { startDate: '', venue: '', interval: '7' };

        return (
          <div key={group.id} className="rounded-xl border overflow-hidden bg-card">
            <div className="flex items-center justify-between px-5 py-3 bg-muted/50 border-b">
              <h3 className="font-semibold">{group.name}</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => recalculate.mutate(group.id)}
                  className="gap-1.5 text-xs"
                  title="Recalcular posiciones"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Recalcular
                </Button>
              </div>
            </div>

            {/* Standings table */}
            {group.teams.length > 0 && (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipo</TableHead>
                      {['PJ', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'PTS'].map(h => (
                        <TableHead key={h} className="text-center w-8">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...group.teams]
                      .sort((a: any, b: any) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor)
                      .map((gt: any) => (
                        <TableRow key={gt.id}>
                          <TableCell className="font-medium">{gt.team?.name}</TableCell>
                          {[gt.played, gt.won, gt.drawn, gt.lost, gt.goalsFor, gt.goalsAgainst, gt.goalDiff].map((v, i) => (
                            <TableCell key={i} className="text-center text-muted-foreground">{v}</TableCell>
                          ))}
                          <TableCell className="text-center font-bold text-primary">{gt.points}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Add teams to group */}
            {unassigned.length > 0 && (
              <div className="px-4 py-3 border-t bg-muted/30 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Agregar equipo:</span>
                {unassigned.map((t: any) => (
                  <Button
                    key={t.id}
                    variant="outline"
                    size="sm"
                    onClick={() => addTeam.mutate({ groupId: group.id, teamIds: [t.id] })}
                    className="rounded-full text-xs"
                  >
                    + {t.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Fixture generation */}
            <div className="px-4 py-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Generar fixture</p>
              <div className="flex items-end gap-2 flex-wrap">
                <div className="space-y-1">
                  <Label className="text-xs">Fecha inicio</Label>
                  <Input
                    type="date"
                    value={cfg.startDate}
                    onChange={e => setFixtureConfig(f => ({ ...f, [group.id]: { ...cfg, startDate: e.target.value } }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cancha</Label>
                  <Input
                    placeholder="Cancha principal"
                    value={cfg.venue}
                    onChange={e => setFixtureConfig(f => ({ ...f, [group.id]: { ...cfg, venue: e.target.value } }))}
                    className="h-8 text-sm w-36"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Días entre fechas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={cfg.interval}
                    onChange={e => setFixtureConfig(f => ({ ...f, [group.id]: { ...cfg, interval: e.target.value } }))}
                    className="h-8 text-sm w-20"
                  />
                </div>
                <Button
                  onClick={() => generateFixture.mutate({ groupId: group.id })}
                  disabled={generateFixture.isPending || group.teams.length < 2 || !cfg.startDate}
                  className="gap-1.5 h-8 text-sm"
                >
                  <Play className="h-3.5 w-3.5" /> Generar
                </Button>
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
