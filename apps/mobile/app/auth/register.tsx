import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import { colors } from '../../theme/colors'

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleRegister = async () => {
    if (!fullName.trim() || !dni.trim() || !email.trim() || !password) {
      setError('Completá todos los campos obligatorios')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.members.register({
        fullName: fullName.trim(),
        dni: dni.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      })
      // Registro exitoso -> login automático con email + contraseña
      const res = await api.members.login(email.trim(), password)
      await login(res.data.accessToken, res.data.member)
      router.replace('/auth/link-player')
    } catch (e: any) {
      setError(e.message ?? 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>⚽</Text>
          </View>
          <Text style={styles.appName}>Crear cuenta</Text>
          <Text style={styles.tagline}>Ingresá tus datos para asociarte</Text>
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
              placeholder="Ej: 30123456"
              placeholderTextColor={colors.gray[400]}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Text style={styles.hint}>Lo usamos para enviarte el link de pago de cuotas</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>TELÉFONO (opcional)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej: 11-1234-5678"
              placeholderTextColor={colors.gray[400]}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONTRASEÑA *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.gray[400]}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>REPETIR CONTRASEÑA *</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repetí la contraseña"
              placeholderTextColor={colors.gray[400]}
              secureTextEntry
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backLinkText}>Ya tengo cuenta — Volver al login</Text>
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
  },
  logoWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 36 },
  appName: { fontSize: 24, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF', marginBottom: 2 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_400Regular' },
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
  hint: { fontSize: 11, color: colors.textTertiary, marginTop: 4, fontFamily: 'Poppins_400Regular' },
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
  backLink: { alignItems: 'center', marginTop: 16 },
  backLinkText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
})
