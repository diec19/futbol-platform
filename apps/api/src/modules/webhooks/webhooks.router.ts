import { Router } from 'express';
import { db } from '../../config/database';

export const webhooksRouter = Router();

webhooksRouter.post('/mp', async (req, res) => {
  try {
    const body = req.body;

    // MP sends different event shapes; extract payment ID
    const paymentId = body.data?.id ?? body.id;
    if (!paymentId) return res.json({ ignored: true });

    // Fetch payment details from MP
    const { env } = await import('../../config/env');
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
    });
    if (!response.ok) return res.json({ ignored: true });

    const payment = await response.json() as { status: string; external_reference?: string };
    if (payment.status !== 'approved') return res.json({ ignored: true });

    const subId = payment.external_reference;
    if (!subId) return res.json({ ignored: true });

    // Try to update PlayerSubscription first
    const playerSub = await db.playerSubscription.findUnique({ where: { id: subId } });
    if (playerSub) {
      await db.playerSubscription.update({
        where: { id: subId },
        data: { status: 'PAID', paidAt: new Date(), mpPaymentId: String(paymentId) },
      });
      return res.json({ processed: true, type: 'player', subId });
    }

    // Fallback to Member Subscription
    const memberSub = await db.subscription.findUnique({ where: { id: subId } });
    if (memberSub) {
      await db.subscription.update({
        where: { id: subId },
        data: { status: 'PAID', paidAt: new Date(), mpPaymentId: String(paymentId) },
      });
      return res.json({ processed: true, type: 'member', subId });
    }

    res.json({ ignored: true, reason: 'subscription not found' });
  } catch {
    res.status(200).json({ ignored: true });
  }
});
