---
description: Genera una pantalla completa en la app mobile (screen + navigation + estilos) siguiendo los patrones de Expo/React Native del proyecto.
agent: build
---

Generate a complete new mobile screen for futbol-platform following the established Expo/React Native patterns.

## Screen Name: $ARGUMENTS

## Instructions

1. **Create screen file**: `apps/mobile/app/<ScreenName>Screen.tsx`

2. **Screen structure**:
   - Import React, hooks, React Native components
   - Import `api` from `../services/api`
   - Functional component with `useState`, `useEffect`
   - Loading state with `ActivityIndicator`
   - Error handling with try/catch
   - `FlatList` for lists or `ScrollView` for detail screens

3. **Follow React Native patterns**:
   - `StyleSheet.create()` for styles (no inline)
   - Colors: primary `#1e40af`, background `#f5f5f5`, card `#ffffff`
   - Card style: `backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginVertical: 4, borderRadius: 8`
   - Title: `fontSize: 18, fontWeight: '700'`
   - Subtitle: `fontSize: 14, color: '#6b7280'`

4. **API integration**:
   - Use `fetch` via `services/api.ts` client
   - `useEffect` to load data on mount
   - Handle loading, error, and empty states

5. **Navigation**:
   - Accept `{ navigation, route }` props
   - Use `route.params` for incoming data
   - Use `navigation.navigate()` for outgoing navigation

6. **Register in navigator** (if stack screen):
   - Add to `navigation/AppNavigator.tsx` in the appropriate stack

Use the screen name provided in $ARGUMENTS.
