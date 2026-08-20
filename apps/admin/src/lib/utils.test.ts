import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatDateTime } from './utils';

describe('cn', () => {
  it('combina clases y resuelve conflictos de tailwind', () => {
    expect(cn('px-2', 'px-4')).toContain('px-4');
  });

  it('mantiene clases sin conflicto', () => {
    const result = cn('flex', 'items-center', 'gap-2');
    expect(result).toContain('flex');
    expect(result).toContain('items-center');
    expect(result).toContain('gap-2');
  });

  it('ignora valores falsy', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});

describe('formatDate', () => {
  it('formatea una fecha a dd/mm/aaaa', () => {
    // Fecha con hora del mediodía (determinística, evita cambios por timezone)
    expect(formatDate('2026-08-15T12:00:00')).toBe('15/08/2026');
  });

  it('acepta un objeto Date', () => {
    expect(formatDate(new Date(2026, 7, 3))).toBe('03/08/2026');
  });
});

describe('formatDateTime', () => {
  it('incluye hora y minutos', () => {
    const result = formatDateTime('2026-08-15T14:30:00');
    expect(result).toMatch(/15\/08\/2026/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});