import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Image, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d));
}

export default function NoticiasScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['club-news'],
    queryFn: () => api.news.list(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const news = data?.data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
      >
        {isLoading ? (
          <View style={styles.centered}><ActivityIndicator color="#16a34a" /></View>
        ) : news.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>No hay noticias publicadas</Text>
            <Text style={styles.emptySub}>El club publicará novedades aquí</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {news.map((item: any) => (
              <View key={item.id} style={styles.card}>
                {item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                  <Text style={styles.cardBodyText}>{item.body}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { padding: 60, alignItems: 'center' },
  empty: { padding: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9ca3af' },
  emptySub: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2 },
  cardImage: { width: '100%', height: 180 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#94a3b8', marginBottom: 10 },
  cardBodyText: { fontSize: 14, color: '#475569', lineHeight: 20 },
});
