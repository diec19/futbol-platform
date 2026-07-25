import { SubscriptionStatus } from '@prisma/client';
import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';
import { getClubMpToken } from '../../lib/mp';
import { env } from '../../config/env';
import https from 'https';

function mpRequest(accessToken: string, body: any): Promise<{ id: string; init_point: string }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.mercadopago.com',
      path: '/checkout/preferences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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

async function createMpPreference(sub: any, player: any, customAmount?: number) {
  const { accessToken } = await getClubMpToken();

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const uniqueId = `${sub.id}-${Date.now()}`;

  const memberLink = await db.memberPlayer.findFirst({
    where: { playerId: player.id },
    include: { member: { select: { email: true, fullName: true } } },
  });

  const dueDate = sub.dueDate ? new Date(sub.dueDate) : new Date();
  const body = {
    items: [{
      id: uniqueId,
      title: `Cuota ${MONTHS[sub.month - 1]} ${sub.year} — ${player.fullName}`,
      quantity: 1,
      unit_price: customAmount ?? sub.amount,
      currency_id: 'ARS',
    }],
    payer: memberLink
      ? { email: memberLink.member.email, name: memberLink.member.fullName }
      : { email: `jugador-${player.id}@club.com` },
    external_reference: sub.id,
    expires: true,
    expiration_date_to: dueDate.toISOString(),
  };

  const result = await mpRequest(accessToken, body);
  return { preferenceId: result.id, paymentLink: result.init_point };
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

    // Find existing subscriptions for this month/year to skip them
    const existingSubs = await db.playerSubscription.findMany({
      where: {
        playerId: { in: players.map(p => p.id) },
        month: data.month,
        year: data.year,
      },
      select: { playerId: true },
    });
    const existingIds = new Set(existingSubs.map(s => s.playerId));
    const playersToCreate = players.filter(p => !existingIds.has(p.id));

    const results = await Promise.allSettled(
      playersToCreate.map((p) =>
        db.playerSubscription.create({
          data: {
            playerId: p.id,
            month: data.month,
            year: data.year,
            amount: data.amount,
            dueDate: new Date(data.dueDate),
          },
        })
      )
    );
    const createdCount = results.filter((r) => r.status === 'fulfilled').length;
    const skipped = players.length - playersToCreate.length;

    const monthName = MONTHS[data.month - 1];
    const APP_URL = env.APP_URL ?? '';
    const waMessages: { phone: string; playerName: string; link: string; month: string; year: number; waUrl: string }[] = [];

    // Generate MP links and WhatsApp messages if requested
    if (data.sendWhatsapp) {
      const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      for (const result of fulfilled) {
        const sub = result.value as any;
        try {
          const player = players.find(p => p.id === sub.playerId);
          if (!player) continue;

          let paymentLink = '';
          try {
            const { preferenceId, paymentLink: mpLink } = await createMpPreference(sub, player);
            paymentLink = mpLink;
            await db.playerSubscription.update({
              where: { id: sub.id },
              data: { mpPreferenceId: preferenceId, mpPaymentLink: paymentLink, status: 'LINK_SENT' },
            });
          } catch (e) { console.error(`[MP] Error al generar link para ${player.fullName}:`, e); }

          const memberLink = await db.memberPlayer.findFirst({
            where: { playerId: sub.playerId },
            include: { member: { select: { fullName: true, phone: true } } },
          });

          if (memberLink?.member.phone && memberLink.member.phone.trim()) {
            const phone = normalizePhone(memberLink.member.phone);
            const link = paymentLink || APP_URL;
            const msg = paymentLink
              ? encodeURIComponent(`Hola! 👋 Te enviamos el link de pago de la cuota ${monthName} ${data.year} de ${player.fullName}: ${paymentLink}`)
              : encodeURIComponent(`Hola! 👋 La cuota de ${monthName} ${data.year} de ${player.fullName} ya está generada. Ingresá a la app para pagarla: ${APP_URL}`);
            waMessages.push({ phone, playerName: player.fullName, link: paymentLink, month: monthName, year: data.year, waUrl: `https://wa.me/${phone}?text=${msg}` });
          }
        } catch { /* skip individual errors */ }
      }
    }

    return { created: createdCount, total: players.length, skipped, waMessages };
  },

  async sendPaymentLink(subId: string, customAmount?: number) {
    const sub = await db.playerSubscription.findUnique({
      where: { id: subId },
      include: { player: true },
    });
    if (!sub) throw new AppError('Cuota no encontrada', 404);
    if (sub.status === 'PAID') throw new AppError('La cuota ya está pagada', 400);

    const { preferenceId, paymentLink } = await createMpPreference(sub, sub.player, customAmount);

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
