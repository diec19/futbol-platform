import { ReactNode } from 'react'
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../../theme/colors'

// Header con degradé rojo -> blanco/azul del escudo. Reemplaza los
// headers rojos sólidos para dar identidad (rojo, blanco y azul).
export default function GradientHeader({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return (
    <LinearGradient
      colors={[colors.primary, '#8B1E2D', colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, style]}
    >
      {children}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 0,
  },
})
