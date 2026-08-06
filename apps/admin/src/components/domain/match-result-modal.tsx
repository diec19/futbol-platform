'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Event {
  type: string;
  teamId: string;
  playerId?: string;
  minute?: number;
}

interface Props {
  match: any;
  onClose: () => void;
}

const EVENT_LABELS: Record<string, string> = {
  GOAL: '⚽ Gol',
  OWN_GOAL: '🥅 Gol en contra',
  YELLOW_CARD: '🟨 Amarilla',
  RED_CARD: '🟥 Roja',
  DOUBLE_YELLOW: '🟨🟥 Doble amarilla',
  MVP: '⭐ MVP',
};

export function MatchResultModal({ match, onClose }: Props) {
  const qc = useQueryClient();
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState('');

  const { data: homePlayers } = useQuery({
    queryKey: ['team-players', match.homeTeamId],
    queryFn: () => api.players.list({ teamId: match.homeTeamId, active: 'true', limit: '50' }),
  });

  const { data: awayPlayers } = useQuery({
    queryKey: ['team-players', match.awayTeamId],
    queryFn: () => api.players.list({ teamId: match.awayTeamId, active: 'true', limit: '50' }),
  });

  const loadResult = useMutation({
    mutationFn: () =>
      api.matches.loadResult(match.id, {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        status: 'FINISHED',
        events: events.map(e => ({
          ...e,
          minute: e.minute ? Number(e.minute) : undefined,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['standings'] });
      qc.invalidateQueries({ queryKey: ['category'] });
      toast.success('Resultado cargado correctamente');
      onClose();
    },
    onError: (err: any) => setError(err.message),
  });

  function addEvent() {
    setEvents(prev => [...prev, { type: 'GOAL', teamId: match.homeTeamId }]);
  }

  function removeEvent(i: number) {
    setEvents(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateEvent(i: number, field: string, value: string) {
    setEvents(prev =>
      prev.map((e, idx) =>
        idx === i ? { ...e, [field]: value, ...(field === 'teamId' ? { playerId: '' } : {}) } : e
      )
    );
  }

  const allHomePlayers = homePlayers?.data ?? [];
  const allAwayPlayers = awayPlayers?.data ?? [];

  function getPlayersForTeam(teamId: string) {
    return teamId === match.homeTeamId ? allHomePlayers : allAwayPlayers;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cargar resultado</DialogTitle>
          <DialogDescription>{formatDate(match.scheduledAt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score */}
          <div className="rounded-xl bg-muted p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="font-semibold mb-3">{match.homeTeam?.name}</p>
                <Input
                  type="number"
                  min={0}
                  value={homeScore}
                  onChange={e => setHomeScore(Number(e.target.value))}
                  className="w-20 mx-auto text-center text-3xl font-bold"
                />
              </div>
              <span className="text-2xl font-bold text-muted-foreground">—</span>
              <div className="flex-1 text-center">
                <p className="font-semibold mb-3">{match.awayTeam?.name}</p>
                <Input
                  type="number"
                  min={0}
                  value={awayScore}
                  onChange={e => setAwayScore(Number(e.target.value))}
                  className="w-20 mx-auto text-center text-3xl font-bold"
                />
              </div>
            </div>
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Eventos del partido</h3>
              <Button variant="link" size="sm" onClick={addEvent} className="gap-1">
                <Plus className="h-4 w-4" /> Agregar evento
              </Button>
            </div>

            {events.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                Sin eventos. Podés guardar solo con el resultado.
              </p>
            )}

            <div className="space-y-3">
              {events.map((event, i) => (
                <div key={i} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
                    <Select
                      value={event.type}
                      onValueChange={value => updateEvent(i, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENT_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={event.teamId}
                      onValueChange={value => updateEvent(i, 'teamId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Equipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={match.homeTeamId}>{match.homeTeam?.name}</SelectItem>
                        <SelectItem value={match.awayTeamId}>{match.awayTeam?.name}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={event.playerId ?? ''}
                      onValueChange={value => updateEvent(i, 'playerId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin jugador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin jugador</SelectItem>
                        {getPlayersForTeam(event.teamId).map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min={0}
                      max={200}
                      placeholder="Min."
                      value={event.minute ?? ''}
                      onChange={e => updateEvent(i, 'minute', e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEvent(i)}
                    className="text-muted-foreground hover:text-destructive mt-0.5"
                    aria-label="Eliminar evento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => loadResult.mutate()}
            disabled={loadResult.isPending}
          >
            {loadResult.isPending ? 'Guardando...' : 'Confirmar resultado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
