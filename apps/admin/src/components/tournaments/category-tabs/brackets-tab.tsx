'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Trophy, Play } from 'lucide-react';
import { BRACKET_STAGE_LABELS } from '@futbol/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function BracketsTab({ categoryId }: { categoryId: string }) {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brackets', categoryId] });
      toast.success('Llaves creadas correctamente');
    },
    onError: (err: any) => toast.error(err.message),
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
            <div key={bracket.id} className="rounded-xl border overflow-hidden bg-card">
              <div className="px-5 py-3 bg-muted/50 border-b">
                <h3 className="font-semibold">
                  {BRACKET_STAGE_LABELS[bracket.stage] ?? bracket.stage}
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {bracket.matches.map((m: any) => (
                  <div key={m.id} className="border rounded-lg overflow-hidden">
                    <div
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-sm',
                        m.status === 'FINISHED' && m.homeScore > m.awayScore && 'bg-emerald-50 font-semibold'
                      )}
                    >
                      <span>{m.homeTeam?.name ?? 'Por definir'}</span>
                      {m.status === 'FINISHED' && <span className="font-bold">{m.homeScore}</span>}
                    </div>
                    <div className="h-px bg-border" />
                    <div
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-sm',
                        m.status === 'FINISHED' && m.awayScore > m.homeScore && 'bg-emerald-50 font-semibold'
                      )}
                    >
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
      <div className="rounded-xl border p-5 bg-card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Inicializar nueva fase eliminatoria
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label>Fase</Label>
            <Select
              value={initForm.stage}
              onValueChange={value => setInitForm(f => ({ ...f, stage: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BRACKET_STAGE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha tentativa</Label>
            <Input
              type="datetime-local"
              value={initForm.scheduledAt}
              onChange={e => setInitForm(f => ({ ...f, scheduledAt: e.target.value }))}
            />
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-2 block">
            Seleccioná los equipos ({initForm.teamIds.length} seleccionados — necesitás un número par)
          </Label>
          <div className="flex flex-wrap gap-2">
            {teams.map((t: any) => (
              <Button
                key={t.id}
                type="button"
                size="sm"
                variant={initForm.teamIds.includes(t.id) ? 'default' : 'outline'}
                onClick={() => toggleTeam(t.id)}
                className="rounded-full"
              >
                {t.name}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => initBracket.mutate()}
          disabled={
            initBracket.isPending ||
            initForm.teamIds.length < 2 ||
            initForm.teamIds.length % 2 !== 0 ||
            !initForm.scheduledAt
          }
          className="gap-2"
        >
          <Play className="h-4 w-4" /> {initBracket.isPending ? 'Creando...' : 'Crear llaves'}
        </Button>
        {initForm.teamIds.length > 0 && initForm.teamIds.length % 2 !== 0 && (
          <p className="text-xs text-amber-600 mt-2">Seleccioná un número par de equipos</p>
        )}
      </div>
    </div>
  );
}
