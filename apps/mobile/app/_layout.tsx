import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60, retry: 1 } },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="tournament/[id]"
            options={{ headerShown: true, title: 'Torneo', headerBackTitle: 'Volver' }}
          />
          <Stack.Screen
            name="team/[id]"
            options={{ headerShown: true, title: 'Equipo', headerBackTitle: 'Volver' }}
          />
          <Stack.Screen
            name="player/[id]"
            options={{ headerShown: true, title: 'Jugador', headerBackTitle: 'Volver' }}
          />
          <Stack.Screen
            name="category/[id]"
            options={{ headerShown: true, title: 'Categoría', headerBackTitle: 'Volver' }}
          />
          <Stack.Screen
            name="match/[id]"
            options={{ headerShown: true, title: 'Partido', headerBackTitle: 'Volver' }}
          />
          <Stack.Screen
            name="bracket/[id]"
            options={{ headerShown: true, title: 'Llaves', headerBackTitle: 'Volver' }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
