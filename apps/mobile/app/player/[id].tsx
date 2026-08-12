import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from '../../components/ui/Card'
import PlayerAvatar from '../../components/PlayerAvatar'
import { colors } from '../../theme/colors'
import { POSITION_LABELS } from '../../lib/constants'
import { getPlayerStats } from '../../lib/stats'

const EVENT_LABELS: Record<string, string> = {
  GOAL: 'Gol', OWN_GOAL: 'Gol en contra',
  YELLOW_CARD: 'Tarjeta amarilla', RED_CARD: 'Tarjeta roja',
  DOUBLE_YELLOW: 'Doble amarilla', MVP: 'MVP',
}

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  GOAL: 'football', OWN_GOAL: 'football', YELLOW_CARD: 'warning', RED_CARD: 'remove-circle',
  DOUBLE_YELLOW: 'warning', MVP: 'star',
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['player', id], queryFn: () => api.players.get(id), enabled: !!id,
  })

  const player = data?.data

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  if (!player) {
    return <View style={styles.centered}><Text style={{ color: colors.textSecondary }}>Jugador no encontrado</Text></View>
  }

  const events: any[] = player.events ?? []
  const sanctions: any[] = player.sanctions ?? []
  const pendingSanctions = sanctions.filter((s: any) => !s.resolved)

  const { goals, ownGoals, yellow, red, mvp } = getPlayerStats(player)

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <PlayerAvatar photoUrl={player.photoUrl} name={player.fullName} size={72} style={styles.avatar} />
          <Text style={styles.name}>{player.fullName}</Text>
          {player.shirtNumber && <Text style={styles.shirt}>#{player.shirtNumber}</Text>}
          <Text style={styles.teamName}>{player.team?.name}</Text>
          {player.position && (
            <View style={styles.posBadge}>
              <Text style={styles.posText}>{POSITION_LABELS[player.position] ?? player.position}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
            <Ionicons name="football" size={20} color={colors.success} />
            <Text style={styles.statNumber}>{goals}</Text>
            <Text style={styles.statLabel}>Goles</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text style={styles.statNumber}>{yellow}</Text>
            <Text style={styles.statLabel}>Amarillas</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.error }]}>
            <Ionicons name="remove-circle" size={20} color={colors.error} />
            <Text style={styles.statNumber}>{red}</Text>
            <Text style={styles.statLabel}>Rojas</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
            <Ionicons name="star" size={20} color="#8B5CF6" />
            <Text style={styles.statNumber}>{mvp}</Text>
            <Text style={styles.statLabel}>MVP</Text>
          </View>
        </View>

        <Card padding={0} style={{ marginHorizontal: 16, marginBottom: 16, overflow: 'hidden' }}>
          {[
            ['DNI', player.dni],
            ['Fecha de nac.', player.birthDate ? `${formatDate(player.birthDate)} (${calcAge(player.birthDate)} años)` : null],
            ['Categoría', player.team?.category?.name],
            ['Torneo', player.team?.category?.tournament?.name],
          ].filter(([, v]) => v).map(([label, value], i) => (
            <View key={label as string} style={[styles.infoRow, i === 0 && { borderTopWidth: 0 }]}>
              <Text style={styles.infoLabel}>{label as string}</Text>
              <Text style={styles.infoValue}>{value as string}</Text>
            </View>
          ))}
        </Card>

        {pendingSanctions.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Sanciones activas</Text>
            {pendingSanctions.map((sanction: any) => (
              <Card key={sanction.id} padding={12} style={{ borderLeftWidth: 3, borderLeftColor: colors.error, marginBottom: 8 }}>
                <Text style={styles.sanctionType}>{sanction.type?.replace(/_/g, ' ')}</Text>
                {sanction.matchesBan > 0 && <Text style={styles.sanctionDetail}>{sanction.matchesBan} fechas de suspensión</Text>}
                {sanction.reason && <Text style={styles.sanctionReason}>{sanction.reason}</Text>}
              </Card>
            ))}
          </View>
        )}

        {events.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Historial de eventos</Text>
            <Card padding={0} style={{ overflow: 'hidden' }}>
              {events.slice(0, 20).map((event: any) => (
                <View key={event.id} style={styles.eventRow}>
                  <Ionicons name={EVENT_ICONS[event.type] ?? 'ellipse'} size={16} color={colors.textSecondary} />
                  <Text style={styles.eventType}>{EVENT_LABELS[event.type] ?? event.type}</Text>
                  {event.minute != null && <Text style={styles.eventMin}>{event.minute}'</Text>}
                  <Text style={styles.eventDate}>{event.match?.scheduledAt ? formatDate(event.match.scheduledAt) : ''}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {ownGoals > 0 && (
          <Text style={styles.ownGoalNote}>Incluye {ownGoals} gol{ownGoals > 1 ? 'es' : ''} en contra</Text>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.primary, paddingVertical: 24, alignItems: 'center', paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 16 },
  avatar: { marginBottom: 8, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 36 },
  name: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FFFFFF', textAlign: 'center' },
  shirt: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  teamName: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  posBadge: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  posText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 10, alignItems: 'center', borderLeftWidth: 3 },
  statNumber: { fontSize: 20, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  infoLabel: { fontSize: 13, color: colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '500', fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 10 },
  sanctionType: { fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.error },
  sanctionDetail: { fontSize: 12, color: colors.error, marginTop: 2 },
  sanctionReason: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  eventType: { fontSize: 13, color: colors.text, flex: 1 },
  eventMin: { fontSize: 12, color: colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  eventDate: { fontSize: 11, color: colors.textTertiary },
  ownGoalNote: { marginHorizontal: 16, fontSize: 11, color: colors.textTertiary, textAlign: 'center' },
})
