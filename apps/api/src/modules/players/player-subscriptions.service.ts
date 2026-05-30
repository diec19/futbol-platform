import { SubscriptionStatus } from '@prisma/client';
import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';
import { env } from '../../config/env';

async function createMpPreference(sub: any, player: any) {
  if (!env.MP_ACCESS_TOKEN) throw new AppError('MercadoPago no configurado', 500);

  const { MercadoPagoConfig, Preference } = await import('mercadopago');
  const client = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
  const pref = new Preference(client);

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // Try to get a payer email from linked member
  const memberLink = await db.memberPlayer.findFirst({
    where: { playerId: player.id },
    include: { member: { select: { email: true, fullName: true } } },
  });

  const result = await pref.create({
    body: {
      items: [{
        id: sub.id,
        title: `Cuota ${MONTHS[sub.month - 1]} ${sub.year} — ${player.fullName}`,
        quantity: 1,
        unit_price: sub.amount,
        currency_id: 'ARS',
      }],
      payer: memberLink
        ? { email: memberLink.member.email, name: memberLink.member.fullName }
        : { email: `jugador-${player.id}@club.com` },
      back_urls: {
        success: `${env.APP_URL}/payment/success`,
        failure: `${env.APP_URL}/payment/failure`,
        pending: `${env.APP_URL}/payment/pending`,
      },
      notification_url: `${env.APP_URL}/api/v1/webhooks/mp`,
      external_reference: sub.id,
      auto_return: 'approved',
    },
  });

  return { preferenceId: result.id!, paymentLink: result.init_point! };
}

export const playerSubscriptionsService = {
  async listByPlayer(playerId: string) {
    return db.playerSubscription.findMany({
      where: { playerId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  },

  async listAll(params: { clubCategoryId?: string; status?: string; month?: number; year?: number }) {
    const { clubCategoryId, status, month, year } = params;
    const now = new Date();

    return db.playerSubscription.findMany({
      where: {
        ...(status ? { status: status as SubscriptionStatus } : {}),
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
        player: {
          isClubPlayer: true,
          active: true,
          ...(clubCategoryId ? { clubCategoryId } : {}),
        },
      },
      include: {
        player: {
          select: {
            id: true, fullName: true, firstName: true, lastName: true,
            photoUrl: true, dni: true,
            clubCategory: { select: { id: true, name: true, coach: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { player: { fullName: 'asc' } }],
    });
  },

  async create(playerId: string, data: { month: number; year: number; amount: number; dueDate: string; notes?: string }) {
    const player = await db.player.findUnique({ where: { id: playerId } });
    if (!player) throw new AppError('Jugador no encontrado', 404);

    const existing = await db.playerSubscription.findUnique({
      where: { playerId_month_year: { playerId, month: data.month, year: data.year } },
    });
    if (existing) throw new AppError('Ya existe una cuota para ese mes/año', 409);

    return db.playerSubscription.create({
      data: {
        playerId,
        month: data.month,
        year: data.year,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        notes: data.notes,
      },
    });
  },

  async createBulk(data: {
    month: number; year: number; amount: number; dueDate: string; clubCategoryId?: string; sendWhatsapp?: boolean;
  }) {
    const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const normalizePhone = (phone: string) => {
      const d = phone.replace(/\D/g, '');
      if (d.startsWith('549')) return d;
      if (d.startsWith('54')) return `9${d}`;
      return `549${d}`;
    };

    const players = await db.player.findMany({
      where: {
        isClubPlayer: true,
        active: true,
        ...(data.clubCategoryId ? { clubCategoryId: data.clubCategoryId } : {}),
      },
    });

    const results = await Promise.allSettled(
      players.map((p) =>
        db.playerSubscription.upsert({
          where: { playerId_month_year: { playerId: p.id, month: data.month, year: data.year } },
          create: {
            playerId: p.id,
            month: data.month,
            year: data.year,
            amount: data.amount,
            dueDate: new Date(data.dueDate),
          },
          update: {},
        })
      )
    );

    const created = results.filter((r) => r.status === 'fulfilled').length;
    const monthName = MONTHS[data.month - 1];
    const APP_URL = env.APP_URL ?? '';
    const waMessages: { phone: string; playerName: string; link: string; month: string; year: number; waUrl: string }[] = [];

    // Generate WhatsApp messages if requested (without MP links to avoid MP errors)
    if (data.sendWhatsapp) {
      const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      for (const result of fulfilled) {
        const sub = result.value as any;
        try {
          const player = sub.player ?? (await db.player.findUnique({ where: { id: sub.playerId }, select: { fullName: true } }));
          const memberLink = await db.memberPlayer.findFirst({
            where: { playerId: sub.playerId },
            include: { member: { select: { fullName: true, phone: true } } },
          });

          if (memberLink?.member.phone && memberLink.member.phone.trim()) {
            const phone = normalizePhone(memberLink.member.phone);
            const msg = encodeURIComponent(`Hola! 👋 La cuota de ${monthName} ${data.year} de ${player?.fullName ?? 'tu hijo'} ya está generada. Ingresá a la app para pagarla: ${APP_URL}`);
            waMessages.push({ phone, playerName: player?.fullName ?? '', link: '', month: monthName, year: data.year, waUrl: `https://wa.me/${phone}?text=${msg}` });
          }
        } catch { /* skip individual errors */ }
      }
    }

    return { created, total: players.length, waMessages };
  },

  async sendPaymentLink(subId: string) {
    const sub = await db.playerSubscription.findUnique({
      where: { id: subId },
      include: { player: true },
    });
    if (!sub) throw new AppError('Cuota no encontrada', 404);
    if (sub.status === 'PAID') throw new AppError('La cuota ya está pagada', 400);

    const { preferenceId, paymentLink } = await createMpPreference(sub, sub.player);

    return db.playerSubscription.update({
      where: { id: subId },
      data: { mpPreferenceId: preferenceId, mpPaymentLink: paymentLink, status: 'LINK_SENT' },
    });
  },

  async markPaid(subId: string) {
    const sub = await db.playerSubscription.findUnique({
      where: { id: subId },
      include: {
        player: {
          include: { memberLinks: { select: { memberId: true } } },
        },
      },
    });
    if (!sub) throw new AppError('Cuota no encontrada', 404);

    const updated = await db.playerSubscription.update({
      where: { id: subId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // Auto-mark linked member's Subscription for same month/year as PAID
    if (sub.player?.memberLinks?.length) {
      await db.subscription.updateMany({
        where: {
          memberId: { in: sub.player.memberLinks.map((l) => l.memberId) },
          month: sub.month,
          year: sub.year,
          status: { not: 'PAID' },
        },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }

    return updated;
  },

  async markOverdue(subId: string) {
    return db.playerSubscription.update({
      where: { id: subId },
      data: { status: 'OVERDUE' },
    });
  },

  async remove(subId: string) {
    return db.playerSubscription.delete({ where: { id: subId } });
  },

  async currentForPlayer(playerId: string) {
    const now = new Date();
    return db.playerSubscription.findUnique({
      where: {
        playerId_month_year: {
          playerId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    });
  },
};
