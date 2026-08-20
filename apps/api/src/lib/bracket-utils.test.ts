import { describe, it, expect } from 'vitest';
import {
  STAGE_ORDER,
  computeMatchWinner,
  computeNextStage,
  computeFirstRoundPairings,
  findFreeSlot,
  winnerSlot,
} from './bracket-utils';

describe('computeMatchWinner', () => {
  it('devuelve el local si gana', () => {
    expect(computeMatchWinner({ homeScore: 2, awayScore: 1, homeTeamId: 'a', awayTeamId: 'b' })).toBe('a');
  });

  it('devuelve el visitante si gana', () => {
    expect(computeMatchWinner({ homeScore: 0, awayScore: 3, homeTeamId: 'a', awayTeamId: 'b' })).toBe('b');
  });

  it('devuelve null en empate', () => {
    expect(computeMatchWinner({ homeScore: 1, awayScore: 1, homeTeamId: 'a', awayTeamId: 'b' })).toBeNull();
  });

  it('devuelve null si no hay resultado', () => {
    expect(computeMatchWinner({ homeScore: null, awayScore: null, homeTeamId: 'a', awayTeamId: 'b' })).toBeNull();
  });
});

describe('computeNextStage', () => {
  it('ROUND_OF_16 -> QUARTER_FINAL', () => {
    expect(computeNextStage('ROUND_OF_16')).toBe('QUARTER_FINAL');
  });

  it('QUARTER_FINAL -> SEMI_FINAL', () => {
    expect(computeNextStage('QUARTER_FINAL')).toBe('SEMI_FINAL');
  });

  it('SEMI_FINAL -> THIRD_PLACE (el orden define el flujo)', () => {
    expect(computeNextStage('SEMI_FINAL')).toBe('THIRD_PLACE');
  });

  it('FINAL no tiene siguiente (null)', () => {
    expect(computeNextStage('FINAL')).toBeNull();
  });
});

describe('computeFirstRoundPairings', () => {
  it('arma pares para 4 equipos', () => {
    expect(computeFirstRoundPairings(['a', 'b', 'c', 'd'])).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('arma pares para 8 equipos', () => {
    const p = computeFirstRoundPairings(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(p).toHaveLength(4);
  });

  it('lanza error si cantidad impar', () => {
    expect(() => computeFirstRoundPairings(['a', 'b', 'c'])).toThrow();
  });

  it('lanza error si menos de 2 equipos', () => {
    expect(() => computeFirstRoundPairings(['a'])).toThrow();
  });
});

describe('findFreeSlot', () => {
  it('encuentra el slot con away vacío', () => {
    const slots = [
      { homeTeamId: 'a', awayTeamId: null, homeScore: null, awayScore: null },
      { homeTeamId: 'c', awayTeamId: 'd', homeScore: null, awayScore: null },
    ];
    expect(findFreeSlot(slots)?.homeTeamId).toBe('a');
  });

  it('encuentra el slot con home vacío', () => {
    const slots = [
      { homeTeamId: null, awayTeamId: 'b', homeScore: null, awayScore: null },
    ];
    expect(findFreeSlot(slots)?.awayTeamId).toBe('b');
  });

  it('devuelve null si no hay slots libres', () => {
    const slots = [
      { homeTeamId: 'a', awayTeamId: 'b', homeScore: null, awayScore: null },
      { homeTeamId: 'c', awayTeamId: 'd', homeScore: null, awayScore: null },
    ];
    expect(findFreeSlot(slots)).toBeNull();
  });
});

describe('winnerSlot', () => {
  it('coloca en away si home ya está ocupado', () => {
    expect(winnerSlot({ homeTeamId: 'a', awayTeamId: null, homeScore: null, awayScore: null })).toBe('away');
  });

  it('coloca en home si home está vacío', () => {
    expect(winnerSlot({ homeTeamId: null, awayTeamId: 'b', homeScore: null, awayScore: null })).toBe('home');
  });
});

describe('STAGE_ORDER', () => {
  it('define el flujo completo del bracket', () => {
    expect(STAGE_ORDER).toEqual([
      'ROUND_OF_16',
      'QUARTER_FINAL',
      'SEMI_FINAL',
      'THIRD_PLACE',
      'FINAL',
    ]);
  });
});