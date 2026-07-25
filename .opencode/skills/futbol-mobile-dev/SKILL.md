---
name: futbol-mobile-dev
description: Use when developing new screens, components, or features in the mobile app (apps/mobile). Covers Expo 51, React Native 0.74, React Navigation, API services, auth context. Trigger keywords: mobile, screen, Expo, React Native, navigation, app, tab, stack.
---

# futbol-mobile-dev — Guia de Desarrollo Mobile

Stack: Expo SDK 51 + React Native 0.74.5 + React Navigation 6 + AsyncStorage.

## Estructura de Directorios

```
apps/mobile/
  App.tsx                  — Entry point con NavigationContainer
  app/                     — pantallas por grupo
    (tabs)/                — Tab navigation
      AccountScreen.tsx
      TournamentsScreen.tsx
      FixturesScreen.tsx
      NewsScreen.tsx
      EstadoCuentaScreen.tsx
    TournamentDetailScreen.tsx
    TeamDetailScreen.tsx
    PlayerProfileScreen.tsx
    CategoryDetailScreen.tsx
    MatchDetailScreen.tsx
    BracketScreen.tsx
    NotificationsScreen.tsx
  components/              — Componentes reutilizables
  services/
    api.ts                 — Cliente API con fetch
    auth.tsx               — AuthContext + provider
  lib/
    constants.ts           — Re-exports de @futbol/constants
  navigation/
    AppNavigator.tsx       — Stack + Tab navigators
```

## Crear Nueva Pantalla

1. Crear archivo en `app/` o `app/(tabs)/`
2. Crear componente con React Native (View, Text, StyleSheet, etc.)
3. Usar `useQuery` o fetch para datos de la API
4. Registrar en navigator correspondiente

## Patron de Pantalla

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export default function MiPantalla({ navigation, route }: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/mi-recurso');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={styles.center} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginVertical: 4, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: '600' },
});
```

## Navegacion

- **Tabs**: 5 tabs principales (Account, Torneos, Fixtures, Noticias, Estado Cuenta)
- **Stack**: Screens de detalle se push-an desde los tabs
- **Params**: Usar `route.params` para pasar IDs

## API Client

El cliente en `services/api.ts` usa fetch directo con:
- Base URL configurable via `EXPO_PUBLIC_API_URL`
- Auto-attach Bearer token
- Refresh token en 401

## Convenciones

- **Estilos**: `StyleSheet.create()` con objetos
- **Colores**: Primarios `#1e40af` (blue-700), Grises `#f5f5f5`
- **Fonts**: Sistema default, bold para titulos
- **Cards**: `backgroundColor: '#fff'`, `borderRadius: 8`, sombra sutil
- **Loading**: `ActivityIndicator` centrado
- **Empty states**: Texto centrado con icono

## Paquetes Compartidos

Usar `@futbol/constants` para labels y enums. NO duplicar constantes localmente.
