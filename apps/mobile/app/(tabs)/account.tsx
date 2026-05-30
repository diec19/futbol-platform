import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useAuth } from '../../services/auth';
import PlayerAvatar from '../../components/PlayerAvatar';

function getPlayerStats(player: any) {
  const events = player.events ?? [];
  return {
    goals: events.filter((e: any) => e.type === 'GOAL').length,
    yellow: events.filter((e: any) => e.type === 'YELLOW_CARD').length,
    red: events.filter((e: any) => ['RED_CARD', 'DOUBLE_YELLOW'].includes(e.type)).length,
  };
}

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: 'Arquero',
  DEFENDER: 'Defensor',
  MIDFIELDER: 'Mediocampista',
  FORWARD: 'Delantero',
};

function PlayerSummaryModal({
  player,
  visible,
  onClose,
}: {
  player: any;
  visible: boolean;
  onClose: () => void;
}) {
  if (!player) return null;
  const stats = getPlayerStats(player);
  const age = calcAge(player.birthDate);
  const team = player.team;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>

          <PlayerAvatar photoUrl={player.photoUrl} name={player.fullName} size={100} style={styles.modalAvatar} />
          <Text style={styles.modalName}>{player.fullName}</Text>

          <View style={styles.modalInfoGrid}>
            {player.position && (
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Posición</Text>
                <Text style={styles.modalInfoValue}>{POSITION_LABELS[player.position] ?? player.position}</Text>
              </View>
            )}
            <View style={styles.modalInfoItem}>
              <Text style={styles.modalInfoLabel}>Edad</Text>
              <Text style={styles.modalInfoValue}>{age} años</Text>
            </View>
            {player.shirtNumber && (
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>Camiseta</Text>
                <Text style={styles.modalInfoValue}>#{player.shirtNumber}</Text>
              </View>
            )}
            <View style={styles.modalInfoItem}>
              <Text style={styles.modalInfoLabel}>Goles</Text>
              <Text style={styles.modalInfoValue}>{stats.goals}</Text>
            </View>
            <View style={styles.modalInfoItem}>
              <Text style={styles.modalInfoLabel}>Amarillas</Text>
              <Text style={styles.modalInfoValue}>{stats.yellow}</Text>
            </View>
            <View style={styles.modalInfoItem}>
              <Text style={styles.modalInfoLabel}>Rojas</Text>
              <Text style={styles.modalInfoValue}>{stats.red}</Text>
            </View>
          </View>

          {team && (
            <View style={styles.modalTeamSection}>
              <Text style={styles.modalTeamLabel}>Equipo</Text>
              <Text style={styles.modalTeamValue}>{team.name}</Text>
              {team.category && (
                <Text style={styles.modalCategoryValue}>{team.category.name}</Text>
              )}
            </View>
          )}

          {player.sanctions?.length > 0 && (
            <View style={styles.modalSanctions}>
              <Text style={styles.modalSanctionsTitle}>⚠️ Sanciones ({player.sanctions.length})</Text>
              {player.sanctions.map((s: any, i: number) => (
                <Text key={i} style={styles.modalSanctionItem}>{s.description ?? s.reason}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function MemberDashboard() {
  const { logout } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['member-me'],
    queryFn: () => api.members.me(),
    retry: false,
  });
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const handleLogout = async () => {
    await logout();
    qc.removeQueries({ queryKey: ['member-me'] });
    router.replace('/auth/login');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#DC2626" size="large" />
      </View>
    );
  }

  if (error) {
    handleLogout();
    return null;
  }

  const member = data?.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{member?.fullName?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerGreeting}>Hola, {member?.fullName?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerSub}>@{member?.username}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.pageTitle}>Mi Cuenta</Text>

      {member?.players?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚽ Mis jugadores</Text>
          {member.players.map((mp: any) => {
            const p = mp.player;
            const stats = getPlayerStats(p);
            return (
              <TouchableOpacity key={mp.id} style={styles.playerCard} onPress={() => setSelectedPlayer(p)} activeOpacity={0.7}>
                <PlayerAvatar photoUrl={p.photoUrl} name={p.fullName} size={72} style={styles.playerAvatar} />
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{p.fullName}</Text>
                  {p.clubCategory?.name && (
                    <Text style={styles.playerCategory}>📋 {p.clubCategory.name}</Text>
                  )}
                  {p.clubCategory?.coach && (
                    <Text style={styles.playerCoach}>👨‍🏫 {p.clubCategory.coach}</Text>
                  )}
                  {p.dominantFoot && (
                    <Text style={styles.playerFoot}>🦶 {p.dominantFoot === 'LEFT' ? 'Pierna izquierda' : 'Pierna derecha'}</Text>
                  )}
                  {p.team?.category?.name && (
                    <Text style={styles.playerTeam}>⚽ {p.team.category.name}</Text>
                  )}
                  {p.shirtNumber && (
                    <Text style={styles.playerNumber}>#{p.shirtNumber}</Text>
                  )}
                  <View style={styles.playerStatsRow}>
                    <Text style={styles.statItem}>⚽ {stats.goals}</Text>
                    <Text style={styles.statItem}>🟨 {stats.yellow}</Text>
                    <Text style={styles.statItem}>🟥 {stats.red}</Text>
                  </View>
                  {p.sanctions?.length > 0 && (
                    <View style={styles.sanctionBadge}>
                      <Text style={styles.sanctionText}>⚠️ {p.sanctions.length} sanción</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {member?.players?.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚽ Mis jugadores</Text>
          <View style={styles.emptyCard}>
            <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center' }}>No hay jugadores vinculados a tu cuenta</Text>
            <Text style={{ color: '#CBD5E1', fontSize: 12, marginTop: 4, textAlign: 'center' }}>Contactá al club para vincular a tus hijos</Text>
          </View>
        </View>
      )}

      <PlayerSummaryModal player={selectedPlayer} visible={!!selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </ScrollView>
  );
}

export default function AccountScreen() {
  return <MemberDashboard />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  headerGreeting: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  headerSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1E293B', borderRadius: 8 },
  logoutText: { color: '#94A3B8', fontSize: 13 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', paddingHorizontal: 16, paddingTop: 20 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  playerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  playerAvatar: { marginRight: 14 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  playerCategory: { fontSize: 13, color: '#DC2626', fontWeight: '600', marginTop: 2 },
  playerCoach: { fontSize: 12, color: '#16a34a', fontWeight: '500', marginTop: 1 },
  playerFoot: { fontSize: 12, color: '#64748B', marginTop: 1 },
  playerTeam: { fontSize: 12, color: '#64748B', marginTop: 1 },
  playerNumber: { fontSize: 13, color: '#64748B', marginTop: 2 },
  playerStatsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  statItem: { fontSize: 13, color: '#475569' },
  sanctionBadge: { marginTop: 6, backgroundColor: '#FEF2F2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  sanctionText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  chevron: { fontSize: 24, color: '#CBD5E1', marginLeft: 8 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, alignItems: 'center', maxHeight: '85%',
  },
  modalClose: { alignSelf: 'flex-end', padding: 4 },
  modalCloseText: { fontSize: 20, color: '#94A3B8', fontWeight: '700' },
  modalAvatar: { marginBottom: 12, marginTop: 4 },
  modalName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  modalInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 16 },
  modalInfoItem: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, minWidth: 80, alignItems: 'center' },
  modalInfoLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  modalInfoValue: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  modalTeamSection: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  modalTeamLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  modalTeamValue: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  modalCategoryValue: { fontSize: 13, color: '#DC2626', fontWeight: '600', marginTop: 2 },
  modalSanctions: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, width: '100%' },
  modalSanctionsTitle: { fontSize: 13, fontWeight: '700', color: '#DC2626', marginBottom: 6 },
  modalSanctionItem: { fontSize: 12, color: '#991B1B', marginBottom: 2 },
});
