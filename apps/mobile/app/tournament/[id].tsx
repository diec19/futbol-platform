import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { colors } from '../../theme/colors'

export default function TournamentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.tournaments.get(id),
    enabled: !!id,
  })

  const tournament = data?.data

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  if (!tournament) {
    return <View style={styles.centered}><Text style={{ color: colors.textSecondary }}>Torneo no encontrado</Text></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="trophy" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{tournament.name}</Text>
        {tournament.description && <Text style={styles.description}>{tournament.description}</Text>}
        <View style={styles.headerMeta}>
          <Badge label={tournament.status === 'ACTIVE' ? 'Activo' : tournament.status} variant="success" />
          {tournament.sponsor && (
            <View style={styles.sponsorRow}>
              <Ionicons name="star" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.sponsor}>{tournament.sponsor}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorías</Text>
        {tournament.categories?.map((cat: any) => (
          <TouchableOpacity key={cat.id} onPress={() => router.push(`/category/${cat.id}`)} activeOpacity={0.7}>
            <Card style={styles.catCard}>
              <View style={styles.catRow}>
                <View style={styles.catIcon}>
                  <Ionicons name="layers" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catMeta}>{cat.teams?.length ?? 0} equipos</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray[300]} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
        {(!tournament.categories || tournament.categories.length === 0) && (
          <Card padding={24} style={{ alignItems: 'center' }}>
            <Ionicons name="layers-outline" size={40} color={colors.gray[300]} />
            <Text style={{ color: colors.textTertiary, marginTop: 8 }}>Sin categorías</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primary,
    padding: 24,
    paddingTop: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
  },
  headerIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  description: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sponsorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sponsor: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  catCard: { marginBottom: 10 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blue[50], alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '600', color: colors.text },
  catMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
})
