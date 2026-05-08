import { EventType, MatchStatus } from '@prisma/client';
import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';
import { generateGroupFixture } from '../../lib/fixture-generator';
import { recalculateGroupStandings } from '../../lib/standings-calculator';
import { advanceWinnerFromMatch } from '../../lib/bracket-engine';

const MATCH_INCLUDE = {
  homeTeam: { select: { id: true, name: true, shieldUrl: true } },
  awayTeam: { select: { id: true, name: true, shieldUrl: true } },
  referee: { select: { id: true, fullName: true } },
  group: { select: { id: true, name: true } },
  events: {
    include: {
      player: { select: { id: true, fullName: true, shirtNumber: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { minute: 'asc' as const },
  },
};

export class MatchesService {
  async findAll(query: Record<string, unknown>) {
    const { categoryId, groupId, status, round, teamId, page = 1, limit = 20 } = query;
    const where: Record<string, unknown> = {};

    if (categoryId) where.categoryId = categoryId;
    if (groupId) where.groupId = groupId;
    if (status) where.status = status as MatchStatus;
    if (round) where.round = Number(round);
    if (teamId) {
      where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      db.match.findMany({
        where,
        include: {
          homeTeam: { select: { id: true, name: true, shieldUrl: true } },
          awayTeam: { select: { id: true, name: true, shieldUrl: true } },
          referee: { select: { id: true, fullName: true } },
          group: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: Number(limit),
      }),
      db.match.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    };
  }

  async findById(id: string) {
    const match = await db.match.findUnique({ where: { id }, include: MATCH_INCLUDE });
    if (!match) throw new AppError('Partido no encontrado', 404);
    return match;
  }

  async create(data: {
    categoryId: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt: string;
    venue?: string;
    refereeId?: string;
    round?: number;
    groupId?: string;
    bracketStage?: string;
    notes?: string;
  }) {
    if (data.homeTeamId === data.awayTeamId) {
      throw new AppError('Los equipos local y visitante deben ser distintos', 400);
    }
    return db.match.create({
      data: { ...data, scheduledAt: new Date(data.scheduledAt), bracketStage: data.bracketStage as any },
      include: MATCH_INCLUDE,
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.findById(id);
    const updateData: Record<string, unknown> = { ...data };
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt as string);
    return db.match.update({ where: { id }, data: updateData, include: MATCH_INCLUDE });
  }

  async loadResult(
    id: string,
    data: {
      homeScore: number;
      awayScore: number;
      status?: MatchStatus;
      notes?: string;
      events?: Array<{
        type: string;
        playerId?: string;
        teamId: string;
        minute?: number;
        notes?: string;
      }>;
    }
  ) {
    const match = await this.findById(id);
    if (match.status === 'FINISHED') {
      throw new AppError('Este partido ya tiene resultado cargado', 400);
    }

    await db.$transaction(async (tx) => {
      // Delete previous events if re-loading
      await tx.matchEvent.deleteMany({ where: { matchId: id } });

      await tx.match.update({
        where: { id },
        data: {
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          status: data.status ?? 'FINISHED',
          notes: data.notes,
        },
      });

      if (data.events?.length) {
        await tx.matchEvent.createMany({
          data: data.events.map((e) => ({
            matchId: id,
            type: e.type as EventType,
            playerId: e.playerId,
            teamId: e.teamId,
            minute: e.minute,
            notes: e.notes,
          })),
        });
      }
    });

    if (match.groupId) {
      await recalculateGroupStandings(match.groupId);
    }

    if (match.bracketId) {
      await advanceWinnerFromMatch(id);
    }

    return this.findById(id);
  }

  async postpone(id: string, data: { scheduledAt?: string; notes?: string }) {
    await this.findById(id);
    return db.match.update({
      where: { id },
      data: {
        status: 'POSTPONED',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        notes: data.notes,
      },
      include: MATCH_INCLUDE,
    });
  }

  async generateFixture(data: {
    groupId: string;
    startDate: string;
    venue?: string;
    intervalDays?: number;
  }) {
    const group = await db.group.findUnique({
      where: { id: data.groupId },
      include: { teams: { select: { teamId: true } } },
    });
    if (!group) throw new AppError('Grupo no encontrado', 404);
    if (group.teams.length < 2) throw new AppError('El grupo necesita al menos 2 equipos', 400);

    return generateGroupFixture({
      categoryId: group.categoryId,
      groupId: data.groupId,
      teamIds: group.teams.map((t) => t.teamId),
      startDate: new Date(data.startDate),
      venue: data.venue,
      intervalDays: data.intervalDays,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await db.match.delete({ where: { id } });
  }
}
