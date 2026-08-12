import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { colors } from '../../theme/colors'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  SCHEDULED: 'info',
  LIVE: 'success',
  FINISHED: 'default',
  POSTPONED: 'warning',
  CANCELLED: 'error',
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado',
  LIVE: 'EN VIVO',
  FINISHED: 'Finalizado',
  POSTPONED: 'Postergado',
  CANCELLED: 'Cancelado',
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return {
    date: new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(d),
    time: new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(d),
  }
}

export default function FixturesScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'finished'>('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.matches.list({}),
  })

  const matches = (data?.data ?? []).filter((m: any) => {
    if (filter === 'upcoming') return m.status === 'SCHEDULED'
    if (filter === 'finished') return m.status === 'FINISHED'
    return true
  })

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filters}>
      {['all', 'upcoming', 'finished'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todos' : f === 'upcoming' ? 'Próximos' : 'Finalizados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No hay partidos</Text>
          </View>
        }
        renderItem={({ item }) => {
          const dt = formatDateTime(item.date ?? item.startDate)
          const isLive = item.status === 'LIVE'

          return (
            <TouchableOpacity onPress={() => router.push(`/match/${item.id}`)} activeOpacity={0.7}>
              <Card style={styles.matchCard}>
                {isLive && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>EN VIVO</Text>
                  </View>
                )}
                <View style={styles.matchHeader}>
                  <Text style={styles.matchDate}>{dt.date}</Text>
                  <Badge label={STATUS_LABELS[item.status] ?? item.status} variant={STATUS_VARIANT[item.status] ?? 'default'} />
                </View>
                <View style={styles.matchTeams}>
                  <View style={styles.teamCol}>
                    <View style={styles.teamIcon}>
                      <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.teamName} numberOfLines={1}>{item.homeTeam?.name ?? 'Local'}</Text>
                  </View>
                  <View style={styles.scoreCol}>
                    {item.status === 'FINISHED' || item.status === 'LIVE' ? (
                      <View style={styles.scoreBox}>
                        <Text style={styles.scoreText}>{item.homeScore ?? '-'}</Text>
                        <Text style={styles.scoreDivider}>-</Text>
                        <Text style={styles.scoreText}>{item.awayScore ?? '-'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.matchTime}>{dt.time}</Text>
                    )}
                  </View>
                  <View style={styles.teamCol}>
                    <View style={styles.teamIcon}>
                      <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.teamName} numberOfLines={1}>{item.awayTeam?.name ?? 'Visitante'}</Text>
                  </View>
                </View>
                {item.venue && (
                  <View style={styles.matchFooter}>
                    <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                    <Text style={styles.matchVenue}>{item.venue}</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 8 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.gray[100] },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  filterTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingTop: 8 },
  emptyBox: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 14, color: colors.textTertiary },
  matchCard: { marginBottom: 12, padding: 16, position: 'relative' },
  liveBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.error, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  liveText: { fontSize: 10, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  matchDate: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  matchTeams: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamCol: { flex: 1, alignItems: 'center', gap: 6 },
  teamIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  teamName: { fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text, textAlign: 'center' },
  scoreCol: { alignItems: 'center', minWidth: 60 },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontSize: 22, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: colors.text },
  scoreDivider: { fontSize: 18, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.textTertiary },
  matchTime: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.primary },
  matchFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 },
  matchVenue: { fontSize: 11, color: colors.textTertiary },
})
