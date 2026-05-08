import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export class RefereesService {
  async findAll(query: Record<string, unknown>) {
    const { active } = query;
    const where = active !== undefined ? { active: active === 'true' } : {};
    const data = await db.referee.findMany({
      where,
      orderBy: { fullName: 'asc' },
    });
    return { data };
  }

  async findById(id: string) {
    const referee = await db.referee.findUnique({
      where: { id },
      include: {
        matches: {
          orderBy: { scheduledAt: 'desc' },
          take: 10,
          include: {
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!referee) throw new AppError('Árbitro no encontrado', 404);
    return referee;
  }

  async create(data: { fullName: string; contact?: string; certifications?: string[] }) {
    return db.referee.create({ data: { ...data, certifications: data.certifications ?? [] } });
  }

  async update(id: string, data: Partial<Parameters<typeof this.create>[0]>) {
    await this.findById(id);
    return db.referee.update({ where: { id }, data });
  }

  async toggle(id: string) {
    const ref = await this.findById(id);
    return db.referee.update({ where: { id }, data: { active: !ref.active } });
  }

  async remove(id: string) {
    await this.findById(id);
    await db.referee.delete({ where: { id } });
  }
}
