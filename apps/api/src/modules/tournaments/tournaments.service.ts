import { TournamentStatus } from '@prisma/client';
import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export class TournamentsService {
  async findAll(query: Record<string, unknown>) {
    const { status, page = 1, limit = 20 } = query;
    const where = status ? { status: status as TournamentStatus } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [data, total] = await Promise.all([
      db.tournament.findMany({
        where,
        include: {
          categories: {
            select: { id: true, name: true, active: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.tournament.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findById(id: string) {
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            teams: {
              select: { id: true, name: true, shieldUrl: true, active: true },
              where: { active: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!tournament) throw new AppError('Torneo no encontrado', 404);
    return tournament;
  }

  async getStats(id: string) {
    await this.findById(id);
    const [categories, teams, players, matchesPlayed, goals] = await Promise.all([
      db.category.count({ where: { tournamentId: id } }),
      db.team.count({ where: { category: { tournamentId: id } } }),
      db.player.count({ where: { team: { category: { tournamentId: id } } } }),
      db.match.count({ where: { category: { tournamentId: id }, status: 'FINISHED' } }),
      db.matchEvent.count({
        where: {
          match: { category: { tournamentId: id } },
          type: { in: ['GOAL', 'OWN_GOAL'] },
        },
      }),
    ]);
    return { categories, teams, players, matchesPlayed, goals };
  }

  async create(data: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status?: TournamentStatus;
    logoUrl?: string;
    sponsor?: string;
    rules?: string;
  }) {
    return db.tournament.create({ data: { ...data, status: data.status ?? 'DRAFT' } });
  }

  async update(id: string, data: Partial<ReturnType<typeof this.create extends (...args: any[]) => Promise<infer R> ? any : any>>) {
    await this.findById(id);
    return db.tournament.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: string) {
    const allowed: TournamentStatus[] = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'FINISHED'];
    if (!allowed.includes(status as TournamentStatus)) {
      throw new AppError('Estado inválido', 400);
    }
    await this.findById(id);
    return db.tournament.update({
      where: { id },
      data: { status: status as TournamentStatus },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await db.tournament.delete({ where: { id } });
  }
}
