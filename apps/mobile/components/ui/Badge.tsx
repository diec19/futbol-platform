import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'

type BadgeProps = {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const variantStyles = {
  default: { bg: colors.gray[100], text: colors.gray[600] },
  success: { bg: colors.green[50], text: colors.green[700] },
  warning: { bg: '#FFF3E0', text: '#E65100' },
  error: { bg: '#FFEBEE', text: colors.error },
  info: { bg: colors.blue[50], text: colors.blue[700] },
}

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  const v = variantStyles[variant]
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
})
