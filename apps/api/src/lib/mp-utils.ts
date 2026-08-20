// Funciones puras de MercadoPago/WhatsApp (sin dependencias de DB ni env).
// Extraídas de mp.ts para poder testearlas de forma aislada.

export function expectedPaymentAmount(sub: { amount: number; dueDate?: Date | string | null; status?: string; totalAmount?: number | null }): number {
  if (sub.totalAmount != null && sub.totalAmount > sub.amount) return sub.totalAmount;
  if (sub.dueDate && new Date(sub.dueDate) < new Date()) return Math.round(sub.amount * 1.1);
  return sub.amount;
}

export function preferenceExpiration(dueDate: Date | string): Date {
  if (new Date(dueDate) > new Date()) return new Date(dueDate);
  return new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
}

export function normalizePhone(phone: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  // Número local argentino sin código de país: 11 (Buenos Aires) o 9 + área
  if (d.startsWith('11') || d.startsWith('9')) {
    d = `549${d}`;
  }
  if (d.startsWith('54')) {
    // Formato internacional WhatsApp Argentina: 54 + 9 + número (sin 0 de área, sin 15)
    if (!d.startsWith('549')) {
      d = `549${d.slice(2)}`;
    }
  }
  return d;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function validateWebhookSignature(
  dataId: string | undefined,
  headers: Record<string, string | undefined>,
  secret: string,
): boolean {
  const xSignature = headers['x-signature'];
  const xRequestId = headers['x-request-id'];
  if (!xSignature) return false;

  // MercadoPago envía: ts=<timestamp>,v1=<hash> (separado por COMA)
  const parts = xSignature.split(',');
  const tsPart = parts.find(p => p.trim().startsWith('ts='));
  const v1Part = parts.find(p => p.trim().startsWith('v1='));
  if (!tsPart || !v1Part) return false;

  const ts = tsPart.split('=')[1]?.trim();
  const v1 = v1Part.split('=')[1]?.trim();
  if (!ts || !v1) return false;

  // Manifest oficial: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  const manifest = `id:${(dataId ?? '').toLowerCase()};request-id:${xRequestId ?? ''};ts:${ts};`;

  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const computed = hmac.digest('hex');

  return computed === v1;
}