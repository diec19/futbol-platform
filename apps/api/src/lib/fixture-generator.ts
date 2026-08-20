import { db } from '../config/database';

interface FixtureOptions {
  categoryId: string;
  groupId: string;
  teamIds: string[];
  startDate: Date;
  venue?: string;
  intervalDays?: number;
}

export interface FixtureMatch {
  homeTeamId: string;
  awayTeamId: string;
  round: number;
  scheduledAt: Date;
  venue?: string;
}

// Lógica pura de generación de fixture (round robin, alternancia local/visita, BYE).
// Extraída para poder testearla sin tocar la DB.
export function computeGroupFixture(
  teamIds: string[],
  startDate: Date,
  intervalDays = 7,
  venue?: string,
): FixtureMatch[] {
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push('BYE');

  const n = teams.length;
  const rounds = n - 1;
  const matchesPerRound = n / 2;
  const fixtures: FixtureMatch[] = [];

  for (let round = 0; round < rounds; round++) {
    const roundDate = new Date(startDate);
    roundDate.setDate(roundDate.getDate() + round * intervalDays);

    for (let match = 0; match < matchesPerRound; match++) {
      const home = teams[match];
      const away = teams[n - 1 - match];

      if (home !== 'BYE' && away !== 'BYE') {
        // Alternate home/away each round
        fixtures.push({
          homeTeamId: round % 2 === 0 ? home : away,
          awayTeamId: round % 2 === 0 ? away : home,
          round: round + 1,
          scheduledAt: new Date(roundDate),
          venue,
        });
      }
    }

    // Rotate teams: pin index 0, rotate the rest
    const last = teams.splice(n - 1, 1)[0];
    teams.splice(1, 0, last);
  }

  return fixtures;
}

export async function generateGroupFixture(options: FixtureOptions) {
  const { categoryId, groupId, teamIds, startDate, venue, intervalDays = 7 } = options;

  const fixtures = computeGroupFixture(teamIds, startDate, intervalDays, venue);

  const created = await db.$transaction(
    fixtures.map((f) =>
      db.match.create({
        data: {
          categoryId,
          groupId,
          homeTeamId: f.homeTeamId,
          awayTeamId: f.awayTeamId,
          round: f.round,
          scheduledAt: f.scheduledAt,
          venue: f.venue,
          status: 'SCHEDULED',
        },
      })
    )
  );

  return created;
}