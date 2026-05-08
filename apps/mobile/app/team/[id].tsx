import {
  View, Text, ScrollView, FlatList, ActivityIndicator,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { POSITION_LABELS, MATCH_STATUS_LABELS } from '@futbol/constants';

type Tab = 'roster' | 'matches';

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

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('roster');

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => api.teams.get(id),
    enabled: !!id,
  });

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['team-matches', id],
    queryFn: () => api.matches.list({ teamId: id, limit: '20' }),
    enabled: tab === 'matches',
  });

  const team = teamData?.data;
  const players: any[] = team?.players ?? [];
  const matches: any[] = matchesData?.data ?? [];

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator color="#16a34a" size="large" /></View>;
  }

  if (!team) {
    return <View style={s.centered}><Text style={s.empty}>Equipo no encontrado</Text></View>;
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <View style={s.shield}>
          <Text style={s.shieldText}>{team.name[0]?.toUpperCase()}</Text>
        </View>
        <Text style={s.title}>{team.name}</Text>
        {team.category && (
          <Text style={s.subtitle}>
            {team.category.name}
            {team.category.tournament ? ` · ${team.category.tournament.name}` : ''}
          </Text>
        )}
        {team.delegateName && (
          <Text style={s.delegate}>Delegado: {team.delegateName}</Text>
        )}
      </View>

      <View style={s.tabBar}>
        {([['roster', `Plantel (${players.length})`], ['matches', 'Partidos']] as [Tab, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, tab === key && s.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'roster' && (
        players.length === 0 ? (
          <View style={s.centered}>
            <Text style={s.empty}>Sin jugadores registrados</Text>
          </View>
        ) : (
          <FlatList
            data={players}
            keyExtractor={(p) => p.id}
            contentContainerStyle={s.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.playerRow}
                onPress={() => router.push(`/player/${item.id}`)}
              >
                <View style={s.shirt}>
                  <Text style={s.shirtNum}>{item.shirtNumber ?? '—'}</Text>
                </View>
                <View style={s.playerInfo}>
                  <Text style={s.playerName}>{item.fullName}</Text>
                  {item.position && (
                    <Text style={s.playerPos}>
                      {POSITION_LABELS[item.position] ?? item.position}
                    </Text>
                  )}
                </View>
                <Text style={s.arrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        )
      )}

      {tab === 'matches' && (
        matchesLoading ? (
          <View style={s.centered}><ActivityIndicator color="#16a34a" /></View>
        ) : matches.length === 0 ? (
          <View style={s.centered}><Text style={s.empty}>Sin partidos</Text></View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(m) => m.id}
            contentContainerStyle={s.list}
            renderItem={({ item }) => {
              const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.SCHEDULED;
              const isHome = item.homeTeamId === id;
              return (
                <TouchableOpacity
                  style={s.matchCard}
                  onPress={() => router.push(`/match/${item.id}`)}
                >
                  <View style={s.matchTop}>
                    <Text style={s.matchMeta}>{formatDate(item.scheduledAt)}</Text>
                    <View style={[s.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[s.badgeText, { color: sc.text }]}>
                        {MATCH_STATUS_LABELS[item.status] ?? item.status}
                      </Text>
                    </View>
                  </View>
                  <View style={s.matchRow}>
                    <Text style={[s.teamText, isHome && s.myTeam]} numberOfLines={1}>
                      {item.homeTeam?.name}
                    </Text>
                    {item.status === 'FINISHED' ? (
                      <Text style={s.score}>{item.homeScore} - {item.awayScore}</Text>
                    ) : (
                      <Text style={s.vs}>vs</Text>
                    )}
                    <Text style={[s.teamText, { textAlign: 'right' }, !isHome && s.myTeam]} numberOfLines={1}>
                      {item.awayTeam?.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 20, alignItems: 'center' },
  shield: { width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  shieldText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#bbf7d0', marginTop: 2 },
  delegate: { fontSize: 12, color: '#86efac', marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#16a34a' },
  tabText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  tabTextActive: { color: '#16a34a', fontWeight: '700' },
  list: { padding: 12, gap: 8 },
  empty: { color: '#9ca3af', fontSize: 14 },
  playerRow: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  shirt: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  shirtNum: { fontSize: 14, fontWeight: '700', color: '#374151' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  playerPos: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  arrow: { fontSize: 20, color: '#d1d5db' },
  matchCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  matchTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  matchMeta: { fontSize: 12, color: '#9ca3af' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#374151' },
  myTeam: { fontWeight: '700', color: '#111827' },
  score: { fontSize: 18, fontWeight: '700', color: '#16a34a', minWidth: 60, textAlign: 'center' },
  vs: { fontSize: 13, color: '#9ca3af', minWidth: 30, textAlign: 'center' },
});
