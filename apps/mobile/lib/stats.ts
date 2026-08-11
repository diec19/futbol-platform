export interface PlayerStats {
  goals: number
  ownGoals: number
  yellow: number
  red: number
  mvp: number
}

export function getPlayerStats(player: { events?: any[] } | undefined | null): PlayerStats {
  const events = player?.events ?? []

  const yellowCards = events.filter((e) => e.type === 'YELLOW_CARD').length
  const doubleYellows = events.filter((e) => e.type === 'DOUBLE_YELLOW').length
  const redCards = events.filter((e) => e.type === 'RED_CARD').length

  return {
    goals: events.filter((e) => e.type === 'GOAL').length,
    ownGoals: events.filter((e) => e.type === 'OWN_GOAL').length,
    // Regla de negocio: doble amarilla = 2 amarillas acumuladas + 1 roja (expulsión).
    yellow: yellowCards + doubleYellows * 2,
    red: redCards + doubleYellows,
    mvp: events.filter((e) => e.type === 'MVP').length,
  }
}
