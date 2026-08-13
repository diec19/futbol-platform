import { useState } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Linking } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { useAuth } from '../../services/auth'
import PlayerAvatar from '../../components/PlayerAvatar'
import Card from '../../components/ui/Card'
import { colors } from '../../theme/colors'
import { getPlayerStats } from '../../lib/stats'

function calcAge(birthDate: string) {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: 'Arquero', DEFENDER: 'Defensor', MIDFIELDER: 'Mediocampista', FORWARD: 'Delantero',
}

function PlayerModal({ player, visible, onClose }: { player: any; visible: boolean; onClose: () => void }) {
  if (!player) return null
  const stats = getPlayerStats(player)
  const age = calcAge(player.birthDate)
  const team = player.team

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.modalAvatarWrap}>
              <PlayerAvatar photoUrl={player.photoUrl} name={player.fullName} size={88} />
            </View>
            <Text style={styles.modalName}>{player.fullName}</Text>

            <View style={styles.infoGrid}>
              {player.position && <InfoItem label="Posición" value={POSITION_LABELS[player.position] ?? player.position} />}
              <InfoItem label="Edad" value={`${age} años`} />
              {player.shirtNumber && <InfoItem label="Camiseta" value={`#${player.shirtNumber}`} />}
            </View>

            <View style={styles.statsRow}>
              <StatCard icon="football" value={stats.goals} label="Goles" color={colors.green[600]} />
              <StatCard icon="warning" value={stats.yellow} label="Amarillas" color={colors.warning} />
              <StatCard icon="remove-circle" value={stats.red} label="Rojas" color={colors.error} />
            </View>

            {team && (
              <Card padding={14} style={{ marginBottom: 12, width: '100%' }}>
                <Text style={{ fontSize: 10, color: colors.textTertiary, fontWeight: '700', fontFamily: 'Poppins_700Bold', letterSpacing: 0.5, marginBottom: 4 }}>EQUIPO</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text }}>{team.name}</Text>
                {team.category && <Text style={{ fontSize: 13, color: colors.textSecondary }}>{team.category.name}</Text>}
              </Card>
            )}

            {player.sanctions?.length > 0 && (
              <Card padding={14} style={{ borderLeftWidth: 3, borderLeftColor: colors.warning, width: '100%' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 6 }}>Sanciones ({player.sanctions.length})</Text>
                {player.sanctions.map((s: any, i: number) => (
                  <Text key={i} style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 2 }}>• {s.description ?? s.reason}</Text>
                ))}
              </Card>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text, marginTop: 2 }}>{value}</Text>
    </View>
  )
}

function StatCard({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.gray[50], borderRadius: 14, padding: 12 }}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ fontSize: 20, fontWeight: '800', fontFamily: 'Poppins_800ExtraBold', color: colors.text, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' }}>{label}</Text>
    </View>
  )
}

