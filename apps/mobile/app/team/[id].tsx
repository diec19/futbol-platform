import { View, Text, ScrollView, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import PlayerAvatar from '../../components/PlayerAvatar'
import GradientHeader from '../../components/ui/GradientHeader'
import { colors } from '../../theme/colors'
import { POSITION_LABELS, MATCH_STATUS_LABELS } from '../../lib/constants'

type Tab = 'roster' | 'matches'

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'default' | 'warning'> = {
  SCHEDULED: 'info', LIVE: 'success', FINISHED: 'default', POSTPONED: 'warning',
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('roster')

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team', id], queryFn: () => api.teams.get(id), enabled: !!id,
  })
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['team-matches', id], queryFn: () => api.matches.list({ teamId: id, limit: '20' }), enabled: tab === 'matches',
  })

  const team = teamData?.data
  const players = team?.players ?? []
  const matches = matchesData?.data ?? []

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  if (!team) {
    return <View style={styles.centered}><Text style={{ color: colors.textSecondary }}>Equipo no encontrado</Text></View>
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader style={styles.header}>
        <View style={styles.shield}>
          <Text style={styles.shieldText}>{team.name[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{team.name}</Text>
        {team.category && (
          <Text style={styles.subtitle}>
            {team.category.name}{team.category.tournament ? ` · ${team.category.tournament.name}` : ''}
          </Text>
        )}
        {team.delegateName && (
          <View style={styles.delegateRow}>
            <Ionicons name="person-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.delegate}>{team.delegateName}</Text>
          </View>
        )}
      </GradientHeader>

      <View style={styles.tabBar}>
        {([['roster', 'people', `Plantel (${players.length})`], ['matches', 'football', 'Partidos']] as [Tab, keyof typeof Ionicons.glyphMap, string][]).map(([key, icon, label]) => (
          <TouchableOpacity key={key} style={[styles.tabBtn, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
            <Ionicons name={icon} size={16} color={tab === key ? colors.primary : colors.tabInactive} />
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'roster' && (
        players.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={48} color={colors.gray[300]} />
            <Text style={{ color: colors.textTertiary, marginTop: 8 }}>Sin jugadores registrados</Text>
          </View>
        ) : (
          <FlatList
            data={players}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => router.push(`/player/${item.id}`)} activeOpacity={0.7}>
                <Card style={{ padding: 12 }}>
                  <View style={styles.playerRow}>
                    <PlayerAvatar photoUrl={item.photoUrl} name={item.fullName} size={40} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.playerName}>{item.fullName}</Text>
                      {item.position && <Text style={styles.playerPos}>{POSITION_LABELS[item.position] ?? item.position}</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.gray[300]} />
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          />
        )
      )}

      {tab === 'matches' && (
        matchesLoading ? (
          <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
        ) : matches.length === 0 ? (
          <View style={styles.centered}><Text style={{ color: colors.textTertiary }}>Sin partidos</Text></View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => {
              const isHome = item.homeTeamId === id
              return (
                <TouchableOpacity onPress={() => router.push(`/match/${item.id}`)} activeOpacity={0.7}>
                  <Card style={{ padding: 14 }}>
                    <View style={styles.matchTop}>
                      <Text style={styles.matchMeta}>{formatDate(item.scheduledAt)}</Text>
                      <Badge label={MATCH_STATUS_LABELS[item.status] ?? item.status} variant={STATUS_VARIANT[item.status] ?? 'default'} />
                    </View>
                    <View style={styles.matchRow}>
                      <Text style={[styles.teamText, isHome && styles.myTeam]} numberOfLines={1}>{item.homeTeam?.name}</Text>
                      {item.status === 'FINISHED' ? (
                        <Text style={styles.score}>{item.homeScore} - {item.awayScore}</Text>
                      ) : (
                        <Text style={styles.vs}>vs</Text>
                      )}
                      <Text style={[styles.teamText, { textAlign: 'right' }, !isHome && styles.myTeam]} numberOfLines={1}>{item.awayTeam?.name}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              )
            }}
          />
        )
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 20, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 0 },
  shield: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  shieldText: { fontSize: 24, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  title: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 2 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  delegateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  delegate: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, paddingVertical: 8, gap: 4, paddingHorizontal: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: colors.blue[50] },
  tabText: { fontSize: 13, color: colors.textTertiary, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  tabTextActive: { color: colors.primary, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  playerRow: { flexDirection: 'row', alignItems: 'center' },
  playerName: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text },
  playerPos: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  matchTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  matchMeta: { fontSize: 12, color: colors.textTertiary },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamText: { flex: 1, fontSize: 14, fontWeight: '500', fontFamily: 'Poppins_500Medium', color: colors.text },
  myTeam: { fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text },
  score: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.primary, minWidth: 60, textAlign: 'center' },
  vs: { fontSize: 13, color: colors.textTertiary, minWidth: 30, textAlign: 'center' },
})
