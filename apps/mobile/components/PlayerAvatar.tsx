import { View, Text, Image, StyleSheet } from 'react-native';

type Props = {
  photoUrl?: string | null;
  name: string;
  size?: number;
  style?: any;
};

export default function PlayerAvatar({ photoUrl, name, size = 48, style }: Props) {
  const borderRadius = size / 2;

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[styles.image, { width: size, height: size, borderRadius }, style]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius }, style]}>
      <Text style={[styles.initial, { fontSize: size * 0.44 }]}>
        {name[0]?.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#e5e7eb',
  },
  fallback: {
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '700', fontFamily: 'Poppins_700Bold',
  },
});
