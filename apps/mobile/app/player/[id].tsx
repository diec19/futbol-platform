import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlayerAvatar from '../../components/PlayerAvatar';
import { POSITION_LABELS } from '../../lib/constants';

const EVENT_LABELS: Record<string, string> = {
  GOAL: '⚽ Gol',
  OWN_GOAL: '🥅 Gol en contra',
  YELLOW_CARD: '🟨 Amarilla',
  RED_CARD: '🟥 Roja',
  DOUBLE_YELLOW: '🟨🟥 Doble amarilla',
  MVP: '⭐ MVP',
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: () => api.players.get(id),
    enabled: !!id,
  });

  const player = data?.data;

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator color="#16a34a" size="large" /></View>;
  }

  if (!player) {
    return <View style={s.centered}><Text style={s.empty}>Jugador no encontrado</Text></View>;
  }

  const events: any[] = player.events ?? [];
  const sanctions: any[] = player.sanctions ?? [];
  const pendingSanctions = sanctions.filter((s: any) => !s.resolved);

  const goals = events.filter((e: any) => e.type === 'GOAL').length;
  const ownGoals = events.filter((e: any) => e.type === 'OWN_GOAL').length;
  const yellow = events.filter((e: any) => e.type === 'YELLOW_CARD' || e.type === 'DOUBLE_YELLOW').length;
  const red = events.filter((e: any) => e.type === 'RED_CARD' || e.type === 'DOUBLE_YELLOW').length;
  const mvp = events.filter((e: any) => e.type === 'MVP').length;

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView>
        {/* Header */}
        <View style={s.header}>
          <PlayerAvatar photoUrl={player.photoUrl} name={player.fullName} size={72} style={s.avatar} />
          <Text style={s.name}>{player.fullName}</Text>
          {player.shirtNumber && (
            <Text style={s.shirt}>#{player.shirtNumber}</Text>
          )}
          <Text style={s.teamName}>{player.team?.name}</Text>
          {player.position && (
            <View style={s.posBadge}>
              <Text style={s.posText}>{POSITION_LABELS[player.position] ?? player.position}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Información</Text>
          <View style={s.infoCard}>
            {[
              ['DNI', player.dni],
              ['Fecha de nac.', player.birthDate ? `${formatDate(player.birthDate)} (${calcAge(player.birthDate)} años)` : null],
              ['Categoría', player.team?.category?.name],
              ['Torneo', player.team?.category?.tournament?.name],
            ].map(([label, value]) => value ? (
              <View key={label} style={s.infoRow}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValue}>{value}</Text>
              </View>
            ) : null)}
          </View>
        </View>

        {/* Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Estadísticas</Text>
          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statNum}>{goals}</Text>
              <Text style={s.statLabel}>⚽ Goles</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statNum}>{yellow}</Text>
              <Text style={s.statLabel}>🟨 Amarillas</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statNum}>{red}</Text>
              <Text style={s.statLabel}>🟥 Rojas</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statNum}>{mvp}</Text>
              <Text style={s.statLabel}>⭐ MVP</Text>
            </View>
          </View>
        </View>

        {/* Active sanctions */}
        {pendingSanctions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Sanciones activas</Text>
            {pendingSanctions.map((sanction: any) => (
              <View key={sanction.id} style={s.sanctionCard}>
                <Text style={s.sanctionType}>{sanction.type?.replace(/_/g, ' ')}</Text>
                {sanction.matchesBan > 0 && (
                  <Text style={s.sanctionDetail}>{sanction.matchesBan} fechas de suspensión</Text>
                )}
                {sanction.reason && (
                  <Text style={s.sanctionReason}>{sanction.reason}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Event history */}
        {events.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Historial de eventos</Text>
            <View style={s.infoCard}>
              {events.slice(0, 20).map((event: any) => (
                <View key={event.id} style={s.eventRow}>
                  <Text style={s.eventType}>{EVENT_LABELS[event.type] ?? event.type}</Text>
                  {event.minute != null && (
                    <Text style={s.eventMin}>{event.minute}'</Text>
                  )}
                  <Text style={s.eventDate}>
                    {event.match?.scheduledAt ? formatDate(event.match.scheduledAt) : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {ownGoals > 0 && (
          <View style={s.ownGoalNote}>
            <Text style={s.ownGoalText}>Incluye {ownGoals} gol{ownGoals > 1 ? 'es' : ''} en contra</Text>
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
  header: { backgroundColor: '#16a34a', paddingVertical: 24, alignItems: 'center', paddingHorizontal: 20 },
  avatar: { marginBottom: 8, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  shirt: { fontSize: 14, color: '#bbf7d0', marginTop: 2 },
  teamName: { fontSize: 14, color: '#bbf7d0', marginTop: 4 },
  posBadge: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  posText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 13, color: '#9ca3af' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#111827', flex: 1, textAlign: 'right' },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 22, fontWeight: '700', color: '#16a34a' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2, textAlign: 'center' },
  sanctionCard: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  sanctionType: { fontSize: 13, fontWeight: '600', color: '#991b1b' },
  sanctionDetail: { fontSize: 12, color: '#dc2626', marginTop: 2 },
  sanctionReason: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  eventType: { fontSize: 13, color: '#111827', flex: 1 },
  eventMin: { fontSize: 12, color: '#16a34a', fontWeight: '600', marginRight: 10 },
  eventDate: { fontSize: 11, color: '#9ca3af' },
  ownGoalNote: { marginHorizontal: 16, marginTop: 8 },
  ownGoalText: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
});
