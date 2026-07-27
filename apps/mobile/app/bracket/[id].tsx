import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/services/api'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { BRACKET_STAGE_LABELS } from '../../lib/constants'

function MatchSlot({ match }: { match: any }) {
  const isFinished = match.status === 'FINISHED'
  const homeWon = isFinished && match.homeScore > match.awayScore
  const awayWon = isFinished && match.awayScore > match.homeScore

  return (
    <View style={styles.slot}>
      <View style={[styles.slotRow, homeWon && styles.winnerRow]}>
        <View style={styles.slotDot} />
        <Text style={[styles.teamName, homeWon && styles.winnerText]} numberOfLines={1}>{match.homeTeam?.name ?? 'Por definir'}</Text>
        {isFinished && <Text style={[styles.scoreText, homeWon && styles.winnerText]}>{match.homeScore}</Text>}
      </View>
      <View style={styles.divider} />
      <View style={[styles.slotRow, awayWon && styles.winnerRow]}>
        <View style={styles.slotDot} />
        <Text style={[styles.teamName, awayWon && styles.winnerText]} numberOfLines={1}>{match.awayTeam?.name ?? 'Por definir'}</Text>
        {isFinished && <Text style={[styles.scoreText, awayWon && styles.winnerText]}>{match.awayScore}</Text>}
      </View>
    </View>
  )
}

export default function BracketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['brackets', id], queryFn: () => api.brackets.byCategory(id), enabled: !!id,
  })

  const brackets = data?.data ?? []

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  if (brackets.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIcon}>
          <Ionicons name="git-branch-outline" size={40} color={colors.gray[300]} />
        </View>
        <Text style={styles.empty}>No hay llaves definidas para esta categoría</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView horizontal>
        <ScrollView>
          <View style={styles.bracketRow}>
            {brackets.map((bracket: any) => (
              <View key={bracket.id} style={styles.stageCol}>
                <View style={styles.stageHeader}>
                  <Text style={styles.stageTitle}>{BRACKET_STAGE_LABELS[bracket.stage] ?? bracket.stage}</Text>
                </View>
                <View style={{ gap: 16 }}>
                  {bracket.matches.map((match: any) => (
                    <MatchSlot key={match.id} match={match} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  empty: { color: colors.textTertiary, textAlign: 'center', fontSize: 14, paddingHorizontal: 40 },
  bracketRow: { flexDirection: 'row', padding: 16, gap: 16 },
  stageCol: { width: 160 },
  stageHeader: { backgroundColor: colors.primary, borderRadius: 10, padding: 8, marginBottom: 12 },
  stageTitle: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  slot: { backgroundColor: colors.surface, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  slotRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
  winnerRow: { backgroundColor: colors.green[50] },
  slotDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gray[300] },
  teamName: { fontSize: 12, color: colors.text, flex: 1 },
  winnerText: { fontWeight: '700', color: colors.green[700] },
  scoreText: { fontSize: 14, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
})
