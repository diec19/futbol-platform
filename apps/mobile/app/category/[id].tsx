import {
  View, Text, ScrollView, FlatList, ActivityIndicator,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MATCH_STATUS_LABELS, BRACKET_STAGE_LABELS } from '@futbol/constants';

type Tab = 'matches' | 'standings' | 'bracket';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: '#f3f4f6', text: '#6b7280' },
  LIVE: { bg: '#dcfce7', text: '#15803d' },
  FINISHED: { bg: '#dbeafe', text: '#1d4ed8' },
  POSTPONED: { bg: '#fef9c3', text: '#a16207' },
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}

function StandingsTable({ group }: { group: any }) {
  const rows = group.standings ?? group.teams ?? [];
  return (
    <View style={s.tableCard}>
      <Text style={s.groupName}>{group.name}</Text>
      <View style={s.tableHeader}>
        <Text style={[s.hCell, s.teamCol]}>Equipo</Text>
        <Text style={s.hCell}>PJ</Text>
        <Text style={s.hCell}>G</Text>
        <Text style={s.hCell}>E</Text>
        <Text style={s.hCell}>P</Text>
        <Text style={s.hCell}>GF</Text>
        <Text style={s.hCell}>GC</Text>
        <Text style={[s.hCell, s.pts]}>PTS</Text>
      </View>
      {rows.map((gt: any, idx: number) => (
        <View key={gt.teamId ?? gt.id} style={[s.row, idx % 2 === 0 && s.rowAlt]}>
          <View style={[s.cell, s.teamCol]}>
            <Text style={s.pos}>{idx + 1}</Text>
            <Text style={s.teamName} numberOfLines={1}>{gt.team?.name}</Text>
          </View>
          <Text style={s.cell}>{gt.played}</Text>
          <Text style={s.cell}>{gt.won}</Text>
          <Text style={s.cell}>{gt.drawn}</Text>
          <Text style={s.cell}>{gt.lost}</Text>
          <Text style={s.cell}>{gt.goalsFor}</Text>
          <Text style={s.cell}>{gt.goalsAgainst}</Text>
          <Text style={[s.cell, s.pts, s.ptsText]}>{gt.points}</Text>
        </View>
      ))}
    </View>
  );
}

