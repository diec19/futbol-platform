'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { X, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
    setEvents(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value, ...(field === 'teamId' ? { playerId: '' } : {}) } : e));
  }

  const allHomePlayers = homePlayers?.data ?? [];
  const allAwayPlayers = awayPlayers?.data ?? [];

  function getPlayersForTeam(teamId: string) {
    return teamId === match.homeTeamId ? allHomePlayers : allAwayPlayers;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <div>
            <h2 className="font-semibold text-gray-900">Cargar resultado</h2>
            <p className="text-sm text-gray-500">{formatDate(match.scheduledAt)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Score */}
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="font-semibold text-gray-900 mb-3">{match.homeTeam?.name}</p>
                <input
                  type="number"
                  min={0}
                  value={homeScore}
                  onChange={e => setHomeScore(Number(e.target.value))}
                  className="w-20 text-center text-3xl font-bold border-2 rounded-xl py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <span className="text-2xl font-bold text-gray-400">—</span>
              <div className="flex-1 text-center">
                <p className="font-semibold text-gray-900 mb-3">{match.awayTeam?.name}</p>
                <input
                  type="number"
                  min={0}
                  value={awayScore}
                  onChange={e => setAwayScore(Number(e.target.value))}
                  className="w-20 text-center text-3xl font-bold border-2 rounded-xl py-2 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Eventos del partido</h3>
              <button
                onClick={addEvent}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus size={14} /> Agregar evento
              </button>
            </div>

            {events.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
                Sin eventos. Podés guardar solo con el resultado.
              </p>
            )}

            <div className="space-y-3">
              {events.map((event, i) => (
                <div key={i} className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    <select
                      value={event.type}
                      onChange={e => updateEvent(i, 'type', e.target.value)}
                      className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                    >
                      {Object.entries(EVENT_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>

                    <select
                      value={event.teamId}
                      onChange={e => updateEvent(i, 'teamId', e.target.value)}
                      className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                    >
                      <option value={match.homeTeamId}>{match.homeTeam?.name}</option>
                      <option value={match.awayTeamId}>{match.awayTeam?.name}</option>
                    </select>

                    <select
                      value={event.playerId ?? ''}
                      onChange={e => updateEvent(i, 'playerId', e.target.value)}
                      className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                    >
                      <option value="">Sin jugador</option>
                      {getPlayersForTeam(event.teamId).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.fullName}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={0}
                      max={200}
                      placeholder="Min."
                      value={event.minute ?? ''}
                      onChange={e => updateEvent(i, 'minute', e.target.value)}
                      className="px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button onClick={() => removeEvent(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors mt-0.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => loadResult.mutate()}
            disabled={loadResult.isPending}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loadResult.isPending ? 'Guardando...' : 'Confirmar resultado'}
          </button>
        </div>
      </div>
    </div>
  );
}
