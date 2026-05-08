import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
}

export default function FixturesTab() {
  const [filter, setFilter] = useState<'upcoming' | 'finished'>('upcoming');
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['matches', filter],
    queryFn: () =>
      api.matches.list({
        status: filter === 'upcoming' ? 'SCHEDULED' : 'FINISHED',
        limit: '30',
      }),
  });

  const matches = data?.data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filterRow}>
        {(['upcoming', 'finished'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'upcoming' ? 'Próximos' : 'Jugados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color="#16a34a" /></View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay partidos</Text>}
          renderItem={({ item }) => {
            const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.SCHEDULED;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/match/${item.id}`)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.meta}>{formatDate(item.scheduledAt)}</Text>
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>
                      {MATCH_STATUS_LABELS[item.status] ?? item.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.matchRow}>
                  <Text style={styles.teamName} numberOfLines={1}>{item.homeTeam?.name}</Text>
                  {item.status === 'FINISHED' ? (
                    <Text style={styles.score}>{item.homeScore} - {item.awayScore}</Text>
                  ) : (
                    <Text style={styles.vs}>vs</Text>
                  )}
                  <Text style={[styles.teamName, styles.teamRight]} numberOfLines={1}>{item.awayTeam?.name}</Text>
                </View>
                {item.venue && <Text style={styles.venue}>{item.venue}</Text>}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', margin: 16, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#16a34a' },
  filterText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  meta: { fontSize: 12, color: '#9ca3af' },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  teamRight: { textAlign: 'right' },
  score: { fontSize: 18, fontWeight: '700', color: '#16a34a', minWidth: 60, textAlign: 'center' },
  vs: { fontSize: 13, color: '#9ca3af', minWidth: 30, textAlign: 'center' },
  venue: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '600' },
});
