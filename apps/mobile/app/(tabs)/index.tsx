import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOURNAMENT_STATUS_LABELS } from '../../lib/constants';

const STATUS_BG: Record<string, string> = {
  ACTIVE: '#dcfce7',
  DRAFT: '#f3f4f6',
  FINISHED: '#dbeafe',
  SUSPENDED: '#fef9c3',
};
const STATUS_TEXT: Record<string, string> = {
  ACTIVE: '#15803d',
  DRAFT: '#6b7280',
  FINISHED: '#1d4ed8',
  SUSPENDED: '#a16207',
};

export default function TournamentsTab() {
  const router = useRouter();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.tournaments.list(),
  });

  const tournaments = data?.data ?? [];

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={tournaments}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay torneos activos</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/tournament/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_BG[item.status] ?? '#f3f4f6' }]}>
                <Text style={[styles.badgeText, { color: STATUS_TEXT[item.status] ?? '#6b7280' }]}>
                  {TOURNAMENT_STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            {item.description && (
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            )}
            <Text style={styles.cardMeta}>
              {item.categories?.length ?? 0} categorías
              {item.sponsor ? ` · ${item.sponsor}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  cardDesc: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  cardMeta: { fontSize: 12, color: '#9ca3af' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
