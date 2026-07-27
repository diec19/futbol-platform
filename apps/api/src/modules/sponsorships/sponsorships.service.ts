import { SubscriptionStatus } from '@prisma/client';
import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

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

export const sponsorshipsService = {
  // ── List all sponsorships ──────────────────────────────────────────────
  async list(params: { sponsorId?: string; status?: string } = {}) {
    return db.sponsorship.findMany({
      where: {
        ...(params.sponsorId ? { sponsorId: params.sponsorId } : {}),
        ...(params.status ? { status: params.status as any } : {}),
      },
      include: {
        sponsor: { select: { id: true, name: true, logoUrl: true } },
        plan: { select: { id: true, name: true, monthlyAmount: true, durationMonths: true } },
        payments: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ── List all sponsor payments (cuotas page) ────────────────────────────
  async listPayments(params: { sponsorId?: string; status?: string; month?: number; year?: number }) {
    return db.sponsorshipPayment.findMany({
      where: {
        ...(params.sponsorId ? { sponsorship: { sponsorId: params.sponsorId } } : {}),
        ...(params.status ? { status: params.status as SubscriptionStatus } : {}),
        ...(params.month ? { month: params.month } : {}),
        ...(params.year ? { year: params.year } : {}),
      },
      include: {
        sponsorship: {
          include: {
            sponsor: { select: { id: true, name: true, logoUrl: true, phone: true } },
            plan: { select: { name: true, monthlyAmount: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { sponsorship: { sponsor: { name: 'asc' } } }],
    });
  },

  // ── Create a sponsorship ───────────────────────────────────────────────
  async create(data: { sponsorId: string; planId: string; startDate: string; endDate: string }) {
    const sponsor = await db.sponsor.findUnique({ where: { id: data.sponsorId } });
    if (!sponsor) throw new AppError('Auspiciante no encontrado', 404);

    const plan = await db.sponsorPlan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new AppError('Plan no encontrado', 404);

    return db.sponsorship.create({
      data: {
        sponsorId: data.sponsorId,
        planId: data.planId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      include: { sponsor: true, plan: true },
    });
  },

  // ── Generate monthly payments ──────────────────────────────────────────
  async generatePayments(sponsorshipId: string, data: { month: number; year: number; amount?: number }) {
    const sponsorship = await db.sponsorship.findUnique({
      where: { id: sponsorshipId },
      include: { plan: true, sponsor: true },
    });
    if (!sponsorship) throw new AppError('Auspiciarion no encontrado', 404);

    const existing = await db.sponsorshipPayment.findUnique({
      where: { sponsorshipId_month_year: { sponsorshipId, month: data.month, year: data.year } },
    });
    if (existing) throw new AppError('Ya existe una cuota para ese mes/año', 409);

    const amount = data.amount ?? sponsorship.plan.monthlyAmount;
    const dueDate = getDueDate(data.month, data.year);

    return db.sponsorshipPayment.create({
      data: {
        sponsorshipId,
        month: data.month,
        year: data.year,
        amount,
        totalAmount: amount,
        dueDate,
      },
      include: { sponsorship: { include: { sponsor: true, plan: true } } },
    });
  },

  // ── Bulk generate payments ─────────────────────────────────────────────
  async generateBulkPayments(data: { month: number; year: number; sponsorshipIds?: string[] }) {
    const where: any = { status: 'ACTIVE' };
    if (data.sponsorshipIds?.length) {
      where.id = { in: data.sponsorshipIds };
    }

    const sponsorships = await db.sponsorship.findMany({
      where,
      include: { plan: true, sponsor: true },
    });

    const existingSubs = await db.sponsorshipPayment.findMany({
      where: {
        sponsorshipId: { in: sponsorships.map(s => s.id) },
        month: data.month,
        year: data.year,
      },
      select: { sponsorshipId: true },
    });
    const existingIds = new Set(existingSubs.map(s => s.sponsorshipId));
    const toCreate = sponsorships.filter(s => !existingIds.has(s.id));

    const results = await Promise.allSettled(
      toCreate.map(s => {
        const dueDate = getDueDate(data.month, data.year);
        return db.sponsorshipPayment.create({
          data: {
            sponsorshipId: s.id,
            month: data.month,
            year: data.year,
            amount: s.plan.monthlyAmount,
            totalAmount: s.plan.monthlyAmount,
            dueDate,
          },
        });
      })
    );

    const createdCount = results.filter(r => r.status === 'fulfilled').length;
    return { created: createdCount, total: sponsorships.length, skipped: sponsorships.length - toCreate.length };
  },

  // ── Mark payment as paid ───────────────────────────────────────────────
  async markPaid(paymentId: string) {
    const payment = await db.sponsorshipPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new AppError('Cuota no encontrada', 404);

    const lateFee = calculateLateFee(payment.amount, new Date(), payment.dueDate);

    return db.sponsorshipPayment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        lateFee,
        totalAmount: payment.amount + lateFee,
      },
    });
  },

  // ── Remove payment ─────────────────────────────────────────────────────
  async removePayment(paymentId: string) {
    return db.sponsorshipPayment.delete({ where: { id: paymentId } });
  },

  // ── Cancel sponsorship ─────────────────────────────────────────────────
  async cancel(sponsorshipId: string) {
    const sponsorship = await db.sponsorship.findUnique({ where: { id: sponsorshipId } });
    if (!sponsorship) throw new AppError('Auspiciarion no encontrado', 404);
    return db.sponsorship.update({
      where: { id: sponsorshipId },
      data: { status: 'CANCELLED' },
    });
  },
};
