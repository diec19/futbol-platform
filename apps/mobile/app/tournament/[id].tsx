import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TournamentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.tournaments.get(id),
    enabled: !!id,
  });

  const tournament = data?.data;

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color="#16a34a" size="large" /></View>;
  }

  if (!tournament) {
    return <View style={styles.centered}><Text>Torneo no encontrado</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{tournament.name}</Text>
          {tournament.description && (
            <Text style={styles.description}>{tournament.description}</Text>
          )}
          {tournament.sponsor && (
            <Text style={styles.sponsor}>Sponsor: {tournament.sponsor}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          {tournament.categories?.map((cat: any) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => router.push(`/category/${cat.id}`)}
            >
              <View>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catMeta}>{cat.teams?.length ?? 0} equipos</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#16a34a', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  description: { fontSize: 14, color: '#bbf7d0', marginBottom: 4 },
  sponsor: { fontSize: 12, color: '#86efac' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  categoryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04,
  },
  catName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  catMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  arrow: { fontSize: 20, color: '#9ca3af' },
});
