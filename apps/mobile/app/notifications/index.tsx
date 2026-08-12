import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import Card from '../../components/ui/Card'
import { colors } from '../../theme/colors'

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export default function NotificationsScreen() {
  const qc = useQueryClient()
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
  })

  const notifications = data?.data ?? []

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id)
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
    } catch {}
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          notifications.filter((n: any) => !n.read).length > 0 ? (
            <TouchableOpacity style={styles.markAllBtn} onPress={async () => {
              try {
                await api.notifications.markAllRead()
                qc.invalidateQueries({ queryKey: ['notifications'] })
                qc.invalidateQueries({ queryKey: ['notifications-count'] })
              } catch {}
            }}>
              <Ionicons name="checkmark-done" size={16} color={colors.primary} />
              <Text style={styles.markAllText}>Marcar todas como leídas</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptySub}>No tenés notificaciones por ahora</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity onPress={() => handleMarkRead(item.id)} activeOpacity={0.7}>
            <Card padding={14} style={[styles.card, !item.read && styles.unread]}>
              <View style={styles.cardRow}>
                <View style={[styles.dot, !item.read && styles.dotActive]} />
                <View style={styles.content}>
                  <Text style={[styles.title, !item.read && styles.titleBold]}>{item.title}</Text>
                  <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                  <View style={styles.footer}>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                    <View style={[styles.typeBadge, item.type === 'global' ? styles.globalBadge : styles.personalBadge]}>
                      <Text style={[styles.typeText, item.type === 'global' ? styles.globalText : styles.personalText]}>
                        {item.type === 'global' ? 'Global' : 'Personal'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 40 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 12 },
  markAllText: { fontSize: 13, color: colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text },
  emptySub: { fontSize: 14, color: colors.textTertiary },
  card: { marginBottom: 10 },
  unread: { borderWidth: 1.5, borderColor: colors.primary },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent', marginTop: 4 },
  dotActive: { backgroundColor: colors.primary },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 4 },
  titleBold: { fontWeight: '800', fontFamily: 'Poppins_800ExtraBold' },
  message: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 11, color: colors.textTertiary },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  globalBadge: { backgroundColor: colors.blue[50] },
  personalBadge: { backgroundColor: '#F3E8FF' },
  typeText: { fontSize: 10, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  globalText: { color: colors.blue[700] },
  personalText: { color: '#7C3AED' },
})
