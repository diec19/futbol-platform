import { describe, it, expect } from 'vitest';
import {
  tournamentFormSchema,
  categoryFormSchema,
  teamFormSchema,
  loginFormSchema,
} from './validations';

describe('tournamentFormSchema', () => {
  const valid = {
    name: 'Torneo 2026',
    startDate: '2026-08-01',
    endDate: '2026-12-01',
    status: 'ACTIVE',
  };

  it('acepta un torneo válido', () => {
    expect(tournamentFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza si falta el nombre', () => {
    const res = tournamentFormSchema.safeParse({ ...valid, name: '' });
    expect(res.success).toBe(false);
  });

  it('rechaza si el fin es anterior al inicio', () => {
    const res = tournamentFormSchema.safeParse({ ...valid, endDate: '2026-01-01' });
    expect(res.success).toBe(false);
  });

  it('acepta si fin es igual al inicio', () => {
    const res = tournamentFormSchema.safeParse({ ...valid, endDate: '2026-08-01' });
    expect(res.success).toBe(true);
  });

  it('rechaza un status inválido', () => {
    const res = tournamentFormSchema.safeParse({ ...valid, status: 'INVALID' });
    expect(res.success).toBe(false);
  });
});

describe('categoryFormSchema', () => {
  const valid = {
    name: '2016',
    maxPlayers: '20',
    phaseType: 'MIXED',
  };

  it('acepta una categoría válida', () => {
    expect(categoryFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza maxPlayers menor o igual a 0', () => {
    const res = categoryFormSchema.safeParse({ ...valid, maxPlayers: '0' });
    expect(res.success).toBe(false);
  });

  it('rechaza maxPlayers no entero', () => {
    const res = categoryFormSchema.safeParse({ ...valid, maxPlayers: '1.5' });
    expect(res.success).toBe(false);
  });

  it('acepta birthYear vacío', () => {
    const res = categoryFormSchema.safeParse({ ...valid, birthYear: '' });
    expect(res.success).toBe(true);
  });

  it('rechaza birthYear negativo', () => {
    const res = categoryFormSchema.safeParse({ ...valid, birthYear: '-1' });
    expect(res.success).toBe(false);
  });
});

describe('teamFormSchema', () => {
  it('acepta un equipo válido', () => {
    const res = teamFormSchema.safeParse({ name: 'Rojo', categoryId: 'cat1' });
    expect(res.success).toBe(true);
  });

  it('rechaza sin categoría', () => {
    const res = teamFormSchema.safeParse({ name: 'Rojo', categoryId: '' });
    expect(res.success).toBe(false);
  });
});

describe('loginFormSchema', () => {
  it('acepta login y password', () => {
    expect(loginFormSchema.safeParse({ login: 'admin', password: 'secret' }).success).toBe(true);
  });

  it('rechaza password vacío', () => {
    const res = loginFormSchema.safeParse({ login: 'admin', password: '' });
    expect(res.success).toBe(false);
  });
});