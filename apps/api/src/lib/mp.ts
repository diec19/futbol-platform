import { db } from '../config/database';
import { env } from '../config/env';
import https from 'https';

// ── Token Resolution ─────────────────────────────────────────────────────────
export async function getClubMpToken(): Promise<{ accessToken: string; webhookSecret: string | null }> {
  const club = await db.club.findFirst();
  if (club?.mpAccessToken) {
    return { accessToken: club.mpAccessToken, webhookSecret: club.mpWebhookSecret ?? null };
  }
  if (env.MP_ACCESS_TOKEN) {
    return { accessToken: env.MP_ACCESS_TOKEN, webhookSecret: env.MP_WEBHOOK_SECRET ?? null };
  }
  throw new Error('MercadoPago no configurado — no hay mpAccessToken en el club ni MP_ACCESS_TOKEN en env');
}

// ── Shared MP HTTP Client ────────────────────────────────────────────────────
export function mpRequest(accessToken: string, body: any): Promise<{ id: string; init_point: string }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.mercadopago.com',
      path: '/checkout/preferences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(b)); }
          catch { reject(new Error(`Invalid JSON: ${b}`)); }
        } else {
          reject(new Error(`MP error ${res.statusCode}: ${b}`));
        }
      });
    });
    req.setTimeout(15000, () => {
      req.destroy(new Error('MP request timeout'));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Fetch MP Payment Details ─────────────────────────────────────────────────
export async function fetchMpPayment(paymentId: string, accessToken: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MP API error ${response.status}: ${text}`);
  }
  return response.json() as Promise<{
    id: number;
    status: string;
    external_reference?: string;
    transaction_amount?: number;
    description?: string;
  }>;
}

// ── Webhook Signature Validation ─────────────────────────────────────────────
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

// ── Concurrency Limiter ──────────────────────────────────────────────────────
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<{ results: (R | null)[]; errors: { index: number; error: unknown }[] }> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  const errors: { index: number; error: unknown }[] = [];
  let current = 0;

  async function worker() {
    while (current < items.length) {
      const idx = current++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (error) {
        errors.push({ index: idx, error });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return { results, errors };
}

// ── MP Preference Creation ───────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Amount / Expiration Helpers ──────────────────────────────────────────────
export function expectedPaymentAmount(sub: { amount: number; dueDate?: Date | string | null; status?: string; totalAmount?: number | null }): number {
  if (sub.totalAmount != null && sub.totalAmount > sub.amount) return sub.totalAmount;
  if (sub.dueDate && new Date(sub.dueDate) < new Date()) return Math.round(sub.amount * 1.1);
  return sub.amount;
}

export function preferenceExpiration(dueDate: Date | string): Date {
  if (new Date(dueDate) > new Date()) return new Date(dueDate);
  return new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
}

export async function createPlayerMpPreference(
  sub: { id: string; month: number; year: number; amount: number; dueDate: Date | string; totalAmount?: number | null },
  player: { id: string; fullName: string },
  customAmount?: number,
) {
  const { accessToken } = await getClubMpToken();
  const uniqueId = `${sub.id}-${Date.now()}`;

  const memberLink = await db.memberPlayer.findFirst({
    where: { playerId: player.id },
    include: { member: { select: { email: true, fullName: true } } },
  });

  const dueDate = sub.dueDate ? new Date(sub.dueDate) : new Date();
  const body = {
    items: [{
      id: uniqueId,
      title: `Cuota ${MONTHS[sub.month - 1]} ${sub.year} — ${player.fullName}`,
      quantity: 1,
      unit_price: customAmount ?? expectedPaymentAmount(sub),
      currency_id: 'ARS',
    }],
    payer: memberLink
      ? { email: memberLink.member.email, name: memberLink.member.fullName }
      : { email: `jugador-${player.id}@club.com` },
    external_reference: sub.id,
    ...(env.APP_URL ? { notification_url: `${env.APP_URL}/api/v1/webhooks/mp` } : {}),
    statement_descriptor: 'Club Futbol',
    expires: true,
    expiration_date_to: preferenceExpiration(dueDate).toISOString(),
  };

  const result = await mpRequest(accessToken, body);
  return { preferenceId: result.id, paymentLink: result.init_point };
}

export async function createMemberMpPreference(
  sub: { id: string; month: number; year: number; amount: number; dueDate: Date | string; totalAmount?: number | null },
  member: { email: string; fullName: string },
  childSubs: { id: string; player: { fullName: string }; amount: number; dueDate?: Date | string; totalAmount?: number | null }[] = [],
  customAmount?: number,
) {
  const { accessToken } = await getClubMpToken();
  const monthName = MONTHS[sub.month - 1];

  const items: any[] = [{
    id: sub.id,
    title: `Cuota ${monthName} ${sub.year} — ${member.fullName}`,
    quantity: 1,
    unit_price: customAmount ?? expectedPaymentAmount(sub),
    currency_id: 'ARS',
  }];

  for (const cs of childSubs) {
    items.push({
      id: cs.id,
      title: `Cuota ${monthName} ${sub.year} — ${cs.player.fullName}`,
      quantity: 1,
      unit_price: expectedPaymentAmount(cs),
      currency_id: 'ARS',
    });
  }

  const body = {
    items,
    payer: { email: member.email, name: member.fullName },
    external_reference: sub.id,
    ...(env.APP_URL ? { notification_url: `${env.APP_URL}/api/v1/webhooks/mp` } : {}),
    statement_descriptor: 'Club Futbol',
    expires: true,
    expiration_date_to: preferenceExpiration(sub.dueDate).toISOString(),
  };

  const result = await mpRequest(accessToken, body);
  return { preferenceId: result.id, paymentLink: result.init_point };
}

// ── WhatsApp Helper ──────────────────────────────────────────────────────────
export function normalizePhone(phone: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  if (d.startsWith('54')) {
    // Formato internacional WhatsApp Argentina: 54 + 9 + número (sin 0 de área, sin 15)
    if (!d.startsWith('549')) {
      d = `549${d.slice(2)}`;
    }
  }
  return d;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}
