import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../../services/auth'
import { colors } from '../../theme/colors'

export default function OnboardingListo() {
  const router = useRouter()
  const { setOnboardingDone } = useAuth()

  useEffect(() => {
    setOnboardingDone()
  }, [setOnboardingDone])

  const handleEnter = () => {
    router.replace('/(tabs)')
  }

  return (
    <View style={styles.container}>
      <View style={styles.checkWrap}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.title}>¡Listo!</Text>
      <Text style={styles.subtitle}>
        Tu cuenta está configurada. Ahora vas a poder ver cuotas, partidos, noticias y beneficios de tu club.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleEnter} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Entrar a la app</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 },
  checkWrap: { alignItems: 'center', marginBottom: 24 },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.green[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { fontSize: 28, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: colors.text, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: colors.textSecondary, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 21, marginBottom: 32 },
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
