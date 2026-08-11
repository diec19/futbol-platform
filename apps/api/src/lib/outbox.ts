import { db } from '../config/database';
import { env } from '../config/env';
import { sendWhatsAppTemplate } from './whatsapp';
import { sendEmail } from './email';

export interface EnqueueInput {
  channel: 'INAPP' | 'WHATSAPP' | 'EMAIL';
  refType: string;
  entityId: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
}

function deriveRecipientKey(channel: EnqueueInput['channel'], payload?: Record<string, any>): string {
  if (channel === 'INAPP') {
    const ids: string[] = (payload?.memberIds ?? []).map(String).sort();
    return `members:${ids.join(',')}`;
  }
  if (channel === 'WHATSAPP') return `wa:${String(payload?.phone ?? '').trim()}`;
  if (channel === 'EMAIL') return `em:${String(payload?.email ?? '').trim().toLowerCase()}`;
  return 'unknown';
}

export async function enqueueNotification(input: EnqueueInput): Promise<void> {
  await db.notificationOutbox.createMany({
    data: [{ ...input, payload: input.payload ?? {}, recipientKey: deriveRecipientKey(input.channel, input.payload) }],
    skipDuplicates: true,
  });
}

const MAX_ATTEMPTS = 5;

function backoffMs(attempts: number): number {
  return Math.min(Math.pow(2, attempts) * 60_000, 3_600_000); // 1min, 2min, 4min... cap 1h
}

async function deliver(row: any): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  switch (row.channel) {
    case 'INAPP': {
      const memberIds: string[] = row.payload?.memberIds ?? [];
      if (memberIds.length === 0) return { ok: true }; // global-less: nada que hacer
      for (const memberId of memberIds) {
        await db.notification.create({
          data: { memberId, title: row.title, message: row.message, type: row.payload?.notifType ?? 'payment_new' },
        });
      }
      return { ok: true };
    }
    case 'WHATSAPP': {
      const phone = row.payload?.phone;
      if (!phone) return { ok: true, error: 'Sin teléfono' };
      const templateName: string | undefined = row.payload?.templateName;
      if (!templateName) return { ok: false, error: 'Falta templateName en payload' };
      const params = (row.payload?.templateParams ?? []).map((p: string) => ({ type: 'text', text: String(p) }));
      const res = await sendWhatsAppTemplate(phone, templateName, params);
      return res.success ? { ok: true } : { ok: false, error: res.error };
    }
    case 'EMAIL': {
      const email = row.payload?.email;
      if (!email) return { ok: true, error: 'Sin email' };
      if (!env.EMAIL_API_KEY) {
        return { ok: false, error: 'EMAIL_API_KEY no configurado', skipped: true };
      }
      const res = await sendEmail({ to: email, subject: row.title, text: row.message });
      return res.success ? { ok: true } : { ok: false, error: res.error };
    }
    default:
      return { ok: false, error: `Canal desconocido: ${row.channel}` };
  }
}

export async function processOutboxChannel(channel: 'WHATSAPP' | 'EMAIL' | 'INAPP', concurrency = 3): Promise<{ processed: number; sent: number; failed: number }> {
  const rows = await db.notificationOutbox.findMany({
    where: {
      channel,
      status: 'PENDING',
      nextAttemptAt: { lte: new Date() },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  let sent = 0;
  let failed = 0;
  let current = 0;

  async function worker() {
    while (current < rows.length) {
      const idx = current++;
      const row = rows[idx];
      try {
        const result = await deliver(row);
        if (result.ok) {
          await db.notificationOutbox.update({
            where: { id: row.id },
            data: { status: 'SENT', sentAt: new Date(), lastError: result.error ?? null },
          });
          sent++;
        } else if (result.skipped) {
          await db.notificationOutbox.update({
            where: { id: row.id },
            data: { status: 'SKIPPED', lastError: result.error ?? 'Saltado' },
          });
          failed++;
          console.warn(`[OUTBOX:${channel}] fila ${row.id} saltada: ${result.error}`);
        } else {
          const attempts = row.attempts + 1;
          await db.notificationOutbox.update({
            where: { id: row.id },
            data: {
              attempts,
              lastError: result.error ?? 'Fallo',
              status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
              nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
            },
          });
          failed++;
          console.error(`[OUTBOX:${channel}] falló fila ${row.id}: ${result.error}`);
        }
      } catch (e: any) {
        failed++;
        console.error(`[OUTBOX:${channel}] error fila ${row.id}: ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, () => worker()));

  return { processed: rows.length, sent, failed };
}

export function startOutboxDispatcher(intervalMs = 60_000): NodeJS.Timeout {
  const run = async () => {
    try {
      await processOutboxChannel('INAPP', 5);
      await processOutboxChannel('WHATSAPP', 3);
      await processOutboxChannel('EMAIL', 5);
    } catch (e: any) {
      console.error('[OUTBOX] dispatcher error:', e.message);
    }
  };
  run();
  return setInterval(run, intervalMs);
}
