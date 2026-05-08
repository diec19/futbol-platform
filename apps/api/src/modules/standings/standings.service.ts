import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';
import { recalculateGroupStandings } from '../../lib/standings-calculator';

export class StandingsService {
  async getByGroup(groupId: string) {
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        category: { select: { id: true, name: true } },
        teams: {
          include: {
            team: { select: { id: true, name: true, shieldUrl: true } },
          },
          orderBy: [
            { points: 'desc' },
            { goalDiff: 'desc' },
            { goalsFor: 'desc' },
          ],
        },
      },
    });
    if (!group) throw new AppError('Grupo no encontrado', 404);
    return group;
  }

  async getByCategory(categoryId: string) {
    const groups = await db.group.findMany({
      where: { categoryId },
      include: {
        teams: {
          include: {
            team: { select: { id: true, name: true, shieldUrl: true } },
          },
          orderBy: [
            { points: 'desc' },
            { goalDiff: 'desc' },
            { goalsFor: 'desc' },
          ],
        },
      },
      orderBy: { name: 'asc' },
    });
    return groups;
  }

  async recalculate(groupId: string) {
    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError('Grupo no encontrado', 404);
    await recalculateGroupStandings(groupId);
  }

  async createGroup(data: { categoryId: string; name: string }) {
    return db.group.create({ data });
  }

  async addTeamsToGroup(groupId: string, teamIds: string[]) {
    const group = await db.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError('Grupo no encontrado', 404);

    await db.groupTeam.createMany({
      data: teamIds.map((teamId) => ({
        groupId,
        teamId,
        categoryId: group.categoryId,
      } as any)),
      skipDuplicates: true,
    });

    return this.getByGroup(groupId);
  }
}
