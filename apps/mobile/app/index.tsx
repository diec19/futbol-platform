import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../services/auth';

export default function Index() {
  const { token, loading, onboardingDone } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (token) {
        // Sesión activa: si ya completó el onboarding entra directo, si no
        // continúa el flujo de configuración en el paso de vincular jugador.
        if (onboardingDone) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth/link-player?from=onboarding');
        }
      } else {
        // Sin sesión: arranca el wizard de bienvenida.
        router.replace('/onboarding/');
      }
    }
  }, [token, loading, onboardingDone]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
      <ActivityIndicator size="large" color="#E63946" />
    </View>
  );
}
