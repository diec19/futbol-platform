import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export const benefitsService = {
  async listActive() {
    return db.benefit.findMany({
      where: { active: true },
      include: { sponsor: { select: { id: true, name: true, logoUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listAll() {
    return db.benefit.findMany({
      include: { sponsor: { select: { id: true, name: true, logoUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async get(id: string) {
    const benefit = await db.benefit.findUnique({
      where: { id },
      include: { sponsor: { select: { id: true, name: true, logoUrl: true } } },
    });
    if (!benefit) throw new AppError('Beneficio no encontrado', 404);
    return benefit;
  },

  async create(data: { title: string; description?: string; imageUrl?: string; type?: string; sponsorId?: string }) {
    return db.benefit.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        type: data.type ?? 'EXTERNAL',
        sponsorId: data.sponsorId,
      },
      include: { sponsor: { select: { id: true, name: true, logoUrl: true } } },
    });
  },

  async update(id: string, data: { title?: string; description?: string; imageUrl?: string; type?: string; sponsorId?: string; active?: boolean }) {
    const benefit = await db.benefit.findUnique({ where: { id } });
    if (!benefit) throw new AppError('Beneficio no encontrado', 404);

    return db.benefit.update({
      where: { id },
      data,
      include: { sponsor: { select: { id: true, name: true, logoUrl: true } } },
    });
  },

  async remove(id: string) {
    const benefit = await db.benefit.findUnique({ where: { id } });
    if (!benefit) throw new AppError('Beneficio no encontrado', 404);
    return db.benefit.delete({ where: { id } });
  },

  async toggle(id: string) {
    const benefit = await db.benefit.findUnique({ where: { id } });
    if (!benefit) throw new AppError('Beneficio no encontrado', 404);
    return db.benefit.update({
      where: { id },
      data: { active: !benefit.active },
    });
  },
};
