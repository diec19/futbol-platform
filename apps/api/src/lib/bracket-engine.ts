import { BracketStage } from '@prisma/client';
import { db } from '../config/database';
import { AppError } from './app-error';
import { STAGE_ORDER, computeMatchWinner, computeNextStage, computeFirstRoundPairings, findFreeSlot, winnerSlot } from './bracket-utils';

export async function initializeBracket(
  categoryId: string,
  stage: BracketStage,
  teamIds: string[],
  scheduledAt: Date
) {
  const pairings = computeFirstRoundPairings(teamIds);

  const bracket = await db.bracket.upsert({
    where: { categoryId_stage: { categoryId, stage } },
    create: { categoryId, stage },
    update: {},
  });

  const matchCreations = pairings.map(([homeTeamId, awayTeamId]) =>
    db.match.create({
      data: {
        categoryId,
        bracketId: bracket.id,
        bracketStage: stage,
        homeTeamId,
        awayTeamId,
        scheduledAt,
        status: 'SCHEDULED',
      },
    })
  );

  const matches = await db.$transaction([
    db.match.deleteMany({ where: { bracketId: bracket.id } }),
    ...matchCreations,
  ]);
  return { bracket, matches };
}

export async function advanceWinnerFromMatch(matchId: string): Promise<void> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { bracket: true },
  });

  if (!match?.bracket || match.status !== 'FINISHED') return;
  const winnerId = computeMatchWinner(match);
  if (!winnerId) return;

  const nextStage = computeNextStage(match.bracket.stage as BracketStage);
  if (!nextStage) return;

  const nextBracket = await db.bracket.findUnique({
    where: {
      categoryId_stage: { categoryId: match.categoryId, stage: nextStage },
    },
  });
  if (!nextBracket) return;

  const nextMatches = await db.match.findMany({
    where: { bracketId: nextBracket.id },
    orderBy: { createdAt: 'asc' },
  });

  const slot = findFreeSlot(nextMatches);
  if (!slot) return;

  await db.match.update({
    where: { id: slot.id },
    data: winnerSlot(slot) === 'home' ? { homeTeamId: winnerId } : { awayTeamId: winnerId },
  });
}