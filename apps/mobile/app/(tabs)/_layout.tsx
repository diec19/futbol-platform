import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Tabs, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { colors } from '../../theme/colors'

function NotificationBell() {
  const router = useRouter()
  const { data } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => api.notifications.unreadCount(),
    refetchInterval: 30000,
  })
  const count = data?.data?.count ?? 0

  return (
    <TouchableOpacity onPress={() => router.push('/notifications')} style={{ marginRight: 12, position: 'relative', padding: 4 }}>
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const tabIcons: Record<string, { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  index: { focused: 'home', outline: 'home-outline' },
  fixtures: { focused: 'calendar', outline: 'calendar-outline' },
  noticias: { focused: 'newspaper', outline: 'newspaper-outline' },
  'estado-cuenta': { focused: 'wallet', outline: 'wallet-outline' },
  account: { focused: 'settings', outline: 'settings-outline' },
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          const icons = tabIcons[route.name] ?? tabIcons.index
          return <Ionicons name={focused ? icons.focused : icons.outline} size={size} color={focused ? colors.primary : colors.tabInactive} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.text },
        headerShadowVisible: false,
        headerRight: () => <NotificationBell />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="fixtures" options={{ title: 'Partidos' }} />
      <Tabs.Screen name="noticias" options={{ title: 'Noticias' }} />
      <Tabs.Screen name="estado-cuenta" options={{ title: 'Cuota' }} />
      <Tabs.Screen name="account" options={{ title: 'Ajustes' }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: 60,
    paddingBottom: 6,
    paddingTop: 4,
  },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.primary, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
})
