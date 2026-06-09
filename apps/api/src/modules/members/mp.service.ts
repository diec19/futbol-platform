import { env } from '../../config/env';
import https from 'https';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function mpRequest(body: any): Promise<{ id: string; init_point: string }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.mercadopago.com',
      path: '/checkout/preferences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
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
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export const mpService = {
  async createPreference(
    sub: { id: string; month: number; year: number; amount: number; dueDate: Date },
    member: { email: string; fullName: string },
    childSubs: { id: string; player: { fullName: string }; amount: number }[] = [],
  ) {
    if (!env.MP_ACCESS_TOKEN) throw new Error('MP_ACCESS_TOKEN no configurado');

    const monthName = MONTH_NAMES[sub.month - 1];
    const items: any[] = [{
      id: sub.id,
      title: `Cuota ${monthName} ${sub.year} — ${member.fullName}`,
      quantity: 1,
      unit_price: sub.amount,
      currency_id: 'ARS',
    }];

    for (const cs of childSubs) {
      items.push({
        id: cs.id,
        title: `Cuota ${monthName} ${sub.year} — ${cs.player.fullName}`,
        quantity: 1,
        unit_price: cs.amount,
        currency_id: 'ARS',
      });
    }

    const body = {
      items,
      payer: { email: member.email, name: member.fullName },
      external_reference: sub.id,
      statement_descriptor: 'Club Futbol',
      expires: true,
      expiration_date_to: new Date(sub.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return mpRequest(body);
  },
};
