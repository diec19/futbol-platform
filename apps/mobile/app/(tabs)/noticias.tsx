import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Image, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from '../../components/ui/Card'
import { colors } from '../../theme/colors'

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
}

export default function NoticiasScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['club-news'],
    queryFn: () => api.news.list(),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const news = data?.data ?? []

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {isLoading ? (
          <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
        ) : news.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="newspaper-outline" size={40} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyText}>No hay noticias publicadas</Text>
            <Text style={styles.emptySub}>El club publicará novedades aquí</Text>
          </View>
        ) : (
          news.map((item: any, i: number) => (
            <Card key={item.id} padding={0} style={[styles.newsCard, i === 0 && styles.featured]}>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardTag}>
                  <View style={styles.tagDot} />
                  <Text style={styles.tagText}>Novedad</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                <Text style={styles.cardBodyText}>{item.body}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { padding: 60, alignItems: 'center' },
  empty: { padding: 60, alignItems: 'center', gap: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textTertiary },
  emptySub: { fontSize: 13, color: colors.gray[300] },
  newsCard: { marginBottom: 14, overflow: 'hidden' },
  featured: { borderWidth: 1.5, borderColor: colors.primary },
  cardImage: { width: '100%', height: 180 },
  cardBody: { padding: 16 },
  cardTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tagDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardDate: { fontSize: 12, color: colors.textTertiary, marginBottom: 10 },
  cardBodyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
})
