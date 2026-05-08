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
    const now = new Date();
    const member = await db.member.findUnique({
      where: { id: memberId },
      select: {
        ...memberSelect,
        players: {
          include: {
            player: {
              include: {
                team: { include: { category: true } },
                events: { include: { match: true } },
                sanctions: { where: { resolved: false } },
              },
            },
          },
        },
        subscriptions: {
          where: { year: now.getFullYear(), month: now.getMonth() + 1 },
          orderBy: { createdAt: 'desc' },
          take: 1,
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
          include: { player: { include: { team: { include: { category: true } } } } },
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
  async listSubscriptions(memberId: string) {
    return db.subscription.findMany({
      where: { memberId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  },

  async createSubscription(memberId: string, data: {
    month: number; year: number; amount: number; dueDate: string; notes?: string;
  }) {
    return db.subscription.create({
      data: { memberId, ...data, dueDate: new Date(data.dueDate) },
    });
  },

  async createBulkSubscriptions(month: number, year: number, amount: number, dueDateStr: string) {
    const members = await db.member.findMany({ where: { active: true }, select: { id: true } });
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
    return { created, total: members.length };
  },

  async sendPaymentLink(subId: string) {
    const sub = await db.subscription.findUniqueOrThrow({
      where: { id: subId },
      include: { member: true },
    });
    if (sub.status === 'PAID') throw new AppError('La cuota ya está pagada', 400);

    const { preferenceId, paymentLink } = await mpService.createPreference(sub, sub.member);

    return db.subscription.update({
      where: { id: subId },
      data: { mpPreferenceId: preferenceId, mpPaymentLink: paymentLink, status: 'LINK_SENT' },
    });
  },

  async markPaid(subId: string) {
    return db.subscription.update({
      where: { id: subId },
      data: { status: 'PAID', paidAt: new Date() },
    });
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
