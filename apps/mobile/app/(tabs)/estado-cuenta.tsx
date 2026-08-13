import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, RefreshControl } from 'react-native'
import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import Card from '../../components/ui/Card'
import { colors } from '../../theme/colors'

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))
}

const SUB_LABELS: Record<string, string> = {
  PAID: 'Pagada',
  PENDING: 'Pendiente',
  LINK_SENT: 'Link enviado',
  OVERDUE: 'Vencida',
}

const SUB_COLORS: Record<string, string> = {
  PAID: colors.success,
  PENDING: colors.warning,
  LINK_SENT: colors.accent,
  OVERDUE: colors.error,
}

const SUB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  PAID: 'checkmark-circle',
  PENDING: 'time',
  LINK_SENT: 'send',
  OVERDUE: 'alert-circle',
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

  // Cuotas del socio + cuotas de cada jugador vinculado (los hijos).
  const playerSubs: any[] = (member?.players ?? []).flatMap((mp: any) =>
    (mp.player?.subscriptions ?? []).map((s: any) => ({
      ...s,
      _ownerName: mp.player?.fullName,
      _ownerIsPlayer: true,
    }))
  )
  const allSubs = [
    ...subscriptions.map((s: any) => ({ ...s, _ownerName: 'Socio', _ownerIsPlayer: false })),
    ...playerSubs,
  ]

  const pendingSubs = allSubs.filter((s: any) => s.status !== 'PAID')
  const paidSubs = allSubs.filter((s: any) => s.status === 'PAID')
  const hasDebt = pendingSubs.length > 0

  const calcTotal = () => {
    return allSubs.reduce((sum: number, s: any) => sum + (s.totalAmount ?? s.amount ?? 0), 0)
  }
  const calcPaid = () => {
    return paidSubs.reduce((sum: number, s: any) => sum + (s.totalAmount ?? s.amount ?? 0), 0)
  }
  const debtAmount = calcTotal() - calcPaid()

  const openLink = (url: string) => {
    if (url) Linking.openURL(url)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}>
      {/* Estado principal: al día o deudor */}
      <View style={[styles.statusCard, { backgroundColor: hasDebt ? colors.error : colors.success }]}>
        <View style={styles.statusIcon}>
          <Ionicons name={hasDebt ? 'alert-circle' : 'checkmark-circle'} size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.statusLabel}>{hasDebt ? 'Tenés cuotas impagas' : 'Estás al día'}</Text>
        {hasDebt ? (
          <>
            <Text style={styles.statusAmount}>${debtAmount.toLocaleString('es-AR')}</Text>
            <Text style={styles.statusHint}>Debés {pendingSubs.length} cuota{pendingSubs.length > 1 ? 's' : ''}</Text>
          </>
        ) : (
          <Text style={styles.statusHint}>No tenés deudas pendientes con el club</Text>
        )}
      </View>

      {/* CTA: pagar si debe */}
      {hasDebt && (
        <TouchableOpacity style={styles.payAllBtn} onPress={() => {
          const firstPending = pendingSubs.find((s: any) => s.mpPaymentLink)
          if (firstPending?.mpPaymentLink) openLink(firstPending.mpPaymentLink)
        }} activeOpacity={0.85}>
          <Ionicons name="card" size={18} color="#FFFFFF" />
          <Text style={styles.payAllText}>Pagar mis cuotas pendientes</Text>
        </TouchableOpacity>
      )}

      {allSubs.length === 0 && (
        <Card padding={24} style={{ marginHorizontal: 16, marginTop: 16, alignItems: 'center' }}>
          <Ionicons name="card-outline" size={48} color={colors.gray[300]} />
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12 }}>No tenés cuotas registradas</Text>
        </Card>
      )}

      {/* Lista de cuotas */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis cuotas</Text>
        <Text style={styles.sectionCount}>{allSubs.length}</Text>
      </View>

      {allSubs.map((sub: any) => {
        const monthName = MONTH_NAMES[(sub.month ?? 1) - 1] ?? '---'
        const isPaid = sub.status === 'PAID'
        const color = SUB_COLORS[sub.status] ?? colors.textTertiary
        const icon = SUB_ICONS[sub.status] ?? 'ellipse'
        const ownerLabel = sub._ownerIsPlayer ? sub._ownerName : 'Cuota de socio'

        return (
          <Card key={sub.id} style={[styles.subCard, !isPaid && styles.subCardPending]}>
            <View style={styles.subRow}>
              <View style={[styles.subIcon, { backgroundColor: color + '1A' }]}>
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <View style={styles.subInfo}>
                <Text style={styles.subOwner}>{ownerLabel}</Text>
                <Text style={styles.subTitle}>{monthName} {sub.year}</Text>
                <Text style={styles.subDate}>
                  {isPaid
                    ? `Pagada el ${sub.paidAt ? formatDate(sub.paidAt) : '—'}`
                    : `Vence: ${formatDate(sub.dueDate)}`}
                </Text>
                {sub.lateFee > 0 && !isPaid && (
                  <Text style={styles.lateFee}>+${sub.lateFee.toLocaleString('es-AR')} recargo</Text>
                )}
              </View>
              <View style={styles.subRight}>
                <Text style={[styles.subAmount, !isPaid && { color }]}>
                  ${(sub.totalAmount ?? sub.amount ?? 0).toLocaleString('es-AR')}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: color + '1A' }]}>
                  <Text style={[styles.statusBadgeText, { color }]}>{SUB_LABELS[sub.status] ?? sub.status}</Text>
                </View>
              </View>
            </View>
            {sub.mpPaymentLink && !isPaid && (
              <TouchableOpacity style={styles.payBtn} onPress={() => openLink(sub.mpPaymentLink)} activeOpacity={0.85}>
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.payBtnText}>Pagar {monthName}</Text>
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
  statusCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  statusIcon: { marginBottom: 10 },
  statusLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600', fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1 },
  statusAmount: { fontSize: 40, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF', marginTop: 2 },
  statusHint: { fontSize: 14, color: 'rgba(255,255,255,0.95)', fontFamily: 'Poppins_400Regular', marginTop: 4, textAlign: 'center' },
  payAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 14,
  },
  payAllText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text },
  sectionCount: { fontSize: 13, color: colors.textTertiary },
  subCard: { marginHorizontal: 16, marginBottom: 10 },
  subCardPending: { borderLeftWidth: 3, borderLeftColor: colors.warning },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subInfo: { flex: 1 },
  subOwner: { fontSize: 11, color: colors.primary, fontWeight: '700', fontFamily: 'Poppins_700Bold', marginBottom: 1, textTransform: 'uppercase', letterSpacing: 0.4 },
  subTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 2 },
  subDate: { fontSize: 12, color: colors.textSecondary },
  lateFee: { fontSize: 11, color: colors.error, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  subRight: { alignItems: 'flex-end', gap: 6 },
  subAmount: { fontSize: 17, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 12, marginTop: 12,
  },
  payBtnText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background, gap: 12 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  errorRetry: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  errorRetryText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 14 },
})
