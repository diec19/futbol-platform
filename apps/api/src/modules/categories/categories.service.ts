import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export class CategoriesService {
  async findAll(query: Record<string, unknown>) {
    const { tournamentId, active } = query;
    const where: Record<string, unknown> = {};
    if (tournamentId) where.tournamentId = tournamentId;
    if (active !== undefined) where.active = active === 'true';

    const data = await db.category.findMany({
      where,
      include: {
        tournament: { select: { id: true, name: true } },
        _count: { select: { teams: true, matches: true } },
      },
      orderBy: { name: 'asc' },
    });

    return { data };
  }

  async findById(id: string) {
    const category = await db.category.findUnique({
      where: { id },
      include: {
        tournament: { select: { id: true, name: true, status: true } },
        teams: {
          where: { active: true },
          include: { _count: { select: { players: true } } },
          orderBy: { name: 'asc' },
        },
        groups: {
          include: { teams: { include: { team: true }, orderBy: { points: 'desc' } } },
        },
      },
    });
    if (!category) throw new AppError('Categoría no encontrada', 404);
    return category;
  }

  async create(data: {
    tournamentId: string;
    name: string;
    minAge?: number;
    maxAge?: number;
    birthYear?: number;
    maxPlayers?: number;
    rules?: string;
    phaseType?: string;
  }) {
    return db.category.create({ data: { ...data, phaseType: data.phaseType as any } });
  }

  async update(id: string, data: Partial<Parameters<typeof this.create>[0]>) {
    await this.findById(id);
    return db.category.update({ where: { id }, data: { ...data, phaseType: data.phaseType as any } });
  }

  async toggle(id: string) {
    const category = await this.findById(id);
    return db.category.update({
      where: { id },
      data: { active: !category.active },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await db.category.delete({ where: { id } });
  }
}
