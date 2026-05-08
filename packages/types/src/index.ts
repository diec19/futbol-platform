import type {
  TOURNAMENT_STATUS,
  MATCH_STATUS,
  EVENT_TYPE,
  POSITION,
  BRACKET_STAGE,
  ROLE,
  PHASE_TYPE,
} from '@futbol/constants';

export type TournamentStatus = (typeof TOURNAMENT_STATUS)[number];
export type MatchStatus = (typeof MATCH_STATUS)[number];
export type EventType = (typeof EVENT_TYPE)[number];
export type Position = (typeof POSITION)[number];
export type BracketStage = (typeof BRACKET_STAGE)[number];
export type Role = (typeof ROLE)[number];
export type PhaseType = (typeof PHASE_TYPE)[number];

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'active'>;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  logoUrl?: string;
  sponsor?: string;
  rules?: string;
  categories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  tournamentId: string;
  tournament?: Tournament;
  name: string;
  minAge?: number;
  maxAge?: number;
  birthYear?: number;
  maxPlayers: number;
  rules?: string;
  phaseType: PhaseType;
  active: boolean;
  teams?: Team[];
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  shieldUrl?: string;
  delegateName?: string;
  contact?: string;
  address?: string;
  active: boolean;
  players?: Player[];
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  teamId: string;
  team?: Team;
  fullName: string;
  dni: string;
  birthDate: string;
  photoUrl?: string;
  shirtNumber?: number;
  position?: Position;
  medicalStatus?: string;
  observations?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Referee {
  id: string;
  fullName: string;
  contact?: string;
  certifications: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  categoryId: string;
  name: string;
  teams?: GroupTeam[];
  createdAt: string;
}

export interface GroupTeam {
  id: string;
  groupId: string;
  teamId: string;
  team?: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface Match {
  id: string;
  categoryId: string;
  homeTeamId: string;
  homeTeam?: Team;
  awayTeamId: string;
  awayTeam?: Team;
  homeScore?: number;
  awayScore?: number;
  scheduledAt: string;
  venue?: string;
  refereeId?: string;
  referee?: Referee;
  status: MatchStatus;
  round?: number;
  groupId?: string;
  group?: Group;
  bracketStage?: BracketStage;
  notes?: string;
  events?: MatchEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: EventType;
  playerId?: string;
  player?: Player;
  teamId: string;
  team?: Team;
  minute?: number;
  notes?: string;
  createdAt: string;
}

export interface Sanction {
  id: string;
  playerId: string;
  player?: Player;
  reason: string;
  matchesBan: number;
  startDate: string;
  endDate?: string;
  resolved: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopScorer {
  id: string;
  fullName: string;
  photoUrl?: string;
  team?: Pick<Team, 'id' | 'name' | 'shieldUrl'>;
  goals: number;
}

export interface BracketMatch {
  id: string;
  stage: BracketStage;
  homeTeam?: Pick<Team, 'id' | 'name' | 'shieldUrl'>;
  awayTeam?: Pick<Team, 'id' | 'name' | 'shieldUrl'>;
  homeScore?: number;
  awayScore?: number;
  scheduledAt?: string;
  status: MatchStatus;
}
