import { Position } from '@prisma/client';
import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export class PlayersService {
  async findAll(query: Record<string, unknown>) {
    const { teamId, categoryId, position, active, search, page = 1, limit = 20 } = query;
    const where: Record<string, unknown> = {};

    if (teamId) where.teamId = teamId;
    if (active !== undefined) where.active = active === 'true';
    if (position) where.position = position as Position;
    if (categoryId) where.team = { categoryId };
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { dni: { contains: search as string } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      db.player.findMany({
        where,
        include: {
          team: { select: { id: true, name: true, shieldUrl: true } },
          sanctions: { where: { resolved: false }, select: { id: true, matchesBan: true, endDate: true } },
        },
        orderBy: [{ fullName: 'asc' }],
        skip,
        take: Number(limit),
      }),
      db.player.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    };
  }

  async findById(id: string) {
    const player = await db.player.findUnique({
      where: { id },
      include: {
        team: {
          include: { category: { include: { tournament: { select: { id: true, name: true } } } } },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          include: { match: { select: { id: true, scheduledAt: true, homeTeamId: true, awayTeamId: true } } },
        },
        sanctions: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!player) throw new AppError('Jugador no encontrado', 404);
    return player;
  }

  async create(data: {
    teamId: string;
    fullName: string;
    dni: string;
    birthDate: string;
    photoUrl?: string;
    shirtNumber?: number;
    position?: string;
    medicalStatus?: string;
    observations?: string;
  }) {
    return db.player.create({
      data: { ...data, birthDate: new Date(data.birthDate), position: data.position as Position | undefined },
    });
  }

  async update(id: string, data: Partial<Omit<Parameters<typeof this.create>[0], 'teamId'>>) {
    await this.findById(id);
    const updateData: Record<string, unknown> = { ...data };
    if (data.birthDate) updateData.birthDate = new Date(data.birthDate);
    if (data.position) updateData.position = data.position as Position;
    return db.player.update({ where: { id }, data: updateData });
  }

  async toggle(id: string) {
    const player = await this.findById(id);
    return db.player.update({ where: { id }, data: { active: !player.active } });
  }

  async remove(id: string) {
    await this.findById(id);
    await db.player.delete({ where: { id } });
  }
}
