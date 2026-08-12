import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors } from '../../theme/colors'

export default function OnboardingIngresar() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/auth/login')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>PASO 2 DE 4</Text>
        <Text style={styles.headerTitle}>¿Ya sos socio?</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>
          Ingresá con tu cuenta para ver las cuotas y partidos de tus jugadores.
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth/login')} activeOpacity={0.85}>
          <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/auth/register')} activeOpacity={0.85}>
          <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>Crear cuenta</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Creá tu cuenta con tu email. Lo usamos para enviarte el link de pago de las cuotas.
        </Text>
      </View>

      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontFamily: 'Poppins_700Bold', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF' },
  body: { flex: 1, padding: 24 },
  subtitle: { fontSize: 14, color: colors.textSecondary, fontFamily: 'Poppins_400Regular', lineHeight: 21, marginBottom: 28 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textTertiary, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    padding: 16,
  },
  secondaryBtnText: { color: colors.primary, fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  hint: { fontSize: 12, color: colors.textTertiary, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 16, lineHeight: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray[200] },
  dotActive: { width: 24, backgroundColor: colors.primary },
})
