import { env } from '../config/env';
import { normalizePhone } from './mp';

// ── WhatsApp Business Cloud API Integration ─────────────────────────────────
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// Requires: Phone Number ID + permanent token + templates aprobados

function getWhatsAppConfig(): { token: string; phoneNumberId: string; version: string } {
  const token = env.WHATSAPP_GRAPH_TOKEN ?? '';
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID ?? '';
  const version = env.WHATSAPP_GRAPH_VERSION;

  if (!token || !phoneNumberId) {
    throw new Error('WhatsApp no configurado — faltan WHATSAPP_GRAPH_TOKEN o WHATSAPP_PHONE_NUMBER_ID');
  }

  return { token, phoneNumberId, version };
}

const GRAPH_HOST = 'graph.facebook.com';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppTemplateParam {
  type: 'text';
  text: string;
}

export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  templateParams: WhatsAppTemplateParam[] = [],
  languageCode = 'es_AR',
): Promise<WhatsAppSendResult> {
  try {
    const { token, phoneNumberId, version } = getWhatsAppConfig();
    const normalizedPhone = normalizePhone(phone);

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };

    if (templateParams.length > 0) {
      (body.template as any).components = [{ type: 'body', parameters: templateParams }];
    }

    const response = await fetch(`https://${GRAPH_HOST}/${version}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json() as { messages?: { id?: string }[] };
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkWhatsAppConnection(): Promise<boolean> {
  try {
    const { token, phoneNumberId, version } = getWhatsAppConfig();
    const response = await fetch(
      `https://${GRAPH_HOST}/${version}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      { headers: { 'Authorization': `Bearer ${token}` } },
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function getWhatsAppConnectionInfo(): Promise<{ connected: boolean; info?: Record<string, unknown> }> {
  try {
    const { token, phoneNumberId, version } = getWhatsAppConfig();
    const response = await fetch(
      `https://${GRAPH_HOST}/${version}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      { headers: { 'Authorization': `Bearer ${token}` } },
    );
    if (!response.ok) {
      const text = await response.text();
      return { connected: false, info: { error: `HTTP ${response.status}: ${text}` } };
    }
    const data = await response.json() as Record<string, unknown>;
    return { connected: true, info: data };
  } catch (error: any) {
    return { connected: false, info: { error: error.message } };
  }
}
