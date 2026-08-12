import { View, Text, ScrollView, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { colors } from '../../theme/colors'
import { MATCH_STATUS_LABELS, BRACKET_STAGE_LABELS } from '../../lib/constants'

type Tab = 'matches' | 'standings' | 'bracket'

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'default' | 'warning'> = {
  SCHEDULED: 'info',
  LIVE: 'success',
  FINISHED: 'default',
  POSTPONED: 'warning',
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

function StandingsTable({ group }: { group: any }) {
  const rows = group.standings ?? group.teams ?? []
  return (
    <Card padding={0} style={{ marginBottom: 12, overflow: 'hidden' }}>
      <Text style={styles.groupName}>{group.name}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.hCell, styles.teamCol]}>Equipo</Text>
        <Text style={styles.hCell}>PJ</Text><Text style={styles.hCell}>G</Text><Text style={styles.hCell}>E</Text>
        <Text style={styles.hCell}>P</Text><Text style={styles.hCell}>GF</Text><Text style={styles.hCell}>GC</Text>
        <Text style={[styles.hCell, styles.ptsHeader]}>PTS</Text>
      </View>
      {rows.map((gt: any, idx: number) => (
        <View key={gt.teamId ?? gt.id} style={[styles.row, idx % 2 === 0 && styles.rowAlt]}>
          <View style={[styles.cell, styles.teamCol]}>
            <Text style={styles.pos}>{idx + 1}</Text>
            <Text style={styles.teamName} numberOfLines={1}>{gt.team?.name}</Text>
          </View>
          <Text style={styles.cell}>{gt.played}</Text>
          <Text style={styles.cell}>{gt.won}</Text>
          <Text style={styles.cell}>{gt.drawn}</Text>
          <Text style={styles.cell}>{gt.lost}</Text>
          <Text style={styles.cell}>{gt.goalsFor}</Text>
          <Text style={styles.cell}>{gt.goalsAgainst}</Text>
          <Text style={[styles.cell, styles.ptsCell]}>{gt.points}</Text>
        </View>
      ))}
    </Card>
  )
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('matches')
  const [matchFilter, setMatchFilter] = useState<'upcoming' | 'finished'>('upcoming')

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['category', id], queryFn: () => api.categories.get(id), enabled: !!id,
  })
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', id, matchFilter],
    queryFn: () => api.matches.list({ categoryId: id, status: matchFilter === 'upcoming' ? 'SCHEDULED' : 'FINISHED', limit: '30' }),
    enabled: tab === 'matches',
  })
  const { data: standingsData, isLoading: standingsLoading } = useQuery({
    queryKey: ['standings', id], queryFn: () => api.standings.byCategory(id), enabled: tab === 'standings',
  })
  const { data: bracketsData, isLoading: bracketsLoading } = useQuery({
    queryKey: ['brackets', id], queryFn: () => api.brackets.byCategory(id), enabled: tab === 'bracket',
  })

  const category = catData?.data
  const matches = matchesData?.data ?? []
  const groups = standingsData?.data ?? []
  const brackets = (bracketsData as any)?.data ?? []

  if (catLoading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="layers" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{category?.name ?? 'Categoría'}</Text>
        {category?.tournament && <Text style={styles.subtitle}>{category.tournament.name}</Text>}
      </View>

      <View style={styles.tabBar}>
        {([['matches', 'Partidos', 'football'], ['standings', 'Posiciones', 'list'], ['bracket', 'Llaves', 'git-branch-outline']] as [Tab, string, keyof typeof Ionicons.glyphMap][]).map(([key, label, icon]) => (
          <TouchableOpacity key={key} style={[styles.tabBtn, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
            <Ionicons name={icon} size={16} color={tab === key ? colors.primary : colors.tabInactive} />
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'matches' && (
        <>
          <View style={styles.filterRow}>
            {(['upcoming', 'finished'] as const).map((key) => (
              <TouchableOpacity key={key} style={[styles.filterBtn, matchFilter === key && styles.filterActive]} onPress={() => setMatchFilter(key)}>
                <Text style={[styles.filterText, matchFilter === key && styles.filterTextActive]}>{key === 'upcoming' ? 'Próximos' : 'Jugados'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {matchesLoading ? (
            <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
          ) : (
            <FlatList
              data={matches}
              keyExtractor={(m) => m.id}
              contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 10 }}
              ListEmptyComponent={<Text style={styles.empty}>No hay partidos</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => router.push(`/match/${item.id}`)} activeOpacity={0.7}>
                  <Card style={{ padding: 14 }}>
                    <View style={styles.matchTop}>
                      <Text style={styles.matchMeta}>{formatDate(item.scheduledAt)}</Text>
                      <Badge label={MATCH_STATUS_LABELS[item.status] ?? item.status} variant={STATUS_VARIANT[item.status] ?? 'default'} />
                    </View>
                    <View style={styles.matchRow}>
                      <Text style={styles.team} numberOfLines={1}>{item.homeTeam?.name}</Text>
                      {item.status === 'FINISHED' ? (
                        <Text style={styles.score}>{item.homeScore} - {item.awayScore}</Text>
                      ) : (
                        <Text style={styles.vs}>vs</Text>
                      )}
                      <Text style={[styles.team, { textAlign: 'right' }]} numberOfLines={1}>{item.awayTeam?.name}</Text>
                    </View>
                    {item.venue ? <Text style={styles.venue}>{item.venue}</Text> : null}
                  </Card>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {tab === 'standings' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {standingsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : groups.length === 0 ? (
            <Text style={styles.empty}>No hay posiciones aún</Text>
          ) : (
            groups.map((g: any) => <StandingsTable key={g.id} group={g} />)
          )}
        </ScrollView>
      )}

      {tab === 'bracket' && (
        bracketsLoading ? (
          <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
        ) : brackets.length === 0 ? (
          <View style={styles.centered}><Text style={styles.empty}>No hay llaves para esta categoría</Text></View>
        ) : (
          <ScrollView horizontal>
            <ScrollView>
              <View style={styles.bracketRow}>
                {brackets.map((bracket: any) => (
                  <View key={bracket.id} style={styles.stageCol}>
                    <Text style={styles.stageTitle}>{BRACKET_STAGE_LABELS[bracket.stage] ?? bracket.stage}</Text>
                    <View style={{ gap: 16 }}>
                      {(bracket.matches ?? []).map((match: any) => {
                        const isFinished = match.status === 'FINISHED'
                        const homeWon = isFinished && match.homeScore > match.awayScore
                        const awayWon = isFinished && match.awayScore > match.homeScore
                        return (
                          <View key={match.id} style={styles.slot}>
                            <View style={[styles.slotRow, homeWon && styles.winner]}>
                              <Text style={[styles.slotTeam, homeWon && styles.winnerText]} numberOfLines={1}>{match.homeTeam?.name ?? 'Por definir'}</Text>
                              {isFinished && <Text style={[styles.slotScore, homeWon && styles.winnerText]}>{match.homeScore}</Text>}
                            </View>
                            <View style={styles.slotDivider} />
                            <View style={[styles.slotRow, awayWon && styles.winner]}>
                              <Text style={[styles.slotTeam, awayWon && styles.winnerText]} numberOfLines={1}>{match.awayTeam?.name ?? 'Por definir'}</Text>
                              {isFinished && <Text style={[styles.slotScore, awayWon && styles.winnerText]}>{match.awayScore}</Text>}
                            </View>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </ScrollView>
        )
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 0 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FFFFFF', marginBottom: 2 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, paddingVertical: 8, gap: 4, paddingHorizontal: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: colors.blue[50] },
  tabText: { fontSize: 13, color: colors.textTertiary, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  tabTextActive: { color: colors.primary, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  filterRow: { flexDirection: 'row', margin: 16, marginBottom: 8, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: colors.gray[100], alignItems: 'center' },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  filterTextActive: { color: '#FFFFFF' },
  empty: { textAlign: 'center', color: colors.textTertiary, padding: 60 },
  matchTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  matchMeta: { fontSize: 12, color: colors.textTertiary },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  team: { flex: 1, fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text },
  score: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.primary, minWidth: 60, textAlign: 'center' },
  vs: { fontSize: 13, color: colors.textTertiary, minWidth: 30, textAlign: 'center' },
  venue: { fontSize: 11, color: colors.textTertiary, marginTop: 6 },
  groupName: { fontSize: 14, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.primary, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.gray[50], paddingHorizontal: 10, paddingVertical: 8 },
  hCell: { width: 28, textAlign: 'center', fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.textTertiary },
  row: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  rowAlt: { backgroundColor: colors.gray[50] },
  cell: { width: 28, textAlign: 'center', fontSize: 12, color: colors.text },
  teamCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pos: { fontSize: 11, color: colors.textTertiary, width: 14 },
  teamName: { fontSize: 13, fontWeight: '500', fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1 },
  ptsHeader: { width: 32 },
  ptsCell: { width: 32, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.primary },
  bracketRow: { flexDirection: 'row', padding: 16, gap: 16 },
  stageCol: { width: 160 },
  stageTitle: { fontSize: 12, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.primary, textAlign: 'center', marginBottom: 12 },
  slot: { backgroundColor: colors.surface, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, paddingHorizontal: 10 },
  winner: { backgroundColor: colors.green[50] },
  slotTeam: { fontSize: 12, color: colors.text, flex: 1 },
  winnerText: { fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.green[700] },
  slotScore: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text, marginLeft: 6 },
  slotDivider: { height: 1, backgroundColor: colors.border },
})