export default function SettingsScreen() {
  const { logout } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['member-me'], queryFn: () => api.members.me(), retry: false,
  })
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [unlinkTarget, setUnlinkTarget] = useState<any>(null)
  const [unlinkReason, setUnlinkReason] = useState('')
  const [unlinkSending, setUnlinkSending] = useState(false)
  const [unlinkMsg, setUnlinkMsg] = useState('')

  const handleLogout = async () => {
    await logout()
    qc.removeQueries({ queryKey: ['member-me'] })
    router.replace('/auth/login')
  }

  const handleUnlink = async () => {
    if (!unlinkTarget) return
    setUnlinkSending(true)
    setUnlinkMsg('')
    try {
      await api.members.unlinkRequest({
        playerId: unlinkTarget.id,
        reason: unlinkReason.trim() || undefined,
      })
      setUnlinkMsg('Solicitud enviada. El club la va a aprobar.')
      setUnlinkReason('')
    } catch (e: any) {
      setUnlinkMsg(e.message ?? 'No se pudo enviar la solicitud')
    } finally {
      setUnlinkSending(false)
    }
  }

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  if (error) {
    // Solo sesión expirada/inválida (401) fuerza logout. Un error de red o del server
    // no debe cerrar la sesión: se muestra error con reintentar.
    if ((error as any)?.status === 401) {
      handleLogout()
      return null
    }
    return (
      <View style={styles.errorBox}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.gray[300]} />
        <Text style={styles.errorText}>No se pudo cargar tu perfil</Text>
        <TouchableOpacity style={styles.errorRetry} onPress={() => refetch()} activeOpacity={0.85}>
          <Text style={styles.errorRetryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const member = data?.data

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient
        colors={[colors.primary, '#8B1E2D', colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileCard}
      >
        <View style={styles.profileAvatarBig}>
          <Text style={styles.profileInitialBig}>{member?.fullName?.[0]}</Text>
        </View>
        <Text style={styles.profileName}>{member?.fullName}</Text>
        <Text style={styles.profileUsername}>@{member?.username}</Text>
      </LinearGradient>

      <View style={styles.menuSection}>
        <MenuItem icon="person" label="Mi Perfil" onPress={() => {}} />
        <MenuItem icon="people" label="Mis Jugadores" onPress={() => router.push('/auth/link-player')} />
        <MenuItem icon="notifications" label="Notificaciones" onPress={() => router.push('/notifications')} />
        <MenuItem icon="help-circle" label="Ayuda" onPress={() => {}} />
        <MenuItem icon="log-out" label="Cerrar sesión" onPress={handleLogout} color={colors.error} />
      </View>

      {member?.players?.length > 0 && (
        <>
          <View style={styles.sectionTitle}>Jugadores vinculados</View>
          {member.players.map((mp: any) => {
            const p = mp.player
            const stats = getPlayerStats(p)
            return (
              <TouchableOpacity key={mp.id} onPress={() => setSelectedPlayer(p)} activeOpacity={0.7}>
                <Card style={{ marginHorizontal: 16, marginBottom: 8 }}>
                  <View style={styles.playerRow}>
                    <PlayerAvatar photoUrl={p.photoUrl} name={p.fullName} size={52} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.playerName}>{p.fullName}</Text>
                      {p.clubCategory?.name && <Text style={styles.playerMeta}>{p.clubCategory.name}</Text>}
                      <View style={styles.playerStatsRow}>
                        <View style={styles.statItem}>
                          <Ionicons name="football" size={13} color={colors.green[600]} />
                          <Text style={styles.statValue}>{stats.goals}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="warning" size={13} color={colors.warning} />
                          <Text style={styles.statValue}>{stats.yellow}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="remove-circle" size={13} color={colors.error} />
                          <Text style={styles.statValue}>{stats.red}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.unlinkIconBtn}
                      onPress={() => { setUnlinkTarget(p); setUnlinkReason(''); setUnlinkMsg('') }}
                      activeOpacity={0.7}
                      aria-label="Desvincular jugador"
                    >
                      <Ionicons name="unlink-outline" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedPlayer(p)} activeOpacity={0.7}>
                      <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            )
          })}
          <TouchableOpacity style={styles.linkMoreBtn} onPress={() => router.push('/auth/link-player')} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.linkMoreText}>Vincular otro jugador</Text>
          </TouchableOpacity>
        </>
      )}

      {member?.players?.length === 0 && (
        <TouchableOpacity style={styles.linkMoreBtn} onPress={() => router.push('/auth/link-player')} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.linkMoreText}>Vincular jugador</Text>
        </TouchableOpacity>
      )}

      <PlayerModal player={selectedPlayer} visible={!!selectedPlayer} onClose={() => setSelectedPlayer(null)} />

      <Modal visible={!!unlinkTarget} transparent animationType="slide" onRequestClose={() => { if (!unlinkSending) setUnlinkTarget(null) }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => { if (!unlinkSending) setUnlinkTarget(null) }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.modalAvatarWrap}>
              <PlayerAvatar photoUrl={unlinkTarget?.photoUrl} name={unlinkTarget?.fullName ?? ''} size={72} />
            </View>
            <Text style={styles.modalName}>Desvincular a {unlinkTarget?.fullName}</Text>
            <Text style={styles.unlinkHint}>
              Vas a enviar una solicitud al club. El administrador la va a aprobar o rechazar.
            </Text>
            <TextInput
              style={styles.unlinkInput}
              value={unlinkReason}
              onChangeText={setUnlinkReason}
              placeholder="Motivo (opcional)"
              placeholderTextColor={colors.gray[400]}
              multiline
            />
            {unlinkMsg ? <Text style={styles.unlinkMsg}>{unlinkMsg}</Text> : null}
            <TouchableOpacity style={styles.unlinkSendBtn} onPress={handleUnlink} disabled={unlinkSending} activeOpacity={0.85}>
              {unlinkSending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.unlinkSendText}>Enviar solicitud</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.unlinkCancel} onPress={() => { if (!unlinkSending) setUnlinkTarget(null) }} activeOpacity={0.7}>
              <Text style={styles.unlinkCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

function MenuItem({ icon, label, onPress, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={color ?? colors.textSecondary} />
      <Text style={[styles.menuLabel, color ? { color } : {}]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileCard: { backgroundColor: colors.primary, padding: 24, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 20 },
  profileAvatarBig: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileInitialBig: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  profileName: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  profileUsername: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  menuSection: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', fontFamily: 'Poppins_500Medium', color: colors.text },
  sectionTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text, paddingHorizontal: 20, marginBottom: 10 },
  playerRow: { flexDirection: 'row', alignItems: 'center' },
  playerName: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: colors.text },
  playerMeta: { fontSize: 12, color: colors.textSecondary },
  playerStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 3 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statValue: { fontSize: 12, color: colors.text },
  unlinkIconBtn: { padding: 6, marginRight: 2 },
  unlinkHint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', fontFamily: 'Poppins_400Regular', lineHeight: 19, marginBottom: 14, paddingHorizontal: 8 },
  unlinkInput: {
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    minHeight: 70,
    textAlignVertical: 'top',
    width: '100%',
    marginBottom: 12,
  },
  unlinkMsg: { fontSize: 13, color: colors.success, textAlign: 'center', fontFamily: 'Poppins_500Medium', marginBottom: 12 },
  unlinkCancel: { alignItems: 'center', marginTop: 12 },
  unlinkCancelText: { color: colors.textTertiary, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  unlinkSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 13, width: '100%',
  },
  unlinkSendText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: colors.darkOverlay, justifyContent: 'flex-end' },
  modalScroll: { justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 16, alignItems: 'center', maxHeight: '90%' },
  modalClose: { alignSelf: 'flex-end', padding: 4 },
  modalAvatarWrap: { alignItems: 'center', marginBottom: 12 },
  modalName: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 16 },
  infoGrid: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  linkMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: 16, marginTop: 4, marginBottom: 16,
    paddingVertical: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    backgroundColor: colors.primaryLight,
  },
  linkMoreText: { color: colors.primary, fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background, gap: 12 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  errorRetry: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  errorRetryText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold', fontSize: 14 },
})
