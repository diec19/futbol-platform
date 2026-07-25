import { Router } from 'express';
import { db } from '../../config/database';
import { getClubMpToken, fetchMpPayment, validateWebhookSignature } from '../../lib/mp';

export const webhooksRouter = Router();

webhooksRouter.post('/mp', async (req, res) => {
  try {
    const body = req.body;
    const query = req.query as Record<string, string>;

    console.log('[WEBHOOK] Received:', JSON.stringify({ body, query }));

    // ── Signature Validation ───────────────────────────────────────────────
    try {
      const { webhookSecret } = await getClubMpToken();
      if (webhookSecret) {
        const rawBody = JSON.stringify(body);
        const isValid = validateWebhookSignature(rawBody, req.headers as Record<string, string>, webhookSecret);
        if (!isValid) {
          console.error('[WEBHOOK] Invalid signature — rejecting');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }
    } catch {
      // If no secret configured, skip validation (backwards compat)
    }

    // ── Extract Payment ID ─────────────────────────────────────────────────
    const paymentId = body.data?.id ?? body.id ?? query.id;
    if (!paymentId) { console.log('[WEBHOOK] No payment ID'); return res.json({ ignored: true }); }

    let accessToken: string;
    try {
      const mpToken = await getClubMpToken();
      accessToken = mpToken.accessToken;
    } catch {
      console.error('[WEBHOOK] No MP_ACCESS_TOKEN configurado');
      return res.json({ ignored: true });
    }

    // ── Fetch Payment Details from MP ──────────────────────────────────────
    let payment;
    try {
      payment = await fetchMpPayment(String(paymentId), accessToken);
    } catch (e: any) {
      console.error('[WEBHOOK] Error fetching payment:', e.message);
      return res.json({ ignored: true });
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
    console.error('[WEBHOOK] Error:', e);
    res.status(200).json({ ignored: true });
  }
});

webhooksRouter.get('/mp', async (req, res) => {
  res.status(200).send('OK');
});
