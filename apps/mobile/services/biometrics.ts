import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

const CREDENTIALS_KEY = 'member_credentials'

export interface SavedCredentials {
  username: string
  password: string
}

/** ¿El dispositivo soporta y tiene biometría habilitada? */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    if (!hasHardware) return false
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    return enrolled
  } catch {
    return false
  }
}

/** Pide la huella/rostro. Devuelve true si autenticó. */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloqueá con tu huella',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    })
    return result.success
  } catch {
    return false
  }
}

/** Guarda las credenciales de forma segura (para login con huella). */
export async function saveCredentials(username: string, password: string): Promise<void> {
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ username, password }))
}

/** Recupera las credenciales guardadas (o null si no hay). */
export async function getSavedCredentials(): Promise<SavedCredentials | null> {
  try {
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedCredentials
  } catch {
    return null
  }
}

/** Borra las credenciales guardadas. */
export async function clearSavedCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY)
}
