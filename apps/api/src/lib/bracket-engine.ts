import { BracketStage } from '@prisma/client';
import { db } from '../config/database';
import { AppError } from './app-error';

const STAGE_ORDER: BracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
];

export async function initializeBracket(
  categoryId: string,
  stage: BracketStage,
  teamIds: string[],
  scheduledAt: Date
) {
  if (teamIds.length < 2 || teamIds.length % 2 !== 0) {
    throw new AppError('Se necesita un número par de equipos (mínimo 2)', 400);
  }

  const bracket = await db.bracket.upsert({
    where: { categoryId_stage: { categoryId, stage } },
    create: { categoryId, stage },
    update: {},
  });

  const matchCreations = [];
  for (let i = 0; i < teamIds.length; i += 2) {
    matchCreations.push(
      db.match.create({
        data: {
          categoryId,
          bracketId: bracket.id,
          bracketStage: stage,
          homeTeamId: teamIds[i],
          awayTeamId: teamIds[i + 1],
          scheduledAt,
          status: 'SCHEDULED',
        },
      })
    );
  }

  const matches = await db.$transaction(matchCreations);
  return { bracket, matches };
}

export async function advanceWinnerFromMatch(matchId: string): Promise<void> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { bracket: true },
  });

  if (!match?.bracket || match.status !== 'FINISHED') return;
  if (match.homeScore === null || match.awayScore === null) return;

  const winnerId =
    match.homeScore > match.awayScore
      ? match.homeTeamId
      : match.awayScore > match.homeScore
        ? match.awayTeamId
        : null;

  if (!winnerId) return;

  const currentIdx = STAGE_ORDER.indexOf(match.bracket.stage);
  if (currentIdx === -1 || currentIdx >= STAGE_ORDER.length - 1) return;

  const nextStage = STAGE_ORDER[currentIdx + 1];

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

  const slot = nextMatches.find((m) => !m.homeTeamId || !m.awayTeamId);
  if (!slot) return;

  await db.match.update({
    where: { id: slot.id },
    data: slot.homeTeamId ? { awayTeamId: winnerId } : { homeTeamId: winnerId },
  });
}
