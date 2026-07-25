import { db } from '../config/database';
import { env } from '../config/env';

export async function getClubMpToken(): Promise<{ accessToken: string; webhookSecret: string | null }> {
  const club = await db.club.findFirst();
  if (club?.mpAccessToken) {
    return { accessToken: club.mpAccessToken, webhookSecret: club.mpWebhookSecret ?? null };
  }
  // Fallback a env global por compatibilidad
  if (env.MP_ACCESS_TOKEN) {
    return { accessToken: env.MP_ACCESS_TOKEN, webhookSecret: env.MP_WEBHOOK_SECRET ?? null };
  }
  throw new Error('MercadoPago no configurado — no hay mpAccessToken en el club ni MP_ACCESS_TOKEN en env');
}
