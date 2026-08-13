import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../services/auth';

export default function Index() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (token) {
        // Sesión activa: entra directo a la app. La vinculación de jugador
        // se hace desde Ajustes, no se fuerza al arranque.
        router.replace('/(tabs)');
      } else {
        // Sin sesión: va directo al login. Los nuevos entran por
        // "Crear cuenta" que continúa el flujo de vinculación.
        router.replace('/auth/login');
      }
    }
  }, [token, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
      <ActivityIndicator size="large" color="#E63946" />
    </View>
  );
}
