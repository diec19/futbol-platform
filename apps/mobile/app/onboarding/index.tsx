import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors } from '../../theme/colors'

export default function OnboardingWelcome() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>⚽</Text>
        </View>
        <Text style={styles.appName}>Fútbol Platform</Text>
        <Text style={styles.tagline}>Área de Socios</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>¡Bienvenido!</Text>
        <Text style={styles.subtitle}>
          Enterate de todo lo que pasa en tu club: partidos, cuotas, noticias y beneficios de tus jugadores.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Partidos y resultados</Text>
              <Text style={styles.featureDesc}>Fixtures, posiciones y llaves al instante</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="wallet" size={20} color={colors.accent} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Cuotas online</Text>
              <Text style={styles.featureDesc}>Pagá con Mercado Pago desde la app</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.green[50] }]}>
              <Ionicons name="people" size={20} color={colors.green[600]} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Seguí a tus jugadores</Text>
              <Text style={styles.featureDesc}>Estadísticas, goles y sanciones</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/onboarding/ingresar')} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Comenzar</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: 96,
    paddingBottom: 56,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoWrap: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoText: { fontSize: 42 },
  appName: { fontSize: 26, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF', marginBottom: 2 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular' },
  body: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, fontFamily: 'Poppins_400Regular', lineHeight: 21, marginBottom: 24 },
  features: { gap: 16, marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureTextWrap: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 2 },
  featureDesc: { fontSize: 13, color: colors.textSecondary, fontFamily: 'Poppins_400Regular' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray[200] },
  dotActive: { width: 24, backgroundColor: colors.primary },
})
