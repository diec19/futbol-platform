import { SubscriptionStatus } from '@prisma/client';
import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';
import { createPlayerMpPreference, mapWithConcurrency, normalizePhone, buildWhatsAppUrl } from '../../lib/mp';
import { env } from '../../config/env';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DUE_DAY = 10;
const LATE_FEE_PERCENT = 10;

function getDueDate(month: number, year: number): Date {
  return new Date(year, month - 1, DUE_DAY);
}

function calculateLateFee(amount: number, paidDate: Date, dueDate: Date): number {
  if (paidDate <= dueDate) return 0;
  return Math.round(amount * LATE_FEE_PERCENT / 100);
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

  async create(playerId: string, data: { month: number; year: number; amount: number; notes?: string }) {
    const player = await db.player.findUnique({ where: { id: playerId } });
    if (!player) throw new AppError('Jugador no encontrado', 404);

    const existing = await db.playerSubscription.findUnique({
      where: { playerId_month_year: { playerId, month: data.month, year: data.year } },
    });
    if (existing) throw new AppError('Ya existe una cuota para ese mes/año', 409);

    const dueDate = getDueDate(data.month, data.year);

    return db.playerSubscription.create({
      data: {
        playerId,
        month: data.month,
        year: data.year,
        amount: data.amount,
        totalAmount: data.amount,
        dueDate,
        notes: data.notes,
      },
    });
  },

  async createBulk(data: {
    month: number; year: number; amount: number; clubCategoryId?: string; sendWhatsapp?: boolean;
  }) {
    const players = await db.player.findMany({
      where: {
        isClubPlayer: true,
        active: true,
        ...(data.clubCategoryId ? { clubCategoryId: data.clubCategoryId } : {}),
      },
    });

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

    const dueDate = getDueDate(data.month, data.year);

    const results = await Promise.allSettled(
      playersToCreate.map((p) =>
        db.playerSubscription.create({
          data: {
            playerId: p.id,
            month: data.month,
            year: data.year,
            amount: data.amount,
            totalAmount: data.amount,
            dueDate,
          },
        })
      )
    );
    const createdCount = results.filter((r) => r.status === 'fulfilled').length;
    const skipped = players.length - playersToCreate.length;

    const monthName = MONTHS[data.month - 1];
    const APP_URL = env.APP_URL ?? '';
    const waMessages: { phone: string; playerName: string; link: string; month: string; year: number; waUrl: string }[] = [];
    const mpErrors: { playerName: string; error: string }[] = [];

    if (data.sendWhatsapp) {
      const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];

      const { results: mpResults, errors: mpErrs } = await mapWithConcurrency(fulfilled, 3, async (result) => {
        const sub = result.value as any;
        const player = players.find(p => p.id === sub.playerId);
        if (!player) return null;

        let paymentLink = '';
        try {
          const { preferenceId, paymentLink: mpLink } = await createPlayerMpPreference(sub, player);
          paymentLink = mpLink;
          await db.playerSubscription.update({
            where: { id: sub.id },
            data: { mpPreferenceId: preferenceId, mpPaymentLink: paymentLink, status: 'LINK_SENT' },
          });
        } catch (e: any) {
          mpErrors.push({ playerName: player.fullName, error: e.message });
        }

        const memberLink = await db.memberPlayer.findFirst({
          where: { playerId: sub.playerId },
          include: { member: { select: { fullName: true, phone: true } } },
        });

        if (memberLink?.member.phone && memberLink.member.phone.trim()) {
          const phone = normalizePhone(memberLink.member.phone);
          const link = paymentLink || APP_URL;
          const msg = paymentLink
            ? `Hola! 👋 Te enviamos el link de pago de la cuota ${monthName} ${data.year} de ${player.fullName}: ${paymentLink}`
            : `Hola! 👋 La cuota de ${monthName} ${data.year} de ${player.fullName} ya está generada. Ingresá a la app para pagarla: ${APP_URL}`;
          waMessages.push({ phone, playerName: player.fullName, link: paymentLink, month: monthName, year: data.year, waUrl: buildWhatsAppUrl(phone, msg) });
        }

        return { subId: sub.id, playerName: player.fullName };
      });

      for (const err of mpErrs) {
        const player = fulfilled[err.index]?.value;
        mpErrors.push({ playerName: players.find(p => p.id === player?.value?.playerId)?.fullName ?? '??', error: String(err.error) });
      }
    }

    return { created: createdCount, total: players.length, skipped, waMessages, mpErrors };
  },

  async sendPaymentLink(subId: string, customAmount?: number) {
    const sub = await db.playerSubscription.findUnique({
      where: { id: subId },
      include: { player: true },
    });
    if (!sub) throw new AppError('Cuota no encontrada', 404);
    if (sub.status === 'PAID') throw new AppError('La cuota ya está pagada', 400);

    const { preferenceId, paymentLink } = await createPlayerMpPreference(sub, sub.player, customAmount);

    const updateData: any = { mpPreferenceId: preferenceId, mpPaymentLink: paymentLink, status: 'LINK_SENT' };
    if (customAmount) updateData.amount = customAmount;

    return db.playerSubscription.update({ where: { id: subId }, data: updateData });
  },

  async markPaid(subId: string, includeChildren: boolean = false) {
    const sub = await db.playerSubscription.findUnique({
      where: { id: subId },
      include: {
        player: {
          include: { memberLinks: { select: { memberId: true } } },
        },
      },
    });
    if (!sub) throw new AppError('Cuota no encontrada', 404);

    const now = new Date();
    const lateFee = calculateLateFee(sub.amount, now, sub.dueDate);

    const updated = await db.playerSubscription.update({
      where: { id: subId },
      data: {
        status: 'PAID',
        paidAt: now,
        lateFee,
        totalAmount: sub.amount + lateFee,
      },
    });

    // Optional: explicitly mark linked Member Subscriptions for same month/year as PAID
    if (includeChildren && sub.player?.memberLinks?.length) {
      await db.subscription.updateMany({
        where: {
          memberId: { in: sub.player.memberLinks.map((l) => l.memberId) },
          month: sub.month,
          year: sub.year,
          status: { not: 'PAID' },
        },
        data: { status: 'PAID', paidAt: now },
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
