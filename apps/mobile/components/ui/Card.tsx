import { View, StyleSheet, ViewProps } from 'react-native'
import { colors } from '../../theme/colors'

type CardProps = ViewProps & { padding?: number }

export default function Card({ children, style, padding = 16, ...props }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
})
