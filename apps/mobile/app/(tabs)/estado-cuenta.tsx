import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useAuth } from '../../services/auth';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));
}

const SUB_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: '#F1F5F9', text: '#64748B', label: 'Pendiente' },
  LINK_SENT: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Link enviado' },
  PAID:      { bg: '#DCFCE7', text: '#16A34A', label: '✓ Pagada' },
  OVERDUE:   { bg: '#FEE2E2', text: '#DC2626', label: 'Vencida' },
};

export default function EstadoCuentaScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['member-me'],
    queryFn: () => api.members.me(),
    retry: false,
  });

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
  const subscriptions: any[] = member?.subscriptions ?? [];
  const pendingSub = subscriptions.find((s: any) => s.status !== 'PAID');
  const paidSubs = subscriptions.filter((s: any) => s.status === 'PAID');

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

      <Text style={styles.pageTitle}>Estado de Cuenta</Text>

      {pendingSub && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Cuota pendiente</Text>
          <View style={[styles.subHighlight, { borderLeftColor: pendingSub.status === 'OVERDUE' ? '#DC2626' : '#1D4ED8' }]}>
            <View style={styles.subHighlightTop}>
              <Text style={styles.subMonth}>
                {MONTH_NAMES[pendingSub.month - 1]} {pendingSub.year}
              </Text>
              <Text style={styles.subAmount}>${pendingSub.amount.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.subStatusRow}>
              <View style={[styles.subBadge, { backgroundColor: SUB_COLORS[pendingSub.status as keyof typeof SUB_COLORS]?.bg }]}>
                <Text style={[styles.subBadgeText, { color: SUB_COLORS[pendingSub.status as keyof typeof SUB_COLORS]?.text }]}>
                  {SUB_COLORS[pendingSub.status as keyof typeof SUB_COLORS]?.label}
                </Text>
              </View>
              <Text style={styles.subDue}>Vence: {formatDate(pendingSub.dueDate)}</Text>
            </View>
            {pendingSub.mpPaymentLink && (
              <TouchableOpacity style={styles.payBtn} onPress={() => Linking.openURL(pendingSub.mpPaymentLink)}>
                <Text style={styles.payBtnText}>💳 Pagar ahora</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {subscriptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Historial de cuotas</Text>
          <View style={styles.historyCard}>
            {subscriptions.map((sub: any) => {
              const cfg = SUB_COLORS[sub.status as keyof typeof SUB_COLORS];
              return (
                <View key={sub.id} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: cfg?.text ?? '#94A3B8' }]} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyMonth}>
                      {MONTH_NAMES[sub.month - 1]} {sub.year}
                    </Text>
                    {sub.paidAt && (
                      <Text style={styles.historyPaid}>Pagado el {formatDate(sub.paidAt)}</Text>
                    )}
                  </View>
                  <Text style={[styles.historyStatus, { color: cfg?.text }]}>{cfg?.label}</Text>
                  <Text style={styles.historyAmount}>${sub.amount.toLocaleString('es-AR')}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {subscriptions.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Cuotas</Text>
          <View style={styles.subCard}>
            <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center' }}>
              No hay cuotas generadas. El club generará tu primera cuota pronto.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
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
  subCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  subHighlight: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4,
  },
  subHighlightTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subMonth: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  subAmount: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  subStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  subBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  subBadgeText: { fontSize: 11, fontWeight: '600' },
  subDue: { fontSize: 12, color: '#94A3B8' },
  payBtn: { marginTop: 12, backgroundColor: '#1D4ED8', borderRadius: 10, padding: 12, alignItems: 'center' },
  payBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  historyInfo: { flex: 1 },
  historyMonth: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  historyPaid: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  historyStatus: { fontSize: 12, fontWeight: '600', marginRight: 10 },
  historyAmount: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
});
