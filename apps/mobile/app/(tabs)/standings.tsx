import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

function StandingsTable({ group }: { group: any }) {
  const router = useRouter();
  return (
    <View style={styles.tableCard}>
      <Text style={styles.groupName}>{group.name}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.teamCol]}>Equipo</Text>
        <Text style={styles.headerCell}>PJ</Text>
        <Text style={styles.headerCell}>G</Text>
        <Text style={styles.headerCell}>E</Text>
        <Text style={styles.headerCell}>P</Text>
        <Text style={styles.headerCell}>GF</Text>
        <Text style={styles.headerCell}>GC</Text>
        <Text style={[styles.headerCell, styles.pointsCol]}>PTS</Text>
      </View>
      {group.teams.map((gt: any, idx: number) => (
        <TouchableOpacity
          key={gt.id}
          style={[styles.row, idx % 2 === 0 && styles.rowAlt]}
          onPress={() => router.push(`/team/${gt.teamId}`)}
        >
          <View style={[styles.cell, styles.teamCol]}>
            <Text style={styles.position}>{idx + 1}</Text>
            <Text style={styles.teamName} numberOfLines={1}>{gt.team?.name}</Text>
          </View>
          <Text style={styles.cell}>{gt.played}</Text>
          <Text style={styles.cell}>{gt.won}</Text>
          <Text style={styles.cell}>{gt.drawn}</Text>
          <Text style={styles.cell}>{gt.lost}</Text>
          <Text style={styles.cell}>{gt.goalsFor}</Text>
          <Text style={styles.cell}>{gt.goalsAgainst}</Text>
          <Text style={[styles.cell, styles.pointsCol, styles.pointsText]}>{gt.points}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function StandingsTab() {
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

  const { data: standingsRes, isLoading } = useQuery({
    queryKey: ['standings', activeCategory],
    queryFn: () => api.standings.byCategory(activeCategory),
    enabled: !!activeCategory,
  });
  const groups = standingsRes?.data ?? [];

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
              <Text style={[styles.filterText, activeTournament === t.id && styles.filterTextActive]}>
                {t.name}
              </Text>
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
                <Text style={[styles.catText, activeCategory === c.id && styles.catTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {isLoading ? (
          <View style={styles.centered}><ActivityIndicator color="#16a34a" /></View>
        ) : groups.length === 0 ? (
          <Text style={styles.empty}>No hay posiciones para esta categoría</Text>
        ) : (
          <View style={styles.content}>
            {groups.map((g: any) => <StandingsTable key={g.id} group={g} />)}
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
  content: { padding: 16, gap: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 40 },
  tableCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 1 },
  groupName: { fontSize: 14, fontWeight: '700', color: '#16a34a', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 6 },
  headerCell: { width: 28, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  row: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  rowAlt: { backgroundColor: '#fafafa' },
  cell: { width: 28, textAlign: 'center', fontSize: 12, color: '#374151' },
  teamCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  position: { fontSize: 11, color: '#9ca3af', width: 14 },
  teamName: { fontSize: 13, fontWeight: '500', color: '#111827', flex: 1 },
  pointsCol: { width: 32 },
  pointsText: { fontWeight: '700', color: '#16a34a' },
});
