import { db } from '../config/database';

export async function recalculateGroupStandings(groupId: string): Promise<void> {
  const matches = await db.match.findMany({
    where: { groupId, status: 'FINISHED' },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
    },
  });

  const stats: Record<
    string,
    {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDiff: number;
      points: number;
    }
  > = {};

  const init = (id: string) => {
    if (!stats[id]) {
      stats[id] = {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      };
    }
  };

  for (const match of matches) {
    if (match.homeScore === null || match.awayScore === null) continue;

    init(match.homeTeamId);
    init(match.awayTeamId);

    const home = stats[match.homeTeamId];
    const away = stats[match.awayTeamId];

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;
    home.goalDiff = home.goalsFor - home.goalsAgainst;
    away.goalDiff = away.goalsFor - away.goalsAgainst;

    if (match.homeScore > match.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      home.points += 1;
      away.drawn++;
      away.points += 1;
    }
  }

  await db.$transaction(
    Object.entries(stats).map(([teamId, s]) =>
      db.groupTeam.update({
        where: { groupId_teamId: { groupId, teamId } },
        data: s,
      })
    )
  );
}
