import { describe, it, expect } from 'vitest';
import {
  MATCH_STATUS,
  TOURNAMENT_STATUS,
  POSITION,
  BRACKET_STAGE,
  MATCH_STATUS_LABELS,
  TOURNAMENT_STATUS_LABELS,
  POSITION_LABELS,
  BRACKET_STAGE_LABELS,
} from './constants';

describe('constants', () => {
  it('cada MATCH_STATUS tiene label', () => {
    for (const s of MATCH_STATUS) {
      expect(MATCH_STATUS_LABELS[s]).toBeDefined();
      expect(MATCH_STATUS_LABELS[s].length).toBeGreaterThan(0);
    }
  });

  it('cada TOURNAMENT_STATUS tiene label', () => {
    for (const s of TOURNAMENT_STATUS) {
      expect(TOURNAMENT_STATUS_LABELS[s]).toBeDefined();
    }
  });

  it('cada POSITION tiene label', () => {
    for (const p of POSITION) {
      expect(POSITION_LABELS[p]).toBeDefined();
    }
  });

  it('cada BRACKET_STAGE tiene label', () => {
    for (const s of BRACKET_STAGE) {
      expect(BRACKET_STAGE_LABELS[s]).toBeDefined();
    }
  });

  it('los labels de estado de partido son los esperados', () => {
    expect(MATCH_STATUS_LABELS.SCHEDULED).toBe('Programado');
    expect(MATCH_STATUS_LABELS.LIVE).toBe('En Juego');
    expect(MATCH_STATUS_LABELS.FINISHED).toBe('Finalizado');
    expect(MATCH_STATUS_LABELS.POSTPONED).toBe('Postergado');
    expect(MATCH_STATUS_LABELS.CANCELLED).toBe('Cancelado');
  });

  it('los labels de posición son los esperados', () => {
    expect(POSITION_LABELS.GOALKEEPER).toBe('Arquero');
    expect(POSITION_LABELS.DEFENDER).toBe('Defensor');
    expect(POSITION_LABELS.MIDFIELDER).toBe('Mediocampista');
    expect(POSITION_LABELS.FORWARD).toBe('Delantero');
  });

  it('los labels de llaves son los esperados', () => {
    expect(BRACKET_STAGE_LABELS.QUARTER_FINAL).toBe('Cuartos de Final');
    expect(BRACKET_STAGE_LABELS.SEMI_FINAL).toBe('Semifinal');
    expect(BRACKET_STAGE_LABELS.FINAL).toBe('Final');
  });
});