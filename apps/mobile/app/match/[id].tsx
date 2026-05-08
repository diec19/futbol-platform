import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MATCH_STATUS_LABELS } from '@futbol/constants';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: '#f3f4f6', text: '#6b7280' },
  LIVE: { bg: '#dcfce7', text: '#15803d' },
  FINISHED: { bg: '#dbeafe', text: '#1d4ed8' },
  POSTPONED: { bg: '#fef9c3', text: '#a16207' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
};

const EVENT_ICONS: Record<string, string> = {
  GOAL: '⚽',
  OWN_GOAL: '🥅',
  YELLOW_CARD: '🟨',
  RED_CARD: '🟥',
  DOUBLE_YELLOW: '🟨🟥',
  MVP: '⭐',
};

const EVENT_LABELS: Record<string, string> = {
  GOAL: 'Gol',
  OWN_GOAL: 'Gol en contra',
  YELLOW_CARD: 'Amarilla',
  RED_CARD: 'Roja',
  DOUBLE_YELLOW: 'Doble amarilla',
  MVP: 'MVP',
};

function formatDateTime(d: string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => api.matches.get(id),
    enabled: !!id,
  });

  const match = data?.data;

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator color="#16a34a" size="large" /></View>;
  }

  if (!match) {
    return <View style={s.centered}><Text style={s.empty}>Partido no encontrado</Text></View>;
  }

  const sc = STATUS_COLORS[match.status] ?? STATUS_COLORS.SCHEDULED;
  const isFinished = match.status === 'FINISHED';
  const events: any[] = match.events ?? [];
  const homeEvents = events.filter((e: any) => e.teamId === match.homeTeamId);
  const awayEvents = events.filter((e: any) => e.teamId === match.awayTeamId);
  const hasEvents = events.length > 0;

  const homeGoals = events.filter((e: any) => e.type === 'GOAL' && e.teamId === match.homeTeamId);
  const awayGoals = events.filter((e: any) => e.type === 'GOAL' && e.teamId === match.awayTeamId);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView>
        {/* Score header */}
        <View style={s.header}>
          <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[s.statusText, { color: sc.text }]}>
              {MATCH_STATUS_LABELS[match.status] ?? match.status}
            </Text>
          </View>

          <View style={s.scoreRow}>
            <View style={s.teamBlock}>
              <View style={s.teamCircle}>
                <Text style={s.teamInitial}>{match.homeTeam?.name[0]?.toUpperCase()}</Text>
              </View>
              <Text style={s.teamLabel} numberOfLines={2}>{match.homeTeam?.name}</Text>
            </View>

            <View style={s.scoreBlock}>
              {isFinished ? (
                <Text style={s.score}>{match.homeScore} - {match.awayScore}</Text>
              ) : (
                <Text style={s.vs}>vs</Text>
              )}
            </View>

            <View style={s.teamBlock}>
              <View style={s.teamCircle}>
                <Text style={s.teamInitial}>{match.awayTeam?.name[0]?.toUpperCase()}</Text>
              </View>
              <Text style={[s.teamLabel, { textAlign: 'right' }]} numberOfLines={2}>{match.awayTeam?.name}</Text>
            </View>
          </View>

          <Text style={s.dateText}>{formatDateTime(match.scheduledAt)}</Text>
          {match.venue && <Text style={s.venueText}>📍 {match.venue}</Text>}
          {match.referee && <Text style={s.refereeText}>🏁 {match.referee.fullName}</Text>}
          {match.group && <Text style={s.groupText}>{match.group.name}{match.round ? ` · Fecha ${match.round}` : ''}</Text>}
        </View>

        {/* Goalscorers summary (if finished) */}
        {isFinished && (homeGoals.length > 0 || awayGoals.length > 0) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Goles</Text>
            <View style={s.goalsCard}>
              <View style={s.goalsCol}>
                {homeGoals.map((e: any) => (
                  <Text key={e.id} style={s.goalItem}>
                    ⚽ {e.player?.fullName ?? 'Jugador'}
                    {e.minute != null ? ` ${e.minute}'` : ''}
                  </Text>
                ))}
              </View>
              <View style={s.goalsDivider} />
              <View style={[s.goalsCol, { alignItems: 'flex-end' }]}>
                {awayGoals.map((e: any) => (
                  <Text key={e.id} style={[s.goalItem, { textAlign: 'right' }]}>
                    ⚽ {e.player?.fullName ?? 'Jugador'}
                    {e.minute != null ? ` ${e.minute}'` : ''}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Events timeline */}
        {hasEvents && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Eventos del partido</Text>
            <View style={s.timeline}>
              {events.map((event: any) => {
                const isHome = event.teamId === match.homeTeamId;
                return (
                  <View key={event.id} style={[s.eventRow, isHome ? s.eventLeft : s.eventRight]}>
                    {isHome && (
                      <>
                        <View style={s.eventInfo}>
                          <Text style={s.eventPlayer} numberOfLines={1}>{event.player?.fullName ?? '—'}</Text>
                          <Text style={s.eventTypeLabel}>{EVENT_LABELS[event.type] ?? event.type}</Text>
                        </View>
                        <View style={s.eventMinBox}>
                          <Text style={s.eventMin}>{event.minute != null ? `${event.minute}'` : '—'}</Text>
                        </View>
                        <Text style={s.eventIcon}>{EVENT_ICONS[event.type] ?? '•'}</Text>
                        <View style={s.eventSpacer} />
                      </>
                    )}
                    {!isHome && (
                      <>
                        <View style={s.eventSpacer} />
                        <Text style={s.eventIcon}>{EVENT_ICONS[event.type] ?? '•'}</Text>
                        <View style={s.eventMinBox}>
                          <Text style={s.eventMin}>{event.minute != null ? `${event.minute}'` : '—'}</Text>
                        </View>
                        <View style={[s.eventInfo, { alignItems: 'flex-end' }]}>
                          <Text style={[s.eventPlayer, { textAlign: 'right' }]} numberOfLines={1}>{event.player?.fullName ?? '—'}</Text>
                          <Text style={[s.eventTypeLabel, { textAlign: 'right' }]}>{EVENT_LABELS[event.type] ?? event.type}</Text>
                        </View>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {match.notes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Notas</Text>
            <View style={s.notesCard}>
              <Text style={s.notesText}>{match.notes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#9ca3af' },
  header: { backgroundColor: '#16a34a', padding: 20, alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
  statusText: { fontSize: 12, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  teamBlock: { flex: 1, alignItems: 'center', gap: 8 },
  teamCircle: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  teamInitial: { fontSize: 20, fontWeight: '700', color: '#fff' },
  teamLabel: { fontSize: 13, fontWeight: '600', color: '#fff', textAlign: 'center' },
  scoreBlock: { paddingHorizontal: 16 },
  score: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  vs: { fontSize: 20, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  dateText: { fontSize: 13, color: '#bbf7d0', marginTop: 16, textAlign: 'center', textTransform: 'capitalize' },
  venueText: { fontSize: 12, color: '#86efac', marginTop: 4 },
  refereeText: { fontSize: 12, color: '#86efac', marginTop: 2 },
  groupText: { fontSize: 12, color: '#86efac', marginTop: 2 },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  goalsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', elevation: 1 },
  goalsCol: { flex: 1 },
  goalsDivider: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 12 },
  goalItem: { fontSize: 13, color: '#374151', marginBottom: 4 },
  timeline: { backgroundColor: '#fff', borderRadius: 12, padding: 8, elevation: 1, gap: 2 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, gap: 6 },
  eventLeft: {},
  eventRight: {},
  eventSpacer: { flex: 1 },
  eventInfo: { flex: 1 },
  eventPlayer: { fontSize: 13, fontWeight: '600', color: '#111827' },
  eventTypeLabel: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  eventIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  eventMinBox: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  eventMin: { fontSize: 12, fontWeight: '600', color: '#374151' },
  notesCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 1 },
  notesText: { fontSize: 13, color: '#374151', lineHeight: 20 },
});
