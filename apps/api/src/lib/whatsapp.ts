import { db } from '../config/database';
import { env } from '../config/env';
import { normalizePhone } from './mp';

// ── Evolution API WhatsApp Integration ───────────────────────────────────────
// Docs: https://doc.evolution-api.com
// Requires: Evolution API instance running (Docker or cloud)

interface WhatsAppConfig {
  apiUrl: string;     // e.g. http://localhost:8080
  apiKey: string;     // Evolution API key
  instanceName: string; // e.g. "club-futbol"
}

async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const club = await db.club.findFirst();
  // Store WhatsApp config in Club model or env vars
  const apiUrl = (club as any)?.whatsappApiUrl || env.WHATSAPP_API_URL || '';
  const apiKey = (club as any)?.whatsappApiKey || env.WHATSAPP_API_KEY || '';
  const instanceName = (club as any)?.whatsappInstance || env.WHATSAPP_INSTANCE || '';

  if (!apiUrl || !apiKey || !instanceName) {
    throw new Error('WhatsApp no configurado — faltan WHATSAPP_API_URL, WHATSAPP_API_KEY o WHATSAPP_INSTANCE');
  }

  return { apiUrl, apiKey, instanceName };
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<WhatsAppSendResult> {
  try {
    const config = await getWhatsAppConfig();
    const normalizedPhone = normalizePhone(phone);

    const response = await fetch(`${config.apiUrl}/message/sendText/${config.instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey,
      },
      body: JSON.stringify({
        number: normalizedPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json() as { key?: { id?: string }; id?: string };
    return {
      success: true,
      messageId: data.key?.id ?? data.id,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendBulkWhatsAppMessages(
  messages: { phone: string; message: string; subId: string }[],
  concurrency: number = 5,
): Promise<{ sent: number; failed: number; results: { subId: string; success: boolean; error?: string }[] }> {
  const results: { subId: string; success: boolean; error?: string }[] = [];
  let current = 0;

  async function worker() {
    while (current < messages.length) {
      const idx = current++;
      const msg = messages[idx];
      try {
        const result = await sendWhatsAppMessage(msg.phone, msg.message);
        results.push({ subId: msg.subId, success: result.success, error: result.error });

        // Rate limit: 100ms between messages
        await new Promise(r => setTimeout(r, 100));
      } catch (error: any) {
        results.push({ subId: msg.subId, success: false, error: error.message });
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, messages.length) },
    () => worker(),
  );
  await Promise.all(workers);

  const sent = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return { sent, failed, results };
}

export async function checkWhatsAppConnection(): Promise<boolean> {
  try {
    const config = await getWhatsAppConfig();
    const response = await fetch(`${config.apiUrl}/instance/connectionState/${config.instanceName}`, {
      headers: { 'apikey': config.apiKey },
    });
    if (!response.ok) return false;
    const data = await response.json() as { instance?: { state?: string } };
    return data.instance?.state === 'open';
  } catch {
    return false;
  }
}
