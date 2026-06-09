import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../lib/app-error';
import { mpService } from './mp.service';

const memberSelect = {
  id: true, fullName: true, dni: true, email: true,
  phone: true, address: true, username: true, active: true,
  createdAt: true, updatedAt: true,
};

export const membersService = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  async login(username: string, password: string) {
    const member = await db.member.findFirst({
      where: { OR: [{ username }, { email: username }], active: true },
    });
    if (!member) throw new AppError('Credenciales inválidas', 401);
    const valid = await bcrypt.compare(password, member.password);
    if (!valid) throw new AppError('Credenciales inválidas', 401);

    const accessToken = jwt.sign(
      { id: member.id, type: 'member' },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    const { password: _, ...safe } = member;
    return { accessToken, member: safe };
  },

  async me(memberId: string) {
    const member = await db.member.findUnique({
      where: { id: memberId },
      select: {
        ...memberSelect,
        players: {
          include: {
            player: {
              include: {
                clubCategory: { select: { id: true, name: true, coach: true } },
                team: { include: { category: true } },
                events: { include: { match: true } },
                sanctions: { where: { resolved: false } },
                subscriptions: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
              },
            },
          },
        },
        subscriptions: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
    });
    if (!member) throw new AppError('Socio no encontrado', 404);
    return member;
  },

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async list() {
    const members = await db.member.findMany({
      select: {
        ...memberSelect,
        players: { select: { player: { select: { fullName: true, id: true } } } },
        subscriptions: { where: { status: { in: ['PENDING', 'LINK_SENT', 'OVERDUE'] } }, select: { id: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    return members.map((m) => ({ ...m, pendingCount: m.subscriptions.length }));
  },

  async get(id: string) {
    const member = await db.member.findUnique({
      where: { id },
      select: {
        ...memberSelect,
        players: {
          include: {
            player: {
              include: {
                team: { include: { category: true } },
                subscriptions: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
              },
            },
          },
        },
        subscriptions: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
      },
    });
    if (!member) throw new AppError('Socio no encontrado', 404);
    return member;
  },

  async create(data: {
    fullName: string; dni: string; email: string; phone?: string;
    address?: string; username: string; password: string;
  }) {
    const exists = await db.member.findFirst({
      where: { OR: [{ dni: data.dni }, { email: data.email }, { username: data.username }] },
    });
    if (exists) throw new AppError('Ya existe un socio con ese DNI, email o usuario', 409);
    const password = await bcrypt.hash(data.password, 10);
    return db.member.create({ data: { ...data, password }, select: memberSelect });
  },

  async update(id: string, data: {
    fullName?: string; phone?: string; address?: string; active?: boolean; password?: string;
  }) {
    const payload: any = { ...data };
    if (data.password) payload.password = await bcrypt.hash(data.password, 10);
    return db.member.update({ where: { id }, data: payload, select: memberSelect });
  },

  async remove(id: string) {
    return db.member.delete({ where: { id } });
  },

  // ── Players ───────────────────────────────────────────────────────────────
  async linkPlayer(memberId: string, playerId: string) {
    return db.memberPlayer.create({
      data: { memberId, playerId },
      include: { player: { include: { team: { include: { category: true } } } } },
    });
  },

  async unlinkPlayer(memberId: string, playerId: string) {
    return db.memberPlayer.deleteMany({ where: { memberId, playerId } });
  },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  async listAllSubscriptions(params: { status?: string; month?: number; year?: number }) {
    const { status, month, year } = params;
    return db.subscription.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
      },
      include: {
        member: {
          select: {
            id: true, fullName: true, email: true, phone: true, username: true,
            players: {
              include: {
                player: {
                  select: { id: true, fullName: true, clubCategory: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { member: { fullName: 'asc' } }],
    });
  },

  async listSubscriptions(memberId: string) {
    return db.subscription.findMany({
      where: { memberId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  },

  async createSubscription(memberId: string, data: {
    month: number; year: number; amount: number; dueDate: string; notes?: string; childAmount?: number;
  }) {
    const { childAmount, ...rest } = data;
    const sub = await db.subscription.create({
      data: { memberId, ...rest, dueDate: new Date(rest.dueDate) },
    });

    // Create PlayerSubscriptions for linked players if childAmount provided
    if (childAmount) {
      const links = await db.memberPlayer.findMany({
        where: { memberId },
        select: { playerId: true },
      });
      await Promise.allSettled(
        links.map((link) =>
          db.playerSubscription.upsert({
            where: { playerId_month_year: { playerId: link.playerId, month: data.month, year: data.year } },
            create: { playerId: link.playerId, month: data.month, year: data.year, amount: childAmount, dueDate: new Date(data.dueDate) },
            update: {},
          })
        )
      );
    }

    return sub;
  },

  async createBulkSubscriptions(month: number, year: number, amount: number, dueDateStr: string, childAmount?: number, sendWhatsapp?: boolean) {
    const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = MONTHS[month - 1];
    const normalizePhone = (phone: string) => {
      const d = phone.replace(/\D/g, '');
      if (d.startsWith('549')) return d;
      if (d.startsWith('54')) return `9${d}`;
      return `549${d}`;
    };

    const members = await db.member.findMany({
      where: { active: true },
      include: { players: { select: { playerId: true } } },
    });
    const dueDate = new Date(dueDateStr);

    const results = await Promise.allSettled(
      members.map((m) =>
        db.subscription.upsert({
          where: { memberId_month_year: { memberId: m.id, month, year } },
          create: { memberId: m.id, month, year, amount, dueDate },
          update: {},
        })
      )
    );
    const created = results.filter((r) => r.status === 'fulfilled').length;

    // Also create PlayerSubscriptions for linked children if childAmount provided
    let childrenCreated = 0;
    if (childAmount) {
      for (const m of members) {
        for (const link of m.players) {
          try {
            await db.playerSubscription.upsert({
              where: { playerId_month_year: { playerId: link.playerId, month, year } },
              create: { playerId: link.playerId, month, year, amount: childAmount, dueDate },
              update: {},
            });
            childrenCreated++;
          } catch { /* skip individual failures */ }
        }
      }
    }

    // Generate MP links and WhatsApp messages if requested
    const APP_URL = env.APP_URL ?? '';
    const waMessages: { phone: string; name: string; link: string; month: string; year: number; waUrl: string }[] = [];
    if (sendWhatsapp) {
      const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      for (const result of fulfilled) {
        const sub = result.value as any;
        try {
          const member = await db.member.findUnique({
            where: { id: sub.memberId },
            select: { fullName: true, email: true, phone: true },
          });
          if (!member) continue;

          // Fetch child subs for this member
          const links = await db.memberPlayer.findMany({
            where: { memberId: sub.memberId },
            include: { player: { select: { id: true, fullName: true } } },
          });
          const childSubs = links.length
            ? await db.playerSubscription.findMany({
                where: {
                  playerId: { in: links.map(l => l.playerId) },
                  month, year,
                },
                include: { player: { select: { fullName: true } } },
              })
            : [];

          let paymentLink = '';
          try {
            const { id: preferenceId, init_point: mpLink } = await mpService.createPreference(sub, member, childSubs);
            paymentLink = mpLink;
            await db.subscription.update({
              where: { id: sub.id },
              data: { mpPreferenceId: preferenceId, mpPaymentLink: paymentLink, status: 'LINK_SENT' },
            });
          } catch (e) { console.error(`[MP] Error al generar link para ${member.fullName}:`, e); }

          if (member.phone && member.phone.trim()) {
            const phone = normalizePhone(member.phone);
            const link = paymentLink || APP_URL;
            const msg = paymentLink
              ? encodeURIComponent(`Hola ${member.fullName}! 👋 Te enviamos el link de pago de la cuota de ${monthName} ${year}: ${paymentLink}`)
              : encodeURIComponent(`Hola ${member.fullName}! 👋 La cuota de ${monthName} ${year} ya está generada. Ingresá a la app para pagarla: ${APP_URL}`);
            waMessages.push({ phone, name: member.fullName, link: paymentLink, month: monthName, year, waUrl: `https://wa.me/${phone}?text=${msg}` });
          }
        } catch { /* skip individual errors */ }
      }
    }

    return { created, total: members.length, childrenCreated, waMessages };
  },

  async sendPaymentLink(subId: string) {
    const sub = await db.subscription.findUniqueOrThrow({
      where: { id: subId },
      include: {
        member: {
          include: {
            players: {
              include: { player: { select: { id: true, fullName: true } } },
            },
          },
        },
      },
    });
    if (sub.status === 'PAID') throw new AppError('La cuota ya está pagada', 400);

    // Also fetch children's PlayerSubscriptions for same month/year
    const childSubs = sub.member?.players?.length
      ? await db.playerSubscription.findMany({
          where: {
            playerId: { in: sub.member.players.map((p) => p.playerId) },
            month: sub.month,
            year: sub.year,
          },
          include: { player: { select: { fullName: true } } },
        })
      : [];

    const { id: preferenceId, init_point: paymentLink } = await mpService.createPreference(sub, sub.member, childSubs);

    return db.subscription.update({
      where: { id: subId },
      data: { mpPreferenceId: preferenceId, mpPaymentLink: paymentLink, status: 'LINK_SENT' },
    });
  },

  async markPaid(subId: string) {
    const sub = await db.subscription.findUnique({
      where: { id: subId },
      include: {
        member: { include: { players: { select: { playerId: true } } } },
      },
    });
    if (!sub) throw new AppError('Cuota no encontrada', 404);

    const updated = await db.subscription.update({
      where: { id: subId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // Auto-mark linked children's PlayerSubscriptions for same month/year as PAID
    if (sub.member?.players?.length) {
      await db.playerSubscription.updateMany({
        where: {
          playerId: { in: sub.member.players.map((p) => p.playerId) },
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
    return db.subscription.update({ where: { id: subId }, data: { status: 'OVERDUE' } });
  },

  async deleteSubscription(subId: string) {
    return db.subscription.delete({ where: { id: subId } });
  },

  // ── Webhook ───────────────────────────────────────────────────────────────
  async handleMpWebhook(body: any) {
    const type = body.type ?? body.action;
    if (type !== 'payment') return { ignored: true };

    const paymentId = body.data?.id ?? body.id;
    if (!paymentId) return { ignored: true };

    // Fetch payment details from MP to get external_reference
    const { env: envCfg } = await import('../../config/env');
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${envCfg.MP_ACCESS_TOKEN}` },
    });
    if (!response.ok) return { ignored: true };

    const payment = await response.json() as { status: string; external_reference?: string };
    if (payment.status !== 'approved') return { ignored: true };

    const subId = payment.external_reference;
    if (!subId) return { ignored: true };

    await db.subscription.updateMany({
      where: { id: subId, status: { not: 'PAID' } },
      data: { status: 'PAID', paidAt: new Date(), mpPaymentId: String(paymentId) },
    });

    return { processed: true, subId };
  },
};
