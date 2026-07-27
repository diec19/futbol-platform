import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native'
import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import Carousel from '../../components/ui/Carousel'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import PlayerAvatar from '../../components/PlayerAvatar'
import { colors } from '../../theme/colors'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success', DRAFT: 'default', FINISHED: 'info', SUSPENDED: 'warning',
}

const fallbackAds = [
  { id: '1', title: '¡Bienvenido a la Temporada 2026!', subtitle: 'Toda la info de tu club al instante', bgColor: colors.primary },
  { id: '2', title: 'Pago de Cuotas Online', subtitle: 'Pagá desde la app con Mercado Pago', bgColor: colors.accent },
  { id: '3', title: 'Seguí a tu equipo', subtitle: 'Resultados en vivo y estadísticas', bgColor: colors.navyMid },
]

function QuickAction({ icon, label, onPress, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function getPlayerStats(player: any) {
  const events = player.events ?? []
  return {
    goals: events.filter((e: any) => e.type === 'GOAL').length,
    yellow: events.filter((e: any) => e.type === 'YELLOW_CARD').length,
    red: events.filter((e: any) => ['RED_CARD', 'DOUBLE_YELLOW'].includes(e.type)).length,
  }
}

export default function HomeScreen() {
  const router = useRouter()
  const { logout } = useAuth()
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['member-me'],
    queryFn: () => api.members.me(),
    retry: false,
  })

  const { data: tournData, isLoading: tournLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.tournaments.list(),
  })

  const { data: newsData } = useQuery({
    queryKey: ['club-news'],
    queryFn: () => api.news.list(),
  })

  const { data: slidesData } = useQuery({
    queryKey: ['sponsor-slides'],
    queryFn: () => api.sponsors.slides(),
  })

  const { data: benefitsData } = useQuery({
    queryKey: ['benefits'],
    queryFn: () => api.benefits.list(),
  })

  const member = memberData?.data
  const tournaments = tournData?.data ?? []
  const latestNews = newsData?.data?.slice(0, 2) ?? []
  const pendingSub = member?.subscriptions?.find((s: any) => s.status !== 'PAID')

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    qc.invalidateQueries({ queryKey: ['member-me'] })
    qc.invalidateQueries({ queryKey: ['tournaments'] })
    qc.invalidateQueries({ queryKey: ['club-news'] })
    qc.invalidateQueries({ queryKey: ['sponsor-slides'] })
    qc.invalidateQueries({ queryKey: ['benefits'] })
    setRefreshing(false)
  }, [qc])

  const handleLogout = async () => {
    await logout()
    qc.removeQueries({ queryKey: ['member-me'] })
    router.replace('/auth/login')
  }

  const slides = slidesData?.data ?? []
  const benefitsList = benefitsData?.data ?? []
  const hasSlides = slides.length > 0
  const hasBenefits = benefitsList.length > 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {memberLoading ? (
        <View style={styles.headerSkeleton}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : member ? (
        <TouchableOpacity style={styles.profileHeader} onPress={() => router.push('/(tabs)/account')} activeOpacity={0.8}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>{member.fullName?.[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileGreeting}>Hola, {member.fullName?.split(' ')[0]} 👋</Text>
            <Text style={styles.profileUsername}>@{member.username}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.profileHeader} onPress={() => router.replace('/auth/login')} activeOpacity={0.8}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={24} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Iniciar sesión</Text>
        </TouchableOpacity>
      )}

      {hasSlides ? (
        <Carousel slides={slides.map((s: any) => ({ id: s.id, title: s.name, subtitle: s.website ?? '', bgColor: colors.primary, imageUrl: s.slideUrl }))} />
      ) : (
        <Carousel slides={fallbackAds} />
      )}

      <View style={styles.quickActions}>
        <QuickAction icon="calendar" label="Partidos" color={colors.primary} onPress={() => router.push('/(tabs)/fixtures')} />
        <QuickAction icon="newspaper" label="Noticias" color={colors.accent} onPress={() => router.push('/(tabs)/noticias')} />
        <QuickAction icon="wallet" label="Cuota" color="#16A34A" onPress={() => router.push('/(tabs)/estado-cuenta')} />
        <QuickAction icon="settings" label="Ajustes" color={colors.navyMid} onPress={() => router.push('/(tabs)/account')} />
      </View>

      {pendingSub && (
        <TouchableOpacity style={styles.alertCard} onPress={() => router.push('/(tabs)/estado-cuenta')} activeOpacity={0.85}>
          <View style={styles.alertRow}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text style={styles.alertText}>Tenés cuotas pendientes</Text>
            <Text style={styles.alertLink}>Ver ›</Text>
          </View>
        </TouchableOpacity>
      )}

      {member?.players?.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={18} color={colors.text} />
            <Text style={styles.sectionTitle}>Mis Jugadores</Text>
          </View>
          {member.players.slice(0, 3).map((mp: any) => {
            const p = mp.player
            const stats = getPlayerStats(p)
            return (
              <TouchableOpacity key={mp.id} onPress={() => router.push(`/player/${p.id}`)} activeOpacity={0.7}>
                <Card style={styles.playerCard}>
                  <View style={styles.playerRow}>
                    <PlayerAvatar photoUrl={p.photoUrl} name={p.fullName} size={48} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.playerName}>{p.fullName}</Text>
                      {p.clubCategory?.name && <Text style={styles.playerMeta}>{p.clubCategory.name}</Text>}
                      <View style={styles.playerStats}>
                        <Text style={styles.playerStat}>⚽ {stats.goals}</Text>
                        <Text style={styles.playerStat}>🟨 {stats.yellow}</Text>
                        <Text style={styles.playerStat}>🟥 {stats.red}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />
                  </View>
                </Card>
              </TouchableOpacity>
            )
          })}
          {(member.players?.length ?? 0) > 3 && (
            <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/(tabs)/account')}>
              <Text style={styles.seeAllText}>Ver todos ({member.players.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {hasBenefits && (
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="gift" size={18} color={colors.text} />
            <Text style={styles.sectionTitle}>Beneficios</Text>
            {benefitsList.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/beneficios')}>
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>Ver todos</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {benefitsList.slice(0, 6).map((b: any) => (
              <TouchableOpacity key={b.id} activeOpacity={0.8} onPress={() => router.push('/beneficios')}>
                <Card style={styles.benefitCard}>
                  {b.imageUrl ? (
                    <Image source={{ uri: b.imageUrl }} style={{ width: '100%', height: 80, borderRadius: 8 }} resizeMode="cover" />
                  ) : (
                    <View style={[styles.benefitIcon, { backgroundColor: (b.type === 'INTERNAL' ? '#16A34A' : colors.primary) + '15' }]}>
                      <Ionicons name={b.type === 'INTERNAL' ? 'star-outline' : 'pricetag-outline'} size={24} color={b.type === 'INTERNAL' ? '#16A34A' : colors.primary} />
                    </View>
                  )}
                  <Text style={styles.benefitTitle} numberOfLines={1}>{b.title}</Text>
                  {b.description && <Text style={styles.benefitDesc} numberOfLines={2}>{b.description}</Text>}
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ marginBottom: 20 }}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={18} color={colors.text} />
          <Text style={styles.sectionTitle}>Torneos</Text>
          <Text style={styles.sectionCount}>{tournaments.length}</Text>
        </View>
        {tournaments.map((item: any) => (
          <TouchableOpacity key={item.id} onPress={() => router.push(`/tournament/${item.id}`)} activeOpacity={0.7}>
            <Card style={styles.tournCard}>
              <View style={styles.tournTop}>
                <View style={styles.tournLeft}>
                  <View style={styles.tournIcon}><Ionicons name="trophy" size={18} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tournTitle}>{item.name}</Text>
                    {item.description && <Text style={styles.tournDesc} numberOfLines={1}>{item.description}</Text>}
                  </View>
                </View>
                <Badge label={item.status === 'ACTIVE' ? 'Activo' : item.status} variant={STATUS_VARIANT[item.status] ?? 'default'} />
              </View>
              <View style={styles.tournFooter}>
                <Text style={styles.tournMeta}>{item.categories?.length ?? 0} categorías</Text>
                {item.sponsor && <Text style={styles.tournMeta}>· {item.sponsor}</Text>}
              </View>
            </Card>
          </TouchableOpacity>
        ))}
        {tournaments.length === 0 && !tournLoading && (
          <Card padding={24} style={{ marginHorizontal: 16, alignItems: 'center' }}>
            <Ionicons name="trophy-outline" size={36} color={colors.gray[300]} />
            <Text style={{ color: colors.textTertiary, marginTop: 8, fontSize: 14 }}>No hay torneos activos</Text>
          </Card>
        )}
      </View>

      {latestNews.length > 0 && (
        <View>
          <View style={styles.sectionHeader}>
            <Ionicons name="newspaper" size={18} color={colors.text} />
            <Text style={styles.sectionTitle}>Últimas noticias</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/noticias')}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {latestNews.map((item: any) => (
            <Card key={item.id} style={{ marginHorizontal: 16, marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 }}>{item.title}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }} numberOfLines={2}>{item.body}</Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSkeleton: { padding: 20, alignItems: 'center' },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primary, padding: 16, paddingTop: 12,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  profileInitial: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  profileGreeting: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  profileUsername: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  quickAction: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  alertCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertText: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
  alertLink: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  sectionCount: { fontSize: 13, color: colors.textTertiary, fontWeight: '600' },
  playerCard: { marginHorizontal: 16, marginBottom: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center' },
  playerName: { fontSize: 14, fontWeight: '600', color: colors.text },
  playerMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  playerStats: { flexDirection: 'row', gap: 8, marginTop: 3 },
  playerStat: { fontSize: 11 },
  seeAll: { alignSelf: 'center', marginTop: 4 },
  seeAllText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  benefitCard: { width: 140, padding: 14, gap: 8 },
  benefitIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  benefitDesc: { fontSize: 11, color: colors.textSecondary, lineHeight: 14 },
  tournCard: { marginHorizontal: 16, marginBottom: 8 },
  tournTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tournLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10, marginRight: 8 },
  tournIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.red[50], alignItems: 'center', justifyContent: 'center' },
  tournTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 1 },
  tournDesc: { fontSize: 12, color: colors.textSecondary },
  tournFooter: { flexDirection: 'row', gap: 8, marginLeft: 44 },
  tournMeta: { fontSize: 11, color: colors.textTertiary },
})
