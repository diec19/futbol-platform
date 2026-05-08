import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Linking, Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const SUB_COLORS = {
  PENDING:   { bg: '#F1F5F9', text: '#64748B', label: 'Pendiente' },
  LINK_SENT: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Link enviado' },
  PAID:      { bg: '#DCFCE7', text: '#16A34A', label: '✓ Pagada' },
  OVERDUE:   { bg: '#FEE2E2', text: '#DC2626', label: 'Vencida' },
};

function getPlayerStats(player: any) {
  const events = player.events ?? [];
  return {
    goals: events.filter((e: any) => e.type === 'GOAL').length,
    yellow: events.filter((e: any) => e.type === 'YELLOW_CARD').length,
    red: events.filter((e: any) => ['RED_CARD', 'DOUBLE_YELLOW'].includes(e.type)).length,
  };
}

// ── Login screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.members.login(username, password);
      await AsyncStorage.setItem('member_token', res.data.accessToken);
      await AsyncStorage.setItem('member_data', JSON.stringify(res.data.member));
      onLogin();
    } catch (e: any) {
      setError(e.message ?? 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <View style={styles.loginCard}>
        {/* Logo */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.loginTitle}>Área de Socios</Text>
        <Text style={styles.loginSubtitle}>Accedé con tu usuario y contraseña</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="tu.usuario"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.loginBtnText}>Ingresar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Member dashboard ──────────────────────────────────────────────────────────
function MemberDashboard({ onLogout }: { onLogout: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['member-me'],
    queryFn: () => api.members.me(),
    retry: false,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#DC2626" size="large" />
      </View>
    );
  }

  if (error) {
    onLogout();
    return null;
  }

  const member = data?.data;
  const now = new Date();
  const currentSub = member?.subscriptions?.[0];
  const subCfg = currentSub ? SUB_COLORS[currentSub.status as keyof typeof SUB_COLORS] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{member?.fullName?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerGreeting}>Hola, {member?.fullName?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerSub}>@{member?.username}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Cuota actual */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          📅 Cuota {MONTH_NAMES[(currentSub?.month ?? now.getMonth() + 1) - 1]} {currentSub?.year ?? now.getFullYear()}
        </Text>
        {currentSub ? (
          <View style={[styles.subCard, { backgroundColor: subCfg?.bg ?? '#F1F5F9' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.subStatus, { color: subCfg?.text }]}>{subCfg?.label}</Text>
              <Text style={styles.subAmount}>${currentSub.amount.toLocaleString('es-AR')}</Text>
            </View>
            <Text style={styles.subDue}>Vence: {new Date(currentSub.dueDate).toLocaleDateString('es-AR')}</Text>
            {currentSub.mpPaymentLink && currentSub.status !== 'PAID' && (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => Linking.openURL(currentSub.mpPaymentLink)}
              >
                <Text style={styles.payBtnText}>💳 Pagar ahora</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.subCard}>
            <Text style={{ color: '#94A3B8', fontSize: 14 }}>No hay cuota generada este mes</Text>
          </View>
        )}
      </View>

      {/* Hijos */}
      {member?.players?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚽ Mis hijos en el club</Text>
          <View style={styles.playersGrid}>
            {member.players.map((mp: any) => {
              const p = mp.player;
              const stats = getPlayerStats(p);
              return (
                <View key={mp.id} style={styles.playerCard}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>{p.fullName[0]}</Text>
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>{p.fullName}</Text>
                  <Text style={styles.playerCategory} numberOfLines={1}>
                    {p.team?.category?.name ?? ''}
                  </Text>
                  {p.shirtNumber ? (
                    <Text style={styles.playerNumber}>#{p.shirtNumber}</Text>
                  ) : null}
                  <View style={styles.playerStats}>
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
              );
            })}
          </View>
        </View>
      )}

      {/* Sin hijos */}
      {member?.players?.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚽ Mis hijos en el club</Text>
          <View style={[styles.subCard, { alignItems: 'center' }]}>
            <Text style={{ color: '#94A3B8', fontSize: 14 }}>No hay jugadores vinculados a tu cuenta</Text>
            <Text style={{ color: '#CBD5E1', fontSize: 12, marginTop: 4 }}>Contactá al club para vincular a tus hijos</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AccountScreen() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const qc = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('member_token').then(setToken);
    }, [])
  );

  const handleLogin = () => {
    AsyncStorage.getItem('member_token').then(setToken);
    qc.invalidateQueries({ queryKey: ['member-me'] });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('member_token');
    await AsyncStorage.removeItem('member_data');
    qc.removeQueries({ queryKey: ['member-me'] });
    setToken(null);
  };

  if (token === undefined) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#DC2626" /></View>;
  }

  return token
    ? <MemberDashboard onLogout={handleLogout} />
    : <LoginScreen onLogin={handleLogin} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  // Login
  loginContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loginCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center' },
  logo: { width: 88, height: 88, borderRadius: 44, marginBottom: 20 },
  loginTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  loginSubtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 24, textAlign: 'center' },
  inputGroup: { width: '100%', marginBottom: 14 },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 10, padding: 12, color: '#FFFFFF', fontSize: 15 },
  errorText: { color: '#F87171', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  loginBtn: { width: '100%', backgroundColor: '#DC2626', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4 },
  loginBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  // Dashboard
  header: { backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  headerGreeting: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  headerSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1E293B', borderRadius: 8 },
  logoutText: { color: '#94A3B8', fontSize: 13 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  subCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  subStatus: { fontSize: 15, fontWeight: '700' },
  subAmount: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  subDue: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  payBtn: { marginTop: 12, backgroundColor: '#1D4ED8', borderRadius: 10, padding: 12, alignItems: 'center' },
  payBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  playersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  playerCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', width: '47%', alignItems: 'center' },
  playerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  playerAvatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 20 },
  playerName: { fontSize: 13, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  playerCategory: { fontSize: 11, color: '#DC2626', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  playerNumber: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  playerStats: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statItem: { fontSize: 12, color: '#475569' },
  sanctionBadge: { marginTop: 6, backgroundColor: '#FEF2F2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sanctionText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
});
