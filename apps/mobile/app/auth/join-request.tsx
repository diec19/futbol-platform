import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { colors } from '../../theme/colors'

export default function JoinRequestScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>()
  const fromOnboarding = from === 'onboarding'
  const [fullName, setFullName] = useState('')
  const [dni, setDni] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { data: catData } = useQuery({
    queryKey: ['club-categories'],
    queryFn: () => api.club.categories(),
  })
  const categories = catData?.data ?? []

  const goNext = () => {
    if (fromOnboarding) {
      router.replace('/onboarding/listo')
    } else {
      router.replace('/(tabs)')
    }
  }

  const handleSubmit = async () => {
    if (!fullName.trim() || !dni.trim() || !day || !month || !year) {
      setError('Completá nombre, DNI y fecha de nacimiento')
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
    try {
      await api.members.playerRequest({
        fullName: fullName.trim(),
        dni: dni.trim(),
        birthDate,
        categoryId: categoryId || undefined,
      })
      goNext()
    } catch (e: any) {
      setError(e.message ?? 'No se pudo enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Ionicons name="person-add" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Cargar nuevo jugador</Text>
          <Text style={styles.subtitle}>No lo encontramos en el plantel. Completá sus datos y el club lo va a aprobar.</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOMBRE Y APELLIDO *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DNI *</Text>
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
              style={styles.dateInput}
              value={day}
              onChangeText={setDay}
              placeholder="Día"
              placeholderTextColor={colors.gray[400]}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TextInput
              style={styles.dateInput}
              value={month}
              onChangeText={setMonth}
              placeholder="Mes"
              placeholderTextColor={colors.gray[400]}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TextInput
              style={styles.yearInput}
              value={year}
              onChangeText={setYear}
              placeholder="Año"
              placeholderTextColor={colors.gray[400]}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CATEGORÍA (opcional)</Text>
            <View style={styles.catWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  style={[styles.catChip, categoryId === '' && styles.catChipActive]}
                  onPress={() => setCategoryId('')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catChipText, categoryId === '' && styles.catChipTextActive]}>Sin categoría</Text>
                </TouchableOpacity>
                {categories.filter((c: any) => c.active !== false).map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catChip, categoryId === c.id && styles.catChipActive]}
                    onPress={() => setCategoryId(categoryId === c.id ? '' : c.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.catChipText, categoryId === c.id && styles.catChipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Enviar solicitud</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={goNext} activeOpacity={0.7}>
            <Text style={styles.skipText}>Omitir por ahora</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },
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
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
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
  catWrap: { flexDirection: 'row' },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  catChipTextActive: { color: '#FFFFFF' },
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
  skipBtn: { alignItems: 'center', marginTop: 14 },
  skipText: { color: colors.textTertiary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
})
