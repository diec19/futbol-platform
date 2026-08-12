import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../../services/api'
import { colors } from '../../theme/colors'

export default function LinkPlayerScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>()
  const fromOnboarding = from === 'onboarding'
  const [dni, setDni] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const router = useRouter()

  const goNext = () => {
    if (fromOnboarding) {
      router.replace('/onboarding/listo')
    } else {
      router.replace('/(tabs)')
    }
  }

  const handleLink = async () => {
    if (!dni.trim() || !day || !month || !year) {
      setError('Completá el DNI y la fecha de nacimiento del jugador')
      return
    }
    const d = Number(day)
    const m = Number(month)
    const y = Number(year)
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
      setError('La fecha de nacimiento no es válida')
      return
    }
    const birthDate = new Date(Date.UTC(y, m - 1, d)).toISOString()
    setLoading(true)
    setError('')
    setNotFound(false)
    try {
      await api.members.linkPlayer({ dni: dni.trim(), birthDate })
      goNext()
    } catch (e: any) {
      if ((e as any)?.status === 404) {
        setNotFound(true)
        setError('No encontramos a ese jugador en el plantel')
      } else {
        setError(e.message ?? 'No se pudo vincular el jugador')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Ionicons name="people" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Vinculá a tu jugador</Text>
        <Text style={styles.subtitle}>Así vas a ver sus cuotas, partidos y estadísticas</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DNI DEL JUGADOR *</Text>
          <TextInput
            style={styles.input}
            value={dni}
            onChangeText={setDni}
            placeholder="Ej: 45123456"
            placeholderTextColor={colors.gray[400]}
            keyboardType="number-pad"
          />
        </View>

        <Text style={styles.label}>FECHA DE NACIMIENTO *</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            value={day}
            onChangeText={setDay}
            placeholder="Día"
            placeholderTextColor={colors.gray[400]}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TextInput
            style={[styles.input, styles.dateInput]}
            value={month}
            onChangeText={setMonth}
            placeholder="Mes"
            placeholderTextColor={colors.gray[400]}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TextInput
            style={[styles.input, styles.yearInput]}
            value={year}
            onChangeText={setYear}
            placeholder="Año"
            placeholderTextColor={colors.gray[400]}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
        <Text style={styles.hint}>La fecha confirma que sos el padre/tutor del jugador</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {notFound ? (
          <TouchableOpacity
            style={styles.notFoundBtn}
            onPress={() => router.push(fromOnboarding ? '/auth/join-request?from=onboarding' : '/auth/join-request')}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add" size={18} color="#FFFFFF" />
            <Text style={styles.notFoundText}>Cargar jugador nuevo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLink} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Vincular jugador</Text>}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.skipBtn} onPress={goNext} activeOpacity={0.7}>
          <Text style={styles.skipText}>Omitir por ahora</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: 64,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
  },
  logoWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, color: colors.textSecondary, marginBottom: 6, fontWeight: '700', fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateInput: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  yearInput: {
    flex: 1.5,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  hint: { fontSize: 11, color: colors.textTertiary, marginTop: 6, marginBottom: 12, fontFamily: 'Poppins_400Regular' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1, fontFamily: 'Poppins_400Regular' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  notFoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 15,
    marginTop: 4,
  },
  notFoundText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  skipBtn: { alignItems: 'center', marginTop: 14 },
  skipText: { color: colors.textTertiary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
})
