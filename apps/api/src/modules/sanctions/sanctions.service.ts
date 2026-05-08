import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export class SanctionsService {
  async findAll(query: Record<string, unknown>) {
    const { playerId, resolved, categoryId } = query;
    const where: Record<string, unknown> = {};
    if (playerId) where.playerId = playerId;
    if (resolved !== undefined) where.resolved = resolved === 'true';
    if (categoryId) where.player = { team: { categoryId } };

    const data = await db.sanction.findMany({
      where,
      include: {
        player: {
          include: { team: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findById(id: string) {
    const sanction = await db.sanction.findUnique({
      where: { id },
      include: {
        player: { include: { team: { select: { id: true, name: true } } } },
      },
    });
    if (!sanction) throw new AppError('Sanción no encontrada', 404);
    return sanction;
  }

  async create(data: {
    playerId: string;
    reason: string;
    matchesBan: number;
    startDate: string;
    notes?: string;
  }) {
    return db.sanction.create({
      data: { ...data, startDate: new Date(data.startDate) },
      include: {
        player: { include: { team: { select: { id: true, name: true } } } },
      },
    });
  }

  async resolve(id: string) {
    await this.findById(id);
    return db.sanction.update({
      where: { id },
      data: { resolved: true, endDate: new Date() },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await db.sanction.delete({ where: { id } });
  }
}
