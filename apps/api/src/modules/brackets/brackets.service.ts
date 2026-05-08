import { BracketStage } from '@prisma/client';
import { db } from '../../config/database';
import { initializeBracket } from '../../lib/bracket-engine';

export class BracketsService {
  async getByCategory(categoryId: string) {
    const brackets = await db.bracket.findMany({
      where: { categoryId },
      include: {
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, shieldUrl: true } },
            awayTeam: { select: { id: true, name: true, shieldUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { stage: 'asc' },
    });

    const STAGE_ORDER: BracketStage[] = [
      'ROUND_OF_16',
      'QUARTER_FINAL',
      'SEMI_FINAL',
      'THIRD_PLACE',
      'FINAL',
    ];

    return brackets.sort(
      (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)
    );
  }

  async initialize(data: {
    categoryId: string;
    stage: string;
    teamIds: string[];
    scheduledAt: string;
  }) {
    return initializeBracket(
      data.categoryId,
      data.stage as BracketStage,
      data.teamIds,
      new Date(data.scheduledAt)
    );
  }
}
