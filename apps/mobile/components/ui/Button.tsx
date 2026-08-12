import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native'
import { colors } from '../../theme/colors'

type ButtonProps = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const isPrimary = variant === 'primary'
  const isSecondary = variant === 'secondary'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : colors.primary} />
      ) : (
        <Text style={[styles.text, isPrimary && styles.primaryText, isSecondary && styles.secondaryText, variant === 'ghost' && styles.ghostText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.blue[50] },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  primaryText: { color: '#FFFFFF' },
  secondaryText: { color: colors.primary },
  ghostText: { color: colors.primary },
})
