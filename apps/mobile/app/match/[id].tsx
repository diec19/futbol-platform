import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import PlayerAvatar from '../../components/PlayerAvatar'
import GradientHeader from '../../components/ui/GradientHeader'
import { colors } from '../../theme/colors'
import { MATCH_STATUS_LABELS } from '../../lib/constants'

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'default' | 'warning' | 'error'> = {
  SCHEDULED: 'info', LIVE: 'success', FINISHED: 'default', POSTPONED: 'warning', CANCELLED: 'error',
}

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  GOAL: 'football', OWN_GOAL: 'football',
  YELLOW_CARD: 'warning', RED_CARD: 'remove-circle',
  DOUBLE_YELLOW: 'warning', MVP: 'star',
}

const EVENT_LABELS: Record<string, string> = {
  GOAL: 'Gol', OWN_GOAL: 'Gol en contra', YELLOW_CARD: 'Amarilla',
  RED_CARD: 'Roja', DOUBLE_YELLOW: 'Doble amarilla', MVP: 'MVP',
}

const EVENT_COLORS: Record<string, string> = {
  GOAL: colors.success, OWN_GOAL: colors.warning,
  YELLOW_CARD: colors.warning, RED_CARD: colors.error,
  DOUBLE_YELLOW: colors.error, MVP: '#8B5CF6',
}

