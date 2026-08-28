import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  expectedPaymentAmount,
  preferenceExpiration,
  buildWhatsAppUrl,
  validateWebhookSignature,
  calculateLateFee,
} from './mp-utils';

describe('normalizePhone', () => {
  it('normaliza un teléfono local argentino a formato internacional', () => {
    expect(normalizePhone('011-4567-8901')).toBe('5491145678901');
  });

  it('normaliza un número sin prefijo de país', () => {
    expect(normalizePhone('11 4567 8901')).toBe('5491145678901');
  });

  it('mantiene el formato internacional si ya viene con 549', () => {
    expect(normalizePhone('5491145678901')).toBe('5491145678901');
  });

  it('corrige 54 sin 9 agregando el 9', () => {
    expect(normalizePhone('541145678901')).toBe('5491145678901');
  });

  it('quita caracteres no numéricos', () => {
    expect(normalizePhone('+54 9 11 4567-8901')).toBe('5491145678901');
  });
});

describe('expectedPaymentAmount', () => {
  it('devuelve el monto base si no hay recargo ni vencimiento', () => {
    expect(expectedPaymentAmount({ amount: 10000 })).toBe(10000);
  });

  it('usa totalAmount si es mayor al monto base', () => {
    expect(expectedPaymentAmount({ amount: 10000, totalAmount: 12000 })).toBe(12000);
  });

  it('aplica 10% de recargo si la fecha venció', () => {
    const sub = { amount: 10000, dueDate: new Date(Date.now() - 86400000).toISOString() };
    expect(expectedPaymentAmount(sub)).toBe(11000);
  });

  it('no aplica recargo si la fecha no venció', () => {
    const sub = { amount: 10000, dueDate: new Date(Date.now() + 86400000).toISOString() };
    expect(expectedPaymentAmount(sub)).toBe(10000);
  });
});

describe('calculateLateFee', () => {
  // La cuota vence el día 10 a medianoche local (misma construcción que getDueDate)
  const due = new Date(2026, 0, 10);

  it('devuelve 0 si se paga antes del vencimiento', () => {
    expect(calculateLateFee(10000, new Date(2026, 0, 9, 12), due)).toBe(0);
  });

  it('devuelve 0 si se paga el mismo día del vencimiento (gracia)', () => {
    expect(calculateLateFee(10000, new Date(2026, 0, 10, 23, 59), due)).toBe(0);
  });

  it('aplica 10% si se paga después del vencimiento', () => {
    expect(calculateLateFee(10000, new Date(2026, 0, 11, 0, 1), due)).toBe(1000);
  });

  it('redondea el recargo', () => {
    expect(calculateLateFee(10033, new Date(2026, 0, 11, 0, 1), due)).toBe(1003);
  });
});

describe('preferenceExpiration', () => {
  it('usa la fecha de vencimiento si está en el futuro', () => {
    const future = new Date(Date.now() + 5 * 86400000);
    const result = preferenceExpiration(future);
    expect(result.getTime()).toBe(future.getTime());
  });

  it('extiende 15 días si la fecha ya pasó', () => {
    const past = new Date(Date.now() - 86400000);
    const result = preferenceExpiration(past);
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('buildWhatsAppUrl', () => {
  it('arma la URL con mensaje codificado', () => {
    const url = buildWhatsAppUrl('5491145678901', 'Hola club');
    expect(url).toBe('https://wa.me/5491145678901?text=Hola%20club');
  });
});

describe('validateWebhookSignature', () => {
  const secret = 'test-secret';

  function sign(dataId: string, requestId: string, ts: string): string {
    const crypto = require('crypto');
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
    return `ts=${ts},v1=${crypto.createHmac('sha256', secret).update(manifest).digest('hex')}`;
  }

  it('valida una firma correcta', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign('123456789', 'req-1', ts);
    expect(validateWebhookSignature('123456789', { 'x-signature': sig, 'x-request-id': 'req-1' }, secret)).toBe(true);
  });

  it('rechaza firma inválida', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign('123456789', 'req-1', ts);
    expect(validateWebhookSignature('999999999', { 'x-signature': sig, 'x-request-id': 'req-1' }, secret)).toBe(false);
  });

  it('rechaza si falta x-signature', () => {
    expect(validateWebhookSignature('123', {}, secret)).toBe(false);
  });

  it('rechaza si la firma no tiene ts o v1', () => {
    expect(validateWebhookSignature('123', { 'x-signature': 'garbage' }, secret)).toBe(false);
  });
});