function MatchCard({ match, onPress }: { match: any; onPress: () => void }) {
  const sc = STATUS_COLORS[match.status] ?? STATUS_COLORS.SCHEDULED;
  return (
    <TouchableOpacity style={s.matchCard} onPress={onPress}>
      <View style={s.matchTop}>
        <Text style={s.matchMeta}>{formatDate(match.scheduledAt)}</Text>
        <View style={[s.badge, { backgroundColor: sc.bg }]}>
          <Text style={[s.badgeText, { color: sc.text }]}>
            {MATCH_STATUS_LABELS[match.status] ?? match.status}
          </Text>
        </View>
      </View>
      <View style={s.matchRow}>
        <Text style={s.team} numberOfLines={1}>{match.homeTeam?.name}</Text>
        {match.status === 'FINISHED' ? (
          <Text style={s.score}>{match.homeScore} - {match.awayScore}</Text>
        ) : (
          <Text style={s.vs}>vs</Text>
        )}
        <Text style={[s.team, { textAlign: 'right' }]} numberOfLines={1}>{match.awayTeam?.name}</Text>
      </View>
      {match.venue ? <Text style={s.venue}>{match.venue}</Text> : null}
    </TouchableOpacity>
  );
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('matches');
  const [matchFilter, setMatchFilter] = useState<'upcoming' | 'finished'>('upcoming');

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => api.categories.get(id),
    enabled: !!id,
  });

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', id, matchFilter],
    queryFn: () => api.matches.list({
      categoryId: id,
      status: matchFilter === 'upcoming' ? 'SCHEDULED' : 'FINISHED',
      limit: '30',
    }),
    enabled: tab === 'matches',
  });

  const { data: standingsData, isLoading: standingsLoading } = useQuery({
    queryKey: ['standings', id],
    queryFn: () => api.standings.byCategory(id),
    enabled: tab === 'standings',
  });

  const { data: bracketsData, isLoading: bracketsLoading } = useQuery({
    queryKey: ['brackets', id],
    queryFn: () => api.brackets.byCategory(id),
    enabled: tab === 'bracket',
  });

  const category = catData?.data;
  const matches: any[] = matchesData?.data ?? [];
  const groups: any[] = standingsData?.data ?? [];
  const brackets: any[] = (bracketsData as any)?.data ?? [];

  if (catLoading) {
    return <View style={s.centered}><ActivityIndicator color="#16a34a" size="large" /></View>;
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <Text style={s.title}>{category?.name ?? 'Categoría'}</Text>
        {category?.tournament && (
          <Text style={s.subtitle}>{category.tournament.name}</Text>
        )}
      </View>

      <View style={s.tabBar}>
        {([['matches', 'Partidos'], ['standings', 'Posiciones'], ['bracket', 'Llaves']] as [Tab, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, tab === key && s.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'matches' && (
        <>
          <View style={s.filterRow}>
            {([['upcoming', 'Próximos'], ['finished', 'Jugados']] as const).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[s.filterBtn, matchFilter === key && s.filterBtnActive]}
                onPress={() => setMatchFilter(key)}
              >
                <Text style={[s.filterText, matchFilter === key && s.filterTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {matchesLoading ? (
            <View style={s.centered}><ActivityIndicator color="#16a34a" /></View>
          ) : (
            <FlatList
              data={matches}
              keyExtractor={(m) => m.id}
              contentContainerStyle={s.listContent}
              ListEmptyComponent={<Text style={s.empty}>No hay partidos</Text>}
              renderItem={({ item }) => (
                <MatchCard match={item} onPress={() => router.push(`/match/${item.id}`)} />
              )}
            />
          )}
        </>
      )}

      {tab === 'standings' && (
        <ScrollView contentContainerStyle={s.listContent}>
          {standingsLoading ? (
            <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
          ) : groups.length === 0 ? (
            <Text style={s.empty}>No hay posiciones aún</Text>
          ) : (
            groups.map((g: any) => <StandingsTable key={g.id} group={g} />)
          )}
        </ScrollView>
      )}

      {tab === 'bracket' && (
        bracketsLoading ? (
          <View style={s.centered}><ActivityIndicator color="#16a34a" /></View>
        ) : brackets.length === 0 ? (
          <View style={s.centered}>
            <Text style={s.empty}>No hay llaves para esta categoría</Text>
          </View>
        ) : (
          <ScrollView horizontal>
            <ScrollView>
              <View style={s.bracketRow}>
                {brackets.map((bracket: any) => (
                  <View key={bracket.id} style={s.stageCol}>
                    <Text style={s.stageTitle}>
                      {BRACKET_STAGE_LABELS[bracket.stage] ?? bracket.stage}
                    </Text>
                    <View style={s.bracketMatches}>
                      {(bracket.matches ?? []).map((match: any) => {
                        const isFinished = match.status === 'FINISHED';
                        const homeWon = isFinished && match.homeScore > match.awayScore;
                        const awayWon = isFinished && match.awayScore > match.homeScore;
                        return (
                          <View key={match.id} style={s.slot}>
                            <View style={[s.slotRow, homeWon && s.winner]}>
                              <Text style={[s.slotTeam, homeWon && s.winnerText]} numberOfLines={1}>
                                {match.homeTeam?.name ?? 'Por definir'}
                              </Text>
                              {isFinished && <Text style={[s.slotScore, homeWon && s.winnerText]}>{match.homeScore}</Text>}
                            </View>
                            <View style={s.slotDivider} />
                            <View style={[s.slotRow, awayWon && s.winner]}>
                              <Text style={[s.slotTeam, awayWon && s.winnerText]} numberOfLines={1}>
                                {match.awayTeam?.name ?? 'Por definir'}
                              </Text>
                              {isFinished && <Text style={[s.slotScore, awayWon && s.winnerText]}>{match.awayScore}</Text>}
                            </View>
                          </View>
                        );
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
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 13, color: '#bbf7d0', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#16a34a' },
  tabText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  tabTextActive: { color: '#16a34a', fontWeight: '700' },
  filterRow: { flexDirection: 'row', margin: 12, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#16a34a' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  listContent: { padding: 12, gap: 10 },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 40 },
  matchCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  matchTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  matchMeta: { fontSize: 12, color: '#9ca3af' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  team: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  score: { fontSize: 18, fontWeight: '700', color: '#16a34a', minWidth: 60, textAlign: 'center' },
  vs: { fontSize: 13, color: '#9ca3af', minWidth: 30, textAlign: 'center' },
  venue: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  tableCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 1, marginBottom: 12 },
  groupName: { fontSize: 14, fontWeight: '700', color: '#16a34a', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 6 },
  hCell: { width: 28, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  row: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  rowAlt: { backgroundColor: '#fafafa' },
  cell: { width: 28, textAlign: 'center', fontSize: 12, color: '#374151' },
  teamCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pos: { fontSize: 11, color: '#9ca3af', width: 14 },
  teamName: { fontSize: 13, fontWeight: '500', color: '#111827', flex: 1 },
  pts: { width: 32 },
  ptsText: { fontWeight: '700', color: '#16a34a' },
  bracketRow: { flexDirection: 'row', padding: 16, gap: 16 },
  stageCol: { width: 160 },
  stageTitle: { fontSize: 12, fontWeight: '700', color: '#16a34a', textAlign: 'center', marginBottom: 12 },
  bracketMatches: { gap: 16 },
  slot: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', elevation: 1 },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, paddingHorizontal: 10 },
  winner: { backgroundColor: '#f0fdf4' },
  slotTeam: { fontSize: 12, color: '#374151', flex: 1 },
  winnerText: { fontWeight: '700', color: '#16a34a' },
  slotScore: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 6 },
  slotDivider: { height: 1, backgroundColor: '#e5e7eb' },
});
