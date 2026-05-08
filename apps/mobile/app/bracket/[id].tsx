import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRACKET_STAGE_LABELS } from '@futbol/constants';

function MatchSlot({ match }: { match: any }) {
  const isFinished = match.status === 'FINISHED';
  const homeWon = isFinished && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.awayScore > match.homeScore;

  return (
    <View style={styles.matchSlot}>
      <View style={[styles.teamRow, homeWon && styles.winnerRow]}>
        <Text style={[styles.teamName, homeWon && styles.winnerText]} numberOfLines={1}>
          {match.homeTeam?.name ?? 'Por definir'}
        </Text>
        {isFinished && <Text style={[styles.scoreText, homeWon && styles.winnerText]}>{match.homeScore}</Text>}
      </View>
      <View style={styles.divider} />
      <View style={[styles.teamRow, awayWon && styles.winnerRow]}>
        <Text style={[styles.teamName, awayWon && styles.winnerText]} numberOfLines={1}>
          {match.awayTeam?.name ?? 'Por definir'}
        </Text>
        {isFinished && <Text style={[styles.scoreText, awayWon && styles.winnerText]}>{match.awayScore}</Text>}
      </View>
    </View>
  );
}

export default function BracketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['brackets', id],
    queryFn: () => api.brackets.byCategory(id),
    enabled: !!id,
  });

  const brackets = data?.data ?? [];

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color="#16a34a" size="large" /></View>;
  }

  if (brackets.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>No hay llaves definidas para esta categoría</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView horizontal>
        <ScrollView>
          <View style={styles.bracketRow}>
            {brackets.map((bracket: any) => (
              <View key={bracket.id} style={styles.stageCol}>
                <Text style={styles.stageTitle}>
                  {BRACKET_STAGE_LABELS[bracket.stage] ?? bracket.stage}
                </Text>
                <View style={styles.matches}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  empty: { color: '#9ca3af', textAlign: 'center' },
  bracketRow: { flexDirection: 'row', padding: 16, gap: 16 },
  stageCol: { width: 160 },
  stageTitle: { fontSize: 13, fontWeight: '700', color: '#16a34a', textAlign: 'center', marginBottom: 12 },
  matches: { gap: 16 },
  matchSlot: {
    backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e5e7eb',
    elevation: 1,
  },
  teamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, paddingHorizontal: 10 },
  winnerRow: { backgroundColor: '#f0fdf4' },
  teamName: { fontSize: 12, color: '#374151', flex: 1 },
  winnerText: { fontWeight: '700', color: '#16a34a' },
  scoreText: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#e5e7eb' },
});
