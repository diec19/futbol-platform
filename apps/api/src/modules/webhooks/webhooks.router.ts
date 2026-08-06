import { Router } from 'express';
import { db } from '../../config/database';
import { getClubMpToken, fetchMpPayment, validateWebhookSignature } from '../../lib/mp';

export const webhooksRouter = Router();

webhooksRouter.post('/mp', async (req, res) => {
  try {
    const body = req.body;
    const query = req.query as Record<string, string>;

    const paymentId = body.data?.id ?? body.id ?? query.id;
    console.log('[WEBHOOK] Received payment:', paymentId);

    // ── Signature Validation (fail-closed) ─────────────────────────────────
    let mpConfig: { accessToken: string; webhookSecret: string | null };
    try {
      mpConfig = await getClubMpToken();
    } catch {
      console.error('[WEBHOOK] MercadoPago no configurado — rechazando webhook');
      return res.status(503).json({ error: 'MercadoPago no configurado' });
    }

    if (!mpConfig.webhookSecret) {
      console.error('[WEBHOOK] Webhook secret no configurado — rechazando por seguridad');
      return res.status(503).json({ error: 'Webhook secret no configurado' });
    }

    const rawBody = JSON.stringify(body);
    const isValid = validateWebhookSignature(rawBody, req.headers as Record<string, string>, mpConfig.webhookSecret);
    if (!isValid) {
      console.error('[WEBHOOK] Invalid signature — rejecting');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // ── Extract Payment ID ─────────────────────────────────────────────────
    if (!paymentId) { console.log('[WEBHOOK] No payment ID'); return res.json({ ignored: true }); }

    const accessToken = mpConfig.accessToken;

    // ── Fetch Payment Details from MP ──────────────────────────────────────
    let payment;
    try {
      payment = await fetchMpPayment(String(paymentId), accessToken);
    } catch (e: any) {
      console.error('[WEBHOOK] Error fetching payment:', e.message);
      return res.status(500).json({ error: 'Error obteniendo pago' });
    }

    console.log('[WEBHOOK] Payment status:', payment.status, 'external_reference:', payment.external_reference);

    // ── Handle Different Payment Statuses ──────────────────────────────────
    if (payment.status === 'approved') {
      const subId = payment.external_reference;
      if (!subId) { console.log('[WEBHOOK] No external_reference'); return res.json({ ignored: true }); }

      // Try PlayerSubscription first
      const playerSub = await db.playerSubscription.findUnique({
        where: { id: subId },
        include: { player: { include: { memberLinks: { select: { memberId: true } } } } },
      });
      if (playerSub) {
        console.log('[WEBHOOK] Updating player subscription:', subId);
        await db.playerSubscription.update({
          where: { id: subId },
          data: { status: 'PAID', paidAt: new Date(), mpPaymentId: String(paymentId) },
        });

        // Cross-sync: auto-mark linked Member Subscriptions as PAID
        if (playerSub.player?.memberLinks?.length) {
          await db.subscription.updateMany({
            where: {
              memberId: { in: playerSub.player.memberLinks.map(l => l.memberId) },
              month: playerSub.month,
              year: playerSub.year,
              status: { not: 'PAID' },
            },
            data: { status: 'PAID', paidAt: new Date() },
          });
        }

        return res.json({ processed: true, type: 'player', subId });
      }

      // Fallback to Member Subscription
      const memberSub = await db.subscription.findUnique({
        where: { id: subId },
        include: { member: { include: { players: { select: { playerId: true } } } } },
      });
      if (memberSub) {
        console.log('[WEBHOOK] Updating member subscription:', subId);
        await db.subscription.update({
          where: { id: subId },
          data: { status: 'PAID', paidAt: new Date(), mpPaymentId: String(paymentId) },
        });

        // Cross-sync: auto-mark linked PlayerSubscriptions as PAID
        if (memberSub.member?.players?.length) {
          await db.playerSubscription.updateMany({
            where: {
              playerId: { in: memberSub.member.players.map(p => p.playerId) },
              month: memberSub.month,
              year: memberSub.year,
              status: { not: 'PAID' },
            },
            data: { status: 'PAID', paidAt: new Date() },
          });
        }

        return res.json({ processed: true, type: 'member', subId });
      }

      console.log('[WEBHOOK] Subscription not found for external_reference:', subId);
      res.json({ ignored: true, reason: 'subscription not found' });

    } else if (['cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
      // Handle rejected/refunded payments
      const subId = payment.external_reference;
      if (subId) {
        await db.playerSubscription.updateMany({
          where: { id: subId, status: { not: 'PAID' } },
          data: { status: 'PENDING', mpPaymentId: null },
        });
        await db.subscription.updateMany({
          where: { id: subId, status: { not: 'PAID' } },
          data: { status: 'PENDING', mpPaymentId: null },
        });
        console.log(`[WEBHOOK] Reverted subscription ${subId} due to payment ${payment.status}`);
      }
      res.json({ processed: true, action: 'reverted', status: payment.status });

    } else {
      console.log(`[WEBHOOK] Ignoring payment status: ${payment.status}`);
      res.json({ ignored: true, status: payment.status });
    }
  } catch (e) {
    console.error('[WEBHOOK] Error procesando webhook:', e);
    // 500 → MercadoPago reintenta el webhook. Devolver 200 aquí pierde pagos en silencio.
    res.status(500).json({ error: 'Error interno procesando webhook' });
  }
});

webhooksRouter.get('/mp', async (req, res) => {
  res.status(200).send('OK');
});
