import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export const sponsorsService = {
  async list() {
    return db.sponsor.findMany({
      include: { plans: { where: { active: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    const sponsor = await db.sponsor.findUnique({
      where: { id },
      include: {
        plans: { orderBy: { monthlyAmount: 'asc' } },
        sponsorships: {
          include: { plan: true, payments: { orderBy: [{ year: 'desc' }, { month: 'desc' }] } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!sponsor) throw new AppError('Auspiciante no encontrado', 404);
    return sponsor;
  },

  async create(data: { name: string; contactName?: string; phone?: string; email?: string; logoUrl?: string; website?: string }) {
    return db.sponsor.create({ data });
  },

  async update(id: string, data: Record<string, any>) {
    const sponsor = await db.sponsor.findUnique({ where: { id } });
    if (!sponsor) throw new AppError('Auspiciante no encontrado', 404);
    return db.sponsor.update({ where: { id }, data });
  },

  async toggle(id: string) {
    const sponsor = await db.sponsor.findUnique({ where: { id } });
    if (!sponsor) throw new AppError('Auspiciante no encontrado', 404);
    return db.sponsor.update({ where: { id }, data: { active: !sponsor.active } });
  },

  async remove(id: string) {
    const sponsor = await db.sponsor.findUnique({ where: { id }, include: { sponsorships: true } });
    if (!sponsor) throw new AppError('Auspiciante no encontrado', 404);
    if (sponsor.sponsorships.length > 0) {
      throw new AppError('No se puede eliminar: tiene auspiciariones activos', 400);
    }
    return db.sponsor.delete({ where: { id } });
  },

  // ── Plans ──────────────────────────────────────────────────────────────
  async listPlans(sponsorId: string) {
    return db.sponsorPlan.findMany({
      where: { sponsorId },
      orderBy: { monthlyAmount: 'asc' },
    });
  },

  async createPlan(sponsorId: string, data: { name: string; monthlyAmount: number; durationMonths?: number; description?: string }) {
    const sponsor = await db.sponsor.findUnique({ where: { id: sponsorId } });
    if (!sponsor) throw new AppError('Auspiciante no encontrado', 404);
    return db.sponsorPlan.create({
      data: { sponsorId, ...data, durationMonths: data.durationMonths ?? 6 },
    });
  },

  async updatePlan(planId: string, data: Record<string, any>) {
    const plan = await db.sponsorPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new AppError('Plan no encontrado', 404);
    return db.sponsorPlan.update({ where: { id: planId }, data });
  },

  async removePlan(planId: string) {
    const plan = await db.sponsorPlan.findUnique({ where: { id: planId }, include: { sponsorships: true } });
    if (!plan) throw new AppError('Plan no encontrado', 404);
    if (plan.sponsorships.length > 0) {
      throw new AppError('No se puede eliminar: tiene auspiciariones asignados', 400);
    }
    return db.sponsorPlan.delete({ where: { id: planId } });
  },
};
