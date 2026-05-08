import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'scorers' | 'cards';

export default function StatsTab() {
  const [activeTab, setActiveTab] = useState<Tab>('scorers');
  const { data: tournamentsRes } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.tournaments.list(),
  });
  const tournaments = tournamentsRes?.data ?? [];
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const activeTournament = selectedTournament || tournaments[0]?.id;
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories', activeTournament],
    queryFn: () => api.categories.list(activeTournament),
    enabled: !!activeTournament,
  });
  const categories = categoriesRes?.data ?? [];
  const activeCategory = selectedCategory || categories[0]?.id;

  const { data: scorersRes, isLoading: loadingScorers } = useQuery({
    queryKey: ['scorers', activeCategory],
    queryFn: () => api.statistics.scorers(activeCategory),
    enabled: !!activeCategory && activeTab === 'scorers',
  });

  const { data: cardsRes, isLoading: loadingCards } = useQuery({
    queryKey: ['cards', activeCategory],
    queryFn: () => api.statistics.cards(activeCategory),
    enabled: !!activeCategory && activeTab === 'cards',
  });

  const scorers = scorersRes?.data ?? [];
  const cards = cardsRes?.data ?? [];
  const isLoading = activeTab === 'scorers' ? loadingScorers : loadingCards;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {tournaments.map((t: any) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.filterBtn, activeTournament === t.id && styles.filterBtnActive]}
              onPress={() => { setSelectedTournament(t.id); setSelectedCategory(''); }}
            >
              <Text style={[styles.filterText, activeTournament === t.id && styles.filterTextActive]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {categories.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {categories.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catBtn, activeCategory === c.id && styles.catBtnActive]}
                onPress={() => setSelectedCategory(c.id)}
              >
                <Text style={[styles.catText, activeCategory === c.id && styles.catTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.tabs}>
          {(['scorers', 'cards'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.tabActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'scorers' ? '⚽ Goleadores' : '🟨 Tarjetas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.centered}><ActivityIndicator color="#16a34a" /></View>
        ) : activeTab === 'scorers' ? (
          <View style={styles.content}>
            {scorers.map((s: any, i: number) => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.rank}>{i + 1}</Text>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{s.fullName}</Text>
                  <Text style={styles.teamName}>{s.team?.name}</Text>
                </View>
                <View style={styles.goalsBox}>
                  <Text style={styles.goalsNum}>{s.goals}</Text>
                  <Text style={styles.goalsLabel}>goles</Text>
                </View>
              </View>
            ))}
            {scorers.length === 0 && <Text style={styles.empty}>Sin goles registrados</Text>}
          </View>
        ) : (
          <View style={styles.content}>
            {cards.map((p: any) => (
              <View key={p.id} style={styles.row}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{p.fullName}</Text>
                  <Text style={styles.teamName}>{p.team?.name}</Text>
                </View>
                <View style={styles.cardsRow}>
                  {p.yellow > 0 && (
                    <View style={[styles.cardBadge, { backgroundColor: '#fef08a' }]}>
                      <Text style={styles.cardCount}>{p.yellow}</Text>
                    </View>
                  )}
                  {p.red > 0 && (
                    <View style={[styles.cardBadge, { backgroundColor: '#fca5a5' }]}>
                      <Text style={styles.cardCount}>{p.red}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
            {cards.length === 0 && <Text style={styles.empty}>Sin tarjetas registradas</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { padding: 40, alignItems: 'center' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#e5e7eb', marginRight: 8 },
  filterBtnActive: { backgroundColor: '#16a34a' },
  filterText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  catRow: { paddingHorizontal: 16, paddingBottom: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: '#f3f4f6', marginRight: 6 },
  catBtnActive: { backgroundColor: '#166534' },
  catText: { fontSize: 12, color: '#6b7280' },
  catTextActive: { color: '#fff', fontWeight: '600' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#e5e7eb', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', elevation: 1 },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#111827', fontWeight: '600' },
  content: { paddingHorizontal: 16, gap: 8 },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 40 },
  row: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  rank: { fontSize: 16, fontWeight: '700', color: '#16a34a', width: 28 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  teamName: { fontSize: 12, color: '#9ca3af' },
  goalsBox: { alignItems: 'center' },
  goalsNum: { fontSize: 20, fontWeight: '700', color: '#16a34a' },
  goalsLabel: { fontSize: 10, color: '#9ca3af' },
  cardsRow: { flexDirection: 'row', gap: 6 },
  cardBadge: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cardCount: { fontSize: 14, fontWeight: '700', color: '#374151' },
});