function formatDateTime(d: string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['match', id], queryFn: () => api.matches.get(id), enabled: !!id,
  })

  const match = data?.data

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  if (!match) {
    return <View style={styles.centered}><Text style={{ color: colors.textSecondary }}>Partido no encontrado</Text></View>
  }

  const isFinished = match.status === 'FINISHED'
  const events: any[] = match.events ?? []
  const homeEvents = events.filter((e: any) => e.teamId === match.homeTeamId)
  const awayEvents = events.filter((e: any) => e.teamId === match.awayTeamId)
  const hasEvents = events.length > 0
  const homeGoals = events.filter((e: any) => e.type === 'GOAL' && e.teamId === match.homeTeamId)
  const awayGoals = events.filter((e: any) => e.type === 'GOAL' && e.teamId === match.awayTeamId)

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <GradientHeader style={styles.header}>
          <Badge label={MATCH_STATUS_LABELS[match.status] ?? match.status} variant={STATUS_VARIANT[match.status] ?? 'default'} />
          <View style={styles.scoreRow}>
            <View style={styles.teamBlock}>
              <View style={styles.teamCircle}><Text style={styles.teamInitial}>{match.homeTeam?.name[0]?.toUpperCase()}</Text></View>
              <Text style={styles.teamLabel} numberOfLines={2}>{match.homeTeam?.name}</Text>
            </View>
            <View style={styles.scoreBlock}>
              {isFinished ? (
                <Text style={styles.score}>
                  <Text style={match.homeScore > match.awayScore ? styles.winnerScore : styles.loserScore}>{match.homeScore}</Text>
                  <Text style={styles.scoreDash}> - </Text>
                  <Text style={match.awayScore > match.homeScore ? styles.winnerScore : styles.loserScore}>{match.awayScore}</Text>
                </Text>
              ) : (
                <Text style={styles.vs}>vs</Text>
              )}
            </View>
            <View style={styles.teamBlock}>
              <View style={styles.teamCircle}><Text style={styles.teamInitial}>{match.awayTeam?.name[0]?.toUpperCase()}</Text></View>
              <Text style={[styles.teamLabel, { textAlign: 'right' }]} numberOfLines={2}>{match.awayTeam?.name}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{formatDateTime(match.scheduledAt)}</Text>
          <View style={styles.metaRow}>
            {match.venue && <><Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" /><Text style={styles.metaText}> {match.venue}</Text></>}
            {match.referee && <><Ionicons name="flag-outline" size={12} color="rgba(255,255,255,0.7)" /><Text style={styles.metaText}> {match.referee.fullName}</Text></>}
          </View>
          {match.group && <Text style={styles.groupText}>{match.group.name}{match.round ? ` · Fecha ${match.round}` : ''}</Text>}
        </GradientHeader>

        {isFinished && (homeGoals.length > 0 || awayGoals.length > 0) && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Goles</Text>
            <Card style={{ padding: 14 }}>
              <View style={styles.goalsRow}>
                <View style={{ flex: 1, gap: 6 }}>
                  {homeGoals.map((e: any) => (
                    <Text key={e.id} style={styles.goalItem}><Ionicons name="football" size={14} color={colors.success} /> {e.player?.fullName ?? 'Jugador'}{e.minute != null ? ` ${e.minute}'` : ''}</Text>
                  ))}
                </View>
                <View style={styles.goalsDivider} />
                <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
                  {awayGoals.map((e: any) => (
                    <Text key={e.id} style={styles.goalItem}>{e.player?.fullName ?? 'Jugador'}{e.minute != null ? ` ${e.minute}'` : ''} <Ionicons name="football" size={14} color={colors.success} /></Text>
                  ))}
                </View>
              </View>
            </Card>
          </View>
        )}

        {hasEvents && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Eventos del partido</Text>
            <Card padding={8}>
              {events.map((event: any) => {
                const isHome = event.teamId === match.homeTeamId
                const color = EVENT_COLORS[event.type] ?? colors.textSecondary
                return (
                  <View key={event.id} style={[styles.eventRow, isHome ? styles.eventLeft : styles.eventRight]}>
                    {isHome ? (
                      <>
                        <PlayerAvatar photoUrl={event.player?.photoUrl} name={event.player?.fullName ?? ''} size={28} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.eventPlayer} numberOfLines={1}>{event.player?.fullName ?? '—'}</Text>
                          <Text style={[styles.eventTypeLabel, { color }]}>{EVENT_LABELS[event.type] ?? event.type}</Text>
                        </View>
                        <View style={styles.eventMinBox}><Text style={styles.eventMin}>{event.minute != null ? `${event.minute}'` : '—'}</Text></View>
                        <Ionicons name={EVENT_ICONS[event.type] ?? 'ellipse'} size={18} color={color} />
                        <View style={{ width: 24 }} />
                      </>
                    ) : (
                      <>
                        <View style={{ width: 24 }} />
                        <Ionicons name={EVENT_ICONS[event.type] ?? 'ellipse'} size={18} color={color} />
                        <View style={styles.eventMinBox}><Text style={styles.eventMin}>{event.minute != null ? `${event.minute}'` : '—'}</Text></View>
                        <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 8 }}>
                          <Text style={[styles.eventPlayer, { textAlign: 'right' }]} numberOfLines={1}>{event.player?.fullName ?? '—'}</Text>
                          <Text style={[styles.eventTypeLabel, { textAlign: 'right', color }]}>{EVENT_LABELS[event.type] ?? event.type}</Text>
                        </View>
                        <PlayerAvatar photoUrl={event.player?.photoUrl} name={event.player?.fullName ?? ''} size={28} />
                      </>
                    )}
                  </View>
                )
              })}
            </Card>
          </View>
        )}

        {match.notes && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Card padding={14}>
              <Text style={styles.notesText}>{match.notes}</Text>
            </Card>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.primary, padding: 20, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 16, gap: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 8 },
  teamBlock: { flex: 1, alignItems: 'center', gap: 8 },
  teamCircle: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  teamInitial: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  teamLabel: { fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', textAlign: 'center' },
  scoreBlock: { paddingHorizontal: 16 },
  score: { fontSize: 32, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', letterSpacing: 2 },
  winnerScore: { color: '#FFFFFF' },
  loserScore: { color: 'rgba(255,255,255,0.5)' },
  scoreDash: { color: 'rgba(255,255,255,0.7)' },
  vs: { fontSize: 20, color: 'rgba(255,255,255,0.7)', fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  dateText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textTransform: 'capitalize', marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  groupText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  sectionTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 10 },
  goalsRow: { flexDirection: 'row' },
  goalsDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 12 },
  goalItem: { fontSize: 13, color: colors.text, marginBottom: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, gap: 6 },
  eventLeft: {}, eventRight: {},
  eventPlayer: { fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text },
  eventTypeLabel: { fontSize: 11, marginTop: 1 },
  eventMinBox: { backgroundColor: colors.gray[100], borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  eventMin: { fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text },
  notesText: { fontSize: 13, color: colors.text, lineHeight: 20 },
})
