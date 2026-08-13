import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import { colors } from '../../theme/colors'

export default function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, onboardingDone } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    if (!username || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await api.members.login(username, password)
      await login(res.data.accessToken, res.data.member)
      if (onboardingDone) {
        router.replace('/(tabs)')
      } else {
        router.replace('/auth/link-player?from=onboarding')
      }
    } catch (e: any) {
      setError(e.message ?? 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={[colors.primary, '#8B1E2D', colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.appName}>Fútbol Platform</Text>
        <Text style={styles.tagline}>Área de Socios</Text>
      </LinearGradient>
      <View style={styles.card}>
        <Text style={styles.welcome}>Bienvenido</Text>
        <Text style={styles.subtitle}>Ingresá con tu usuario y contraseña</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>USUARIO</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="tu.usuario"
            placeholderTextColor={colors.gray[400]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CONTRASEÑA</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.gray[400]}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Ingresar</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/auth/register')} activeOpacity={0.7}>
          <Text style={styles.registerText}>¿No tenés cuenta? Creala acá</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingTop: 96,
    paddingBottom: 56,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logo: { width: 76, height: 76, borderRadius: 38 },
  appName: { fontSize: 26, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF', marginBottom: 4, letterSpacing: 0.3 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontFamily: 'Poppins_500Medium', letterSpacing: 1.5, textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 20,
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  welcome: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, color: colors.textSecondary, marginBottom: 6, fontWeight: '700', fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    fontSize: 15,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  registerLink: { alignItems: 'center', marginTop: 16 },
  registerText: { color: colors.primary, fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
})
