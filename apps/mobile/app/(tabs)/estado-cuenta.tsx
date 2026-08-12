import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, RefreshControl } from 'react-native'
import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { colors } from '../../theme/colors'

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))
}

const SUB_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  PAID: 'success',
  PENDING: 'default',
  LINK_SENT: 'info',
  OVERDUE: 'error',
}

const SUB_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  LINK_SENT: 'Link enviado',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
}

export default function EstadoCuentaScreen() {
  const { logout } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['member-me'],
    queryFn: () => api.members.me(),
    retry: false,
  })

  // Al volver de Mercado Pago (o de cualquier navegación) refresca el estado de cuenta.
  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch])
  )

  const handleLogout = async () => {
    await logout()
    qc.removeQueries({ queryKey: ['member-me'] })
    router.replace('/auth/login')
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error) {
    // Solo sesión expirada/inválida (401) fuerza logout. Un error de red o del server
    // no debe cerrar la sesión: se muestra error con reintentar.
    if ((error as any)?.status === 401) {
      handleLogout()
      return null
    }
    return (
      <View style={styles.errorBox}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.gray[300]} />
        <Text style={styles.errorText}>No se pudo cargar tu estado de cuenta</Text>
        <TouchableOpacity style={styles.errorRetry} onPress={() => refetch()} activeOpacity={0.85}>
          <Text style={styles.errorRetryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const member = data?.data
  const subscriptions: any[] = member?.subscriptions ?? []

  const pendingSubs = subscriptions.filter((s: any) => s.status !== 'PAID')
  const paidSubs = subscriptions.filter((s: any) => s.status === 'PAID')

  const openLink = (url: string) => {
    if (url) Linking.openURL(url)
  }

  const calcTotal = () => {
    return subscriptions.reduce((sum: number, s: any) => sum + (s.totalAmount ?? s.amount ?? 0), 0)
  }

  const calcPaid = () => {
    return paidSubs.reduce((sum: number, s: any) => sum + (s.totalAmount ?? s.amount ?? 0), 0)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
          <Text style={styles.balanceTitle}>Estado de Cuenta</Text>
        </View>
        <Text style={styles.balanceLabel}>Total pagado</Text>
        <Text style={styles.balanceAmount}>${calcPaid().toLocaleString('es-AR')}</Text>
        {pendingSubs.length > 0 && (
          <Text style={styles.balancePending}>${(calcTotal() - calcPaid()).toLocaleString('es-AR')} pendientes</Text>
        )}
      </View>

      {subscriptions.length === 0 && (
        <Card padding={24} style={{ marginHorizontal: 16, marginTop: 16, alignItems: 'center' }}>
          <Ionicons name="card-outline" size={48} color={colors.gray[300]} />
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12 }}>No tenés cuotas registradas</Text>
        </Card>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Historial de Cuotas</Text>
        <Text style={styles.sectionCount}>{subscriptions.length} cuotas</Text>
      </View>

      {subscriptions.map((sub: any) => {
        const monthName = MONTH_NAMES[(sub.month ?? 1) - 1] ?? '---'
        const isPending = sub.status !== 'PAID'

        return (
          <Card key={sub.id} style={styles.subCard}>
            <View style={styles.subRow}>
              <View style={styles.subLeft}>
                <View style={[styles.subDot, { backgroundColor: isPending ? colors.warning : colors.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.subTitle}>{monthName} {sub.year}</Text>
                  <Text style={styles.subDate}>Vence: {formatDate(sub.dueDate)}</Text>
                </View>
              </View>
              <View style={styles.subRight}>
                {sub.lateFee > 0 && isPending && (
                  <Text style={styles.lateFee}>+${sub.lateFee.toLocaleString('es-AR')} recargo</Text>
                )}
                <Text style={[styles.subAmount, isPending && { color: colors.warning }]}>
                  ${(sub.totalAmount ?? sub.amount ?? 0).toLocaleString('es-AR')}
                </Text>
                <Badge label={SUB_LABELS[sub.status] ?? sub.status} variant={SUB_VARIANT[sub.status] ?? 'default'} />
              </View>
            </View>
            {sub.mpPaymentLink && isPending && (
              <TouchableOpacity style={styles.payBtn} onPress={() => openLink(sub.mpPaymentLink)} activeOpacity={0.85}>
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.payBtnText}>Pagar ahora</Text>
              </TouchableOpacity>
            )}
          </Card>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  balanceCard: {
    backgroundColor: colors.primary,
    padding: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  balanceTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  balanceAmount: { fontSize: 36, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF', marginBottom: 4 },
  balancePending: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text },
  sectionCount: { fontSize: 13, color: colors.textTertiary },
  subCard: { marginHorizontal: 16, marginBottom: 10 },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  subDot: { width: 10, height: 10, borderRadius: 5 },
  subTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 2 },
  subDate: { fontSize: 12, color: colors.textSecondary },
  subRight: { alignItems: 'flex-end', gap: 6 },
  subAmount: { fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text },
  lateFee: { fontSize: 11, color: colors.error, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: 12,
    paddingVertical: 12, marginTop: 12,
  },
  payBtnText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background, gap: 12 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  errorRetry: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  errorRetryText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 14 },
})
