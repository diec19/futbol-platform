import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

function formatDate(d: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}

export default function NotificationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
  });

  const notifications = data?.data ?? [];

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    } catch {}
  };

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
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={async () => {
                try {
                  await api.notifications.markAllRead();
                  qc.invalidateQueries({ queryKey: ['notifications'] });
                  qc.invalidateQueries({ queryKey: ['notifications-count'] });
                } catch {}
              }}
            >
              <Text style={styles.markAllText}>Marcar todas como leídas</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptySub}>No tenés notificaciones por ahora</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => handleMarkRead(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, !item.read && styles.dotUnread]} />
            <View style={styles.content}>
              <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={[styles.badge, item.type === 'global' ? styles.badgeGlobal : styles.badgePersonal]}>
              <Text style={[styles.badgeText, item.type === 'global' ? styles.badgeTextGlobal : styles.badgeTextPersonal]}>
                {item.type === 'global' ? 'Global' : 'Personal'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  list: { padding: 16, paddingBottom: 40 },
  markAllBtn: { alignSelf: 'flex-end', marginBottom: 12 },
  markAllText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardUnread: { borderColor: '#DC2626', borderWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'transparent', marginTop: 6, marginRight: 10 },
  dotUnread: { backgroundColor: '#DC2626' },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  titleUnread: { fontWeight: '800' },
  message: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  date: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 8 },
  badgeGlobal: { backgroundColor: '#DBEAFE' },
  badgePersonal: { backgroundColor: '#F3E8FF' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeTextGlobal: { color: '#1D4ED8' },
  badgeTextPersonal: { color: '#7C3AED' },
});
