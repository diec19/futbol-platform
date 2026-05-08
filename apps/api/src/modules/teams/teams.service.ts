import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export class TeamsService {
  async findAll(query: Record<string, unknown>) {
    const { categoryId, active } = query;
    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;
    if (active !== undefined) where.active = active === 'true';

    const data = await db.team.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, tournamentId: true } },
        _count: { select: { players: { where: { active: true } } } },
      },
      orderBy: { name: 'asc' },
    });
    return { data };
  }

  async findById(id: string) {
    const team = await db.team.findUnique({
      where: { id },
      include: {
        category: { include: { tournament: { select: { id: true, name: true } } } },
        players: {
          where: { active: true },
          orderBy: [{ shirtNumber: 'asc' }, { fullName: 'asc' }],
        },
      },
    });
    if (!team) throw new AppError('Equipo no encontrado', 404);
    return team;
  }

  async create(data: {
    categoryId: string;
    name: string;
    shieldUrl?: string;
    delegateName?: string;
    contact?: string;
    address?: string;
  }) {
    return db.team.create({ data });
  }

  async update(id: string, data: Partial<Omit<Parameters<typeof this.create>[0], 'categoryId'>>) {
    await this.findById(id);
    return db.team.update({ where: { id }, data });
  }

  async toggle(id: string) {
    const team = await this.findById(id);
    return db.team.update({ where: { id }, data: { active: !team.active } });
  }

  async remove(id: string) {
    await this.findById(id);
    await db.team.delete({ where: { id } });
  }
}
