import { Router } from 'express';
import { db } from '../../config/database';

export const webhooksRouter = Router();

webhooksRouter.post('/mp', async (req, res) => {
  try {
    const body = req.body;
    const query = req.query as Record<string, string>;

    // Log everything to Railway console
    console.error('[WEBHOOK] Received:', JSON.stringify({ body, query }));

    // MP sends payment ID in body.data.id (webhooks) OR query param (IPN)
    const paymentId = body.data?.id ?? body.id ?? query.id;
    if (!paymentId) { console.error('[WEBHOOK] No payment ID'); return res.json({ ignored: true }); }

    console.error('[WEBHOOK] Payment ID:', paymentId);

    // Fetch payment details from MP
    const { env } = await import('../../config/env');
    if (!env.MP_ACCESS_TOKEN) { console.error('[WEBHOOK] No MP_ACCESS_TOKEN'); return res.json({ ignored: true }); }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('[WEBHOOK] MP API error:', response.status, text);
      return res.json({ ignored: true });
    }

    const payment = await response.json() as { status: string; external_reference?: string };
    console.error('[WEBHOOK] Payment status:', payment.status, 'external_reference:', payment.external_reference);

    if (payment.status !== 'approved') return res.json({ ignored: true });

    const subId = payment.external_reference;
    if (!subId) { console.error('[WEBHOOK] No external_reference'); return res.json({ ignored: true }); }

    // Try to update PlayerSubscription first
    const playerSub = await db.playerSubscription.findUnique({ where: { id: subId } });
    if (playerSub) {
      console.error('[WEBHOOK] Updating player subscription:', subId);
      await db.playerSubscription.update({
        where: { id: subId },
        data: { status: 'PAID', paidAt: new Date(), mpPaymentId: String(paymentId) },
      });
      return res.json({ processed: true, type: 'player', subId });
    }

    // Fallback to Member Subscription
    const memberSub = await db.subscription.findUnique({ where: { id: subId } });
    if (memberSub) {
      console.error('[WEBHOOK] Updating member subscription:', subId);
      await db.subscription.update({
        where: { id: subId },
        data: { status: 'PAID', paidAt: new Date(), mpPaymentId: String(paymentId) },
      });
      return res.json({ processed: true, type: 'member', subId });
    }

    console.error('[WEBHOOK] Subscription not found for external_reference:', subId);
    res.json({ ignored: true, reason: 'subscription not found' });
  } catch (e) {
    console.error('[WEBHOOK] Error:', e);
    res.status(200).json({ ignored: true });
  }
});

// Also handle GET (MP sends GET for IPN validation)
webhooksRouter.get('/mp', async (req, res) => {
  console.error('[WEBHOOK] GET received:', JSON.stringify(req.query));
  res.status(200).send('OK');
});
