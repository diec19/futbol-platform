import MercadoPagoConfig, { Preference } from 'mercadopago';
import { env } from '../../config/env';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function getClient() {
  if (!env.MP_ACCESS_TOKEN) throw new Error('MP_ACCESS_TOKEN no configurado');
  return new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
}

export const mpService = {
  async createPreference(
    sub: { id: string; month: number; year: number; amount: number; dueDate: Date },
    member: { email: string; fullName: string },
    childSubs: { id: string; player: { fullName: string }; amount: number }[] = [],
  ) {
    const client = getClient();
    const preference = new Preference(client);

    const monthName = MONTH_NAMES[sub.month - 1];
    const items: any[] = [{
      id: sub.id,
      title: `Cuota ${monthName} ${sub.year} — ${member.fullName}`,
      quantity: 1,
      unit_price: sub.amount,
      currency_id: 'ARS',
    }];

    // Add children's subscriptions as additional items
    for (const cs of childSubs) {
      items.push({
        id: cs.id,
        title: `Cuota ${monthName} ${sub.year} — ${cs.player.fullName}`,
        quantity: 1,
        unit_price: cs.amount,
        currency_id: 'ARS',
      });
    }

    const result = await preference.create({
      body: {
        items,
        payer: {
          email: member.email,
          name: member.fullName,
        },
        back_urls: {
          success: `${env.APP_URL}/payment/success`,
          failure: `${env.APP_URL}/payment/failure`,
          pending: `${env.APP_URL}/payment/pending`,
        },
        auto_return: 'approved',
        notification_url: `${env.APP_URL}/api/v1/webhooks/mp`,
        external_reference: sub.id,
        statement_descriptor: 'Club Futbol',
        expires: true,
        expiration_date_to: new Date(sub.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    return {
      preferenceId: result.id!,
      paymentLink: result.init_point!,
    };
  },
};
