import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { sendWhatsAppMessage, sendBulkWhatsAppMessages, checkWhatsAppConnection } from '../../lib/whatsapp';
import { normalizePhone, buildWhatsAppUrl } from '../../lib/mp';
import { db } from '../../config/database';

export const whatsappRouter = Router();

const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// Check WhatsApp connection status
whatsappRouter.get('/status', authenticate, wrap(async (req, res) => {
  const connected = await checkWhatsAppConnection();
  res.json({ data: { connected } });
}));

// Send single WhatsApp message
whatsappRouter.post('/send', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone y message son requeridos' });
  }
  const result = await sendWhatsAppMessage(phone, message);
  res.json({ data: result });
}));

// Send payment link via WhatsApp to a subscription's linked member
whatsappRouter.post('/send-subscription/:subId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const { subId } = req.params;
  const { type = 'player' } = req.body;

  let phone = '';
  let playerName = '';
  let month = 0;
  let year = 0;
  let paymentLink = '';

  if (type === 'member') {
    const sub = await db.subscription.findUnique({
      where: { id: subId },
      include: { member: { select: { fullName: true, phone: true } } },
    });
    if (!sub) return res.status(404).json({ error: 'Cuota no encontrada' });
    phone = sub.member.phone ?? '';
    playerName = sub.member.fullName;
    month = sub.month;
    year = sub.year;
    paymentLink = sub.mpPaymentLink ?? '';
  } else {
    const sub = await db.playerSubscription.findUnique({
      where: { id: subId },
      include: {
        player: {
          include: {
            memberLinks: {
              include: { member: { select: { phone: true } } },
            },
          },
        },
      },
    });
    if (!sub) return res.status(404).json({ error: 'Cuota no encontrada' });
    phone = (sub.player as any).memberLinks?.[0]?.member.phone ?? '';
    playerName = sub.player.fullName;
    month = sub.month;
    year = sub.year;
    paymentLink = sub.mpPaymentLink ?? '';
  }

  if (!phone) {
    return res.status(400).json({ error: 'El socio/jugador no tiene teléfono registrado' });
  }

  const MONTHS = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const message = paymentLink
    ? `Hola! 👋 Te enviamos el link de pago de la cuota ${MONTHS[month]} ${year} de ${playerName}: ${paymentLink}`
    : `Hola! 👋 La cuota de ${MONTHS[month]} ${year} de ${playerName} ya está generada.`;

  const result = await sendWhatsAppMessage(phone, message);
  res.json({ data: result });
}));

// Bulk send WhatsApp for player subscriptions
whatsappRouter.post('/bulk-send-player', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const { subscriptionIds } = req.body as { subscriptionIds: string[] };
  if (!subscriptionIds?.length) {
    return res.status(400).json({ error: 'subscriptionIds es requerido' });
  }

  const subs = await db.playerSubscription.findMany({
    where: { id: { in: subscriptionIds } },
    include: {
      player: {
        include: {
          memberLinks: {
            include: { member: { select: { phone: true, fullName: true } } },
          },
        },
      },
    },
  });

  const MONTHS = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const messages = subs
    .filter(s => (s.player as any).memberLinks?.[0]?.member.phone)
    .map(s => ({
      phone: normalizePhone((s.player as any).memberLinks[0].member.phone!),
      message: `Hola! 👋 Te enviamos el link de pago de la cuota ${MONTHS[s.month]} ${s.year} de ${s.player.fullName}: ${s.mpPaymentLink ?? 'Ver en la app'}`,
      subId: s.id,
    }));

  const result = await sendBulkWhatsAppMessages(messages);
  res.json({ data: result });
}));

// Bulk send WhatsApp for member subscriptions
whatsappRouter.post('/bulk-send-member', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const { subscriptionIds } = req.body as { subscriptionIds: string[] };
  if (!subscriptionIds?.length) {
    return res.status(400).json({ error: 'subscriptionIds es requerido' });
  }

  const subs = await db.subscription.findMany({
    where: { id: { in: subscriptionIds } },
    include: { member: { select: { fullName: true, phone: true } } },
  });

  const MONTHS = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const messages = subs
    .filter(s => s.member.phone)
    .map(s => ({
      phone: normalizePhone(s.member.phone!),
      message: `Hola ${s.member.fullName}! 👋 Te enviamos el link de pago de la cuota de ${MONTHS[s.month]} ${s.year}: ${s.mpPaymentLink ?? 'Ver en la app'}`,
      subId: s.id,
    }));

  const result = await sendBulkWhatsAppMessages(messages);
  res.json({ data: result });
}));
