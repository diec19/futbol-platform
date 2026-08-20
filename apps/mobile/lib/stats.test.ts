import { describe, it, expect } from 'vitest';
import { getPlayerStats } from './stats';

describe('getPlayerStats', () => {
  it('cuenta goles, amarillas, rojas y MVP', () => {
    const stats = getPlayerStats({
      events: [
        { type: 'GOAL' },
        { type: 'GOAL' },
        { type: 'YELLOW_CARD' },
        { type: 'RED_CARD' },
        { type: 'MVP' },
      ],
    });
    expect(stats.goals).toBe(2);
    expect(stats.yellow).toBe(1);
    expect(stats.red).toBe(1);
    expect(stats.mvp).toBe(1);
    expect(stats.ownGoals).toBe(0);
  });

  it('doble amarilla = 2 amarillas acumuladas + 1 roja (regla de negocio)', () => {
    const stats = getPlayerStats({
      events: [
        { type: 'YELLOW_CARD' },
        { type: 'DOUBLE_YELLOW' },
      ],
    });
    expect(stats.yellow).toBe(3); // 1 amarilla + 2 de la doble
    expect(stats.red).toBe(1); // la doble expulsa
  });

  it('cuenta goles en contra', () => {
    const stats = getPlayerStats({
      events: [{ type: 'OWN_GOAL' }],
    });
    expect(stats.ownGoals).toBe(1);
  });

  it('no cuenta nada si no hay eventos', () => {
    const stats = getPlayerStats({ events: [] });
    expect(stats).toEqual({ goals: 0, ownGoals: 0, yellow: 0, red: 0, mvp: 0 });
  });

  it('maneja player undefined', () => {
    const stats = getPlayerStats(undefined);
    expect(stats).toEqual({ goals: 0, ownGoals: 0, yellow: 0, red: 0, mvp: 0 });
  });

  it('una roja directa no suma amarillas', () => {
    const stats = getPlayerStats({
      events: [{ type: 'RED_CARD' }],
    });
    expect(stats.yellow).toBe(0);
    expect(stats.red).toBe(1);
  });

  it('doble amarilla no cuenta como dos rojas', () => {
    const stats = getPlayerStats({
      events: [{ type: 'DOUBLE_YELLOW' }],
    });
    expect(stats.red).toBe(1);
  });
});