import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { getClubMpToken, fetchMpPayment } from '../../lib/mp';
import { validateWebhookSignature, expectedPaymentAmount, calculateLateFee } from '../../lib/mp-utils';
import { notificationsService } from '../notifications/notifications.service';

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

    const dataId = String(query['data.id'] ?? body.data?.id ?? body.id ?? query.id ?? '');
    const isValid = validateWebhookSignature(dataId, req.headers as Record<string, string>, mpConfig.webhookSecret);
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

      const transactionAmount = payment.transaction_amount ?? 0;

      // Try PlayerSubscription first — a player payment covers ONLY that player's fee
      const playerSub = await db.playerSubscription.findUnique({
        where: { id: subId },
      });
      if (playerSub) {
        const expected = expectedPaymentAmount(playerSub);
        if (transactionAmount < expected - 1) {
          console.log('[WEBHOOK] Monto insuficiente para player sub:', subId, transactionAmount, expected);
          return res.json({ processed: true, type: 'player', subId, warning: 'monto insuficiente' });
        }

        console.log('[WEBHOOK] Updating player subscription:', subId);
        const paidAt = new Date();
        const lateFee = calculateLateFee(playerSub.amount, paidAt, playerSub.dueDate);
        await db.playerSubscription.update({
          where: { id: subId },
          data: {
            status: 'PAID',
            paidAt,
            mpPaymentId: String(paymentId),
            lateFee,
            totalAmount: playerSub.amount + lateFee,
          },
        });

        try {
          const player = await db.player.findUnique({
            where: { id: playerSub.playerId },
            select: { fullName: true },
          });
          await notificationsService.createAdmin({
            type: 'payment',
            refType: 'PlayerSubscription',
            refId: subId,
            title: 'Pago recibido',
            message: `Pago de $${transactionAmount.toLocaleString('es-AR')} recibido por la cuota de ${player?.fullName ?? 'un jugador'}`,
          });
        } catch (e) {
          console.error('Error creando notificacion admin:', e);
        }

        return res.json({ processed: true, type: 'player', subId });
      }

      // Fallback to Member Subscription — consolidated or individual, decided by amount
      const memberSub = await db.subscription.findUnique({
        where: { id: subId },
        include: { member: { include: { players: { select: { playerId: true } } } } },
      });
      if (memberSub) {
        const expectedMember = expectedPaymentAmount(memberSub);

        const childSubs = memberSub.member?.players?.length
          ? await db.playerSubscription.findMany({
              where: {
                playerId: { in: memberSub.member.players.map((p) => p.playerId) },
                month: memberSub.month,
                year: memberSub.year,
              },
            })
          : [];
        const expectedChildren = childSubs.reduce((sum, cs) => sum + expectedPaymentAmount(cs), 0);

        if (transactionAmount < expectedMember - 1) {
          console.log('[WEBHOOK] Monto insuficiente para member sub:', subId, transactionAmount, expectedMember);
          return res.json({ processed: true, type: 'member', subId, warning: 'monto insuficiente' });
        }

        console.log('[WEBHOOK] Updating member subscription:', subId);
        const memberPaidAt = new Date();
        const memberLateFee = calculateLateFee(memberSub.amount, memberPaidAt, memberSub.dueDate);
        await db.subscription.update({
          where: { id: subId },
          data: {
            status: 'PAID',
            paidAt: memberPaidAt,
            mpPaymentId: String(paymentId),
            lateFee: memberLateFee,
            totalAmount: memberSub.amount + memberLateFee,
          },
        });

        try {
          await notificationsService.createAdmin({
            type: 'payment',
            refType: 'Subscription',
            refId: subId,
            title: 'Pago recibido',
            message: `Pago de $${transactionAmount.toLocaleString('es-AR')} recibido de ${memberSub.member?.fullName ?? 'un socio'}`,
          });
        } catch (e) {
          console.error('Error creando notificacion admin:', e);
        }

        // Consolidated payment: amount covers member + children → mark children explicitly
        if (childSubs.length && transactionAmount >= expectedMember + expectedChildren - 1) {
          const childPaidAt = new Date();
          for (const cs of childSubs) {
            const childLateFee = calculateLateFee(cs.amount, childPaidAt, cs.dueDate);
            await db.playerSubscription.update({
              where: { id: cs.id },
              data: {
                status: 'PAID',
                paidAt: childPaidAt,
                mpPaymentId: String(paymentId),
                lateFee: childLateFee,
                totalAmount: cs.amount + childLateFee,
              },
            });
          }
        }

        return res.json({ processed: true, type: 'member', subId });
      }

      console.log('[WEBHOOK] Subscription not found for external_reference:', subId);
      res.json({ ignored: true, reason: 'subscription not found' });

    } else if (['cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
      // Handle rejected/refunded payments — revert PAID back to PENDING
      const subId = payment.external_reference;
      if (subId) {
        const playerSub = await db.playerSubscription.findUnique({ where: { id: subId } });
        if (playerSub) {
          await db.playerSubscription.update({
            where: { id: subId },
            data: { status: 'PENDING', paidAt: null, mpPaymentId: null },
          });
          console.log(`[WEBHOOK] Reverted player subscription ${subId} due to payment ${payment.status}`);
        } else {
          const memberSub = await db.subscription.findUnique({
            where: { id: subId },
            include: { member: { include: { players: { select: { playerId: true } } } } },
          });
          if (memberSub) {
            await db.subscription.update({
              where: { id: subId },
              data: { status: 'PENDING', paidAt: null, mpPaymentId: null },
            });

            // Revert only children marked by THIS payment (idempotency across payments)
            if (memberSub.member?.players?.length) {
              await db.playerSubscription.updateMany({
                where: {
                  playerId: { in: memberSub.member.players.map((p) => p.playerId) },
                  month: memberSub.month,
                  year: memberSub.year,
                  mpPaymentId: String(paymentId),
                },
                data: { status: 'PENDING', paidAt: null, mpPaymentId: null },
              });
            }
            console.log(`[WEBHOOK] Reverted member subscription ${subId} due to payment ${payment.status}`);
          } else {
            console.log('[WEBHOOK] No subscription found to revert for:', subId);
          }
        }
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

// ── WhatsApp Cloud API Webhook ───────────────────────────────────────────────
// GET: verificación inicial de Meta (hub.challenge)
webhooksRouter.get('/whatsapp', async (req, res) => {
  const mode = req.query['hub.mode'];
  const verifyToken = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && verifyToken === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WEBHOOK:WA] Verificación de webhook de WhatsApp exitosa');
    res.status(200).send(String(challenge));
  } else {
    console.warn('[WEBHOOK:WA] Verificación rechazada — verify token inválido');
    res.status(403).send('Verificación fallida');
  }
});

// POST: mensajes entrantes y actualizaciones de estado
webhooksRouter.post('/whatsapp', async (req, res) => {
  try {
    // Verificación de firma X-Hub-Signature-256 (si el App Secret está configurado)
    const appSecret = env.WHATSAPP_APP_SECRET;
    const signature = (req.headers['x-hub-signature-256'] as string | undefined) ?? '';
    const rawBody = (req as any).rawBody;

    if (appSecret && signature && rawBody) {
      const computed = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
      if (computed !== signature) {
        console.warn('[WEBHOOK:WA] Firma inválida — rechazando');
        return res.status(401).send('Firma inválida');
      }
    } else if (appSecret && !signature) {
      console.warn('[WEBHOOK:WA] Request sin firma — rechazando por seguridad');
      return res.status(401).send('Falta firma');
    }

    const body = req.body ?? {};

    for (const entry of (body.entry ?? []) as any[]) {
      for (const change of (entry.changes ?? []) as any[]) {
        const value = change.value ?? {};

        if (Array.isArray(value.messages) && value.messages.length > 0) {
          for (const msg of value.messages) {
            console.log(`[WEBHOOK:WA] Mensaje entrante de ${msg.from} (tipo: ${msg.type ?? 'desconocido'})`);
          }
        }

        if (Array.isArray(value.statuses) && value.statuses.length > 0) {
          for (const status of value.statuses) {
            const errDesc = status.errors?.map((e: any) => e.message).join('; ') ?? '';
            console.log(
              `[WEBHOOK:WA] Estado ${status.status} para mensaje ${status.id} (a ${status.recipient_id})${errDesc ? ` — ${errDesc}` : ''}`,
            );
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (e: any) {
    console.error('[WEBHOOK:WA] Error procesando webhook:', e.message);
    res.status(500).send('Error');
  }
});
