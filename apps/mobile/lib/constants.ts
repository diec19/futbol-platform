// Constantes del dominio, copiadas de @futbol/constants (inline para no
// depender del workspace del monorepo en los builds de EAS/APK).

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const JWT = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
} as const;

export const POINTS = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
} as const;

export const TOURNAMENT_STATUS = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'FINISHED'] as const;
export const MATCH_STATUS = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED'] as const;
export const EVENT_TYPE = ['GOAL', 'OWN_GOAL', 'YELLOW_CARD', 'RED_CARD', 'DOUBLE_YELLOW', 'MVP', 'SUBSTITUTION'] as const;
export const POSITION = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'] as const;
export const BRACKET_STAGE = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'] as const;
export const ROLE = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'DELEGATE'] as const;
export const PHASE_TYPE = ['GROUP', 'KNOCKOUT', 'MIXED'] as const;

export const BRACKET_STAGE_LABELS: Record<string, string> = {
  ROUND_OF_16: 'Octavos de Final',
  QUARTER_FINAL: 'Cuartos de Final',
  SEMI_FINAL: 'Semifinal',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
};

export const POSITION_LABELS: Record<string, string> = {
  GOALKEEPER: 'Arquero',
  DEFENDER: 'Defensor',
  MIDFIELDER: 'Mediocampista',
  FORWARD: 'Delantero',
};

export const TOURNAMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  FINISHED: 'Finalizado',
};

export const MATCH_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado',
  LIVE: 'En Juego',
  FINISHED: 'Finalizado',
  POSTPONED: 'Postergado',
  CANCELLED: 'Cancelado',
};
