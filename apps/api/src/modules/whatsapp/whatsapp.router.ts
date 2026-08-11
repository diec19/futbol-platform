import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { sendWhatsAppTemplate, checkWhatsAppConnection, WhatsAppTemplateParam } from '../../lib/whatsapp';
import { normalizePhone } from '../../lib/mp';
import { enqueueNotification } from '../../lib/outbox';
import { db } from '../../config/database';

export const whatsappRouter = Router();

const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

const MONTHS = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Check WhatsApp connection status
whatsappRouter.get('/status', authenticate, wrap(async (req, res) => {
  const connected = await checkWhatsAppConnection();
  res.json({ data: { connected } });
}));

// Send a WhatsApp template to an arbitrary phone number
whatsappRouter.post('/send', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const { phone, templateName, templateParams } = req.body as {
    phone?: string;
    templateName?: string;
    templateParams?: string[];
  };
  if (!phone || !templateName) {
    return res.status(400).json({ error: 'phone y templateName son requeridos' });
  }
  const params: WhatsAppTemplateParam[] = (templateParams ?? []).map((p) => ({ type: 'text', text: String(p) }));
  const result = await sendWhatsAppTemplate(phone, templateName, params);
  res.json({ data: result });
}));

// Send payment link template to a subscription's linked member
whatsappRouter.post('/send-subscription/:subId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const { subId } = req.params;
  const { type = 'player' } = req.body;

  let phone = '';
  let recipientName = '';
  let entityName = '';
  let month = 0;
  let year = 0;
  let amount = 0;
  let paymentLink = '';

  if (type === 'member') {
    const sub = await db.subscription.findUnique({
      where: { id: subId },
      include: { member: { select: { fullName: true, phone: true } } },
    });
    if (!sub) return res.status(404).json({ error: 'Cuota no encontrada' });
    phone = sub.member.phone ?? '';
    recipientName = sub.member.fullName;
    entityName = sub.member.fullName;
    month = sub.month;
    year = sub.year;
    amount = sub.amount;
    paymentLink = sub.mpPaymentLink ?? '';
  } else {
    const sub = await db.playerSubscription.findUnique({
      where: { id: subId },
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
    if (!sub) return res.status(404).json({ error: 'Cuota no encontrada' });
    phone = (sub.player as any).memberLinks?.[0]?.member.phone ?? '';
    recipientName = (sub.player as any).memberLinks?.[0]?.member.fullName ?? sub.player.fullName;
    entityName = sub.player.fullName;
    month = sub.month;
    year = sub.year;
    amount = sub.amount;
    paymentLink = sub.mpPaymentLink ?? '';
  }

  if (!phone) {
    return res.status(400).json({ error: 'El socio/jugador no tiene teléfono registrado' });
  }
  if (!paymentLink) {
    return res.status(400).json({ error: 'La cuota no tiene link de pago generado' });
  }

  const club = await db.club.findFirst({ select: { name: true } });
  const params: WhatsAppTemplateParam[] = [
    { type: 'text', text: recipientName },
    { type: 'text', text: `${MONTHS[month]} ${year}` },
    { type: 'text', text: type === 'member' ? (club?.name ?? 'tu socio') : entityName },
    { type: 'text', text: `$${amount.toLocaleString('es-AR')}` },
    { type: 'text', text: paymentLink },
  ];

  const result = await sendWhatsAppTemplate(phone, 'cuota_disponible', params);
  res.json({ data: result });
}));

// Bulk enqueue WhatsApp templates for player subscriptions (via outbox)
whatsappRouter.post('/bulk-send-player', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const { subscriptionIds } = req.body as { subscriptionIds: string[] };
  if (!subscriptionIds?.length) {
    return res.status(400).json({ error: 'subscriptionIds es requerido' });
  }

  const subs = await db.playerSubscription.findMany({
    where: { id: { in: subscriptionIds }, mpPaymentLink: { not: null } },
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

  let enqueued = 0;
  for (const s of subs) {
    const link = (s.player as any).memberLinks?.[0];
    const phone = link?.member?.phone;
    if (!phone) continue;
    await enqueueNotification({
      channel: 'WHATSAPP',
      refType: 'playerSubscription',
      entityId: s.id,
      title: 'Cuota disponible',
      message: `Cuota ${MONTHS[s.month]} ${s.year} de ${s.player.fullName}`,
      payload: {
        phone: normalizePhone(phone),
        subId: s.id,
        month: s.month,
        year: s.year,
        name: s.player.fullName,
        paymentLink: s.mpPaymentLink,
        templateName: 'cuota_disponible',
        templateParams: [
          link.member.fullName,
          `${MONTHS[s.month]} ${s.year}`,
          s.player.fullName,
          `$${s.amount.toLocaleString('es-AR')}`,
          s.mpPaymentLink,
        ],
      },
    });
    enqueued++;
  }

  res.json({ data: { enqueued } });
}));

// Bulk enqueue WhatsApp templates for member subscriptions (via outbox)
whatsappRouter.post('/bulk-send-member', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const { subscriptionIds } = req.body as { subscriptionIds: string[] };
  if (!subscriptionIds?.length) {
    return res.status(400).json({ error: 'subscriptionIds es requerido' });
  }

  const subs = await db.subscription.findMany({
    where: { id: { in: subscriptionIds }, mpPaymentLink: { not: null } },
    include: { member: { select: { fullName: true, phone: true } } },
  });
  const club = await db.club.findFirst({ select: { name: true } });

  let enqueued = 0;
  for (const s of subs) {
    const phone = s.member.phone;
    if (!phone) continue;
    await enqueueNotification({
      channel: 'WHATSAPP',
      refType: 'subscription',
      entityId: s.id,
      title: 'Cuota disponible',
      message: `Cuota ${MONTHS[s.month]} ${s.year} de ${s.member.fullName}`,
      payload: {
        phone: normalizePhone(phone),
        subId: s.id,
        month: s.month,
        year: s.year,
        name: s.member.fullName,
        paymentLink: s.mpPaymentLink,
        templateName: 'cuota_disponible',
        templateParams: [
          s.member.fullName,
          `${MONTHS[s.month]} ${s.year}`,
          club?.name ?? 'tu socio',
          `$${s.amount.toLocaleString('es-AR')}`,
          s.mpPaymentLink,
        ],
      },
    });
    enqueued++;
  }

  res.json({ data: { enqueued } });
}));
