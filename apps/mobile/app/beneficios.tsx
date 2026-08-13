import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, RefreshControl } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../services/api'
import Card from '../components/ui/Card'
import GradientHeader from '../components/ui/GradientHeader'
import { colors } from '../theme/colors'
import { useState, useCallback } from 'react'

export default function BeneficiosScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'EXTERNAL' | 'INTERNAL'>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['benefits'],
    queryFn: () => api.benefits.list(),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    qc.invalidateQueries({ queryKey: ['benefits'] })
    setRefreshing(false)
  }, [qc])

  const allBenefits = data?.data ?? []
  const benefits = filter === 'ALL' ? allBenefits : allBenefits.filter((b: any) => b.type === filter)

  const FILTERS = [
    { key: 'ALL' as const, label: 'Todos' },
    { key: 'EXTERNAL' as const, label: 'Descuentos' },
    { key: 'INTERNAL' as const, label: 'Beneficios del club' },
  ]

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <GradientHeader style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beneficios</Text>
        <View style={{ width: 36 }} />
      </GradientHeader>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : benefits.length === 0 ? (
        <Card padding={32} style={{ marginHorizontal: 16, marginTop: 20, alignItems: 'center' }}>
          <Ionicons name="gift-outline" size={48} color={colors.gray[300]} />
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12 }}>
            No hay beneficios disponibles
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {benefits.map((b: any) => (
            <Card key={b.id} style={styles.card}>
              {b.imageUrl ? (
                <Image source={{ uri: b.imageUrl }} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={styles.cardPlaceholder}>
                  <Ionicons
                    name={b.type === 'INTERNAL' ? 'star' : 'pricetag'}
                    size={32}
                    color={b.type === 'INTERNAL' ? '#16A34A' : colors.primary}
                  />
                </View>
              )}
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{b.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: b.type === 'INTERNAL' ? '#DCFCE7' : '#EFF6FF' }]}>
                    <Text style={[styles.typeText, { color: b.type === 'INTERNAL' ? '#16A34A' : '#2563EB' }]}>
                      {b.type === 'INTERNAL' ? 'Club' : 'Externo'}
                    </Text>
                  </View>
                </View>
                {b.description && (
                  <Text style={styles.cardDesc}>{b.description}</Text>
                )}
                {b.sponsor && (
                  <View style={styles.sponsorRow}>
                    {b.sponsor.logoUrl ? (
                      <Image source={{ uri: b.sponsor.logoUrl }} style={styles.sponsorLogo} />
                    ) : (
                      <View style={[styles.sponsorLogo, { backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.textSecondary }}>
                          {b.sponsor.name[0]}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.sponsorName}>{b.sponsor.name}</Text>
                  </View>
                )}
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.gray[100] },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  filterTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  card: { padding: 0, overflow: 'hidden' },
  cardImage: { width: '100%', height: 160 },
  cardPlaceholder: {
    width: '100%', height: 120,
    backgroundColor: colors.gray[50],
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text, flex: 1, marginRight: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  typeText: { fontSize: 10, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  cardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  sponsorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sponsorLogo: { width: 22, height: 22, borderRadius: 6 },
  sponsorName: { fontSize: 11, color: colors.textTertiary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
})
