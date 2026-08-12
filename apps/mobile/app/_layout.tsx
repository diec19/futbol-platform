import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins'
import { AuthProvider } from '../services/auth'
import { colors } from '../theme/colors'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60, retry: 1 } },
})

const headerStyles = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17, fontFamily: 'Poppins_700Bold' },
  headerShadowVisible: false,
  headerBackTitle: 'Volver',
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/register" />
              <Stack.Screen name="auth/link-player" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="tournament/[id]" options={{ headerShown: true, title: 'Torneo', ...headerStyles }} />
              <Stack.Screen name="team/[id]" options={{ headerShown: true, title: 'Equipo', ...headerStyles }} />
              <Stack.Screen name="player/[id]" options={{ headerShown: true, title: 'Jugador', ...headerStyles }} />
              <Stack.Screen name="category/[id]" options={{ headerShown: true, title: 'Categoría', ...headerStyles }} />
              <Stack.Screen name="match/[id]" options={{ headerShown: true, title: 'Partido', ...headerStyles }} />
              <Stack.Screen name="notifications/index" options={{ headerShown: true, title: 'Notificaciones', ...headerStyles }} />
              <Stack.Screen name="bracket/[id]" options={{ headerShown: true, title: 'Llaves', ...headerStyles }} />
              <Stack.Screen name="beneficios" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
