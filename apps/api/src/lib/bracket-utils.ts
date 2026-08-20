import { AppError } from './app-error';

export type BracketStageName =
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'THIRD_PLACE'
  | 'FINAL';

export const STAGE_ORDER: BracketStageName[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_PLACE',
  'FINAL',
];

export interface BracketMatchResult {
  id?: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

// Lógica pura: determina el ganador de un partido finalizado.
// Devuelve el teamId ganador o null si no hay (empate / sin resultado).
export function computeMatchWinner(match: BracketMatchResult): string | null {
  if (match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore > match.awayScore) return match.homeTeamId;
  if (match.awayScore > match.homeScore) return match.awayTeamId;
  return null;
}

// Lógica pura: calcula la siguiente etapa del bracket a partir de la actual.
// Devuelve null si la actual es la última (FINAL).
export function computeNextStage(stage: BracketStageName): BracketStageName | null {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

// Lógica pura: arma los pares de la primera ronda a partir de los teamIds.
// Devuelve array de [home, away] sin tocar la DB.
export function computeFirstRoundPairings(teamIds: string[]): Array<[string, string]> {
  if (teamIds.length < 2 || teamIds.length % 2 !== 0) {
    throw new AppError('Se necesita un número par de equipos (mínimo 2)', 400);
  }
  const pairings: Array<[string, string]> = [];
  for (let i = 0; i < teamIds.length; i += 2) {
    pairings.push([teamIds[i], teamIds[i + 1]]);
  }
  return pairings;
}

// Lógica pura: encuentra el slot (partido) libre en la siguiente ronda donde
// colocar al ganador. Un slot libre tiene home o away sin asignar.
export function findFreeSlot(matches: BracketMatchResult[]): BracketMatchResult | null {
  return matches.find((m) => !m.homeTeamId || !m.awayTeamId) ?? null;
}

// Lógica pura: devuelve dónde colocar al ganador en el slot (home o away).
export function winnerSlot(slot: BracketMatchResult): 'home' | 'away' {
  return slot.homeTeamId ? 'away' : 'home';
}