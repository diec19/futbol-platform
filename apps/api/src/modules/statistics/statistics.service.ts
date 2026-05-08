import { db } from '../../config/database';

export class StatisticsService {
  async globalStats() {
    const [tournaments, activeTournaments, categories, teams, players, matchesPlayed, goals, sanctions] =
      await Promise.all([
        db.tournament.count(),
        db.tournament.count({ where: { status: 'ACTIVE' } }),
        db.category.count(),
        db.team.count(),
        db.player.count({ where: { active: true } }),
        db.match.count({ where: { status: 'FINISHED' } }),
        db.matchEvent.count({ where: { type: { in: ['GOAL', 'OWN_GOAL'] } } }),
        db.sanction.count({ where: { resolved: false } }),
      ]);
    return { tournaments, activeTournaments, categories, teams, players, matchesPlayed, goals, sanctions };
  }

  async tournamentSummary(tournamentId: string) {
    const [tournament, categories, teams, players, matchesPlayed, goals] =
      await Promise.all([
        db.tournament.findUnique({ where: { id: tournamentId } }),
        db.category.count({ where: { tournamentId } }),
        db.team.count({ where: { category: { tournamentId } } }),
        db.player.count({ where: { team: { category: { tournamentId } } } }),
        db.match.count({ where: { category: { tournamentId }, status: 'FINISHED' } }),
        db.matchEvent.count({
          where: {
            match: { category: { tournamentId } },
            type: { in: ['GOAL', 'OWN_GOAL'] },
          },
        }),
      ]);

    return { tournament, stats: { categories, teams, players, matchesPlayed, goals } };
  }

  async topScorers(categoryId: string, limit = 10) {
    const events = await db.matchEvent.groupBy({
      by: ['playerId'],
      where: {
        match: { categoryId },
        type: { in: ['GOAL'] },
        playerId: { not: null },
      },
      _count: { playerId: true },
      orderBy: { _count: { playerId: 'desc' } },
      take: limit,
    });

    return Promise.all(
      events.map(async (e) => {
        const player = await db.player.findUnique({
          where: { id: e.playerId! },
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            shirtNumber: true,
            team: { select: { id: true, name: true, shieldUrl: true } },
          },
        });
        return { ...player, goals: e._count.playerId };
      })
    );
  }

  async cardStats(categoryId: string) {
    const players = await db.player.findMany({
      where: { team: { category: { id: categoryId } }, active: true },
      select: {
        id: true,
        fullName: true,
        shirtNumber: true,
        team: { select: { id: true, name: true } },
        events: {
          where: {
            match: { categoryId },
            type: { in: ['YELLOW_CARD', 'RED_CARD', 'DOUBLE_YELLOW'] },
          },
          select: { type: true },
        },
      },
    });

    return players
      .map((p) => ({
        id: p.id,
        fullName: p.fullName,
        shirtNumber: p.shirtNumber,
        team: p.team,
        yellow: p.events.filter((e) => e.type === 'YELLOW_CARD').length,
        red: p.events.filter((e) => e.type === 'RED_CARD' || e.type === 'DOUBLE_YELLOW').length,
      }))
      .filter((p) => p.yellow > 0 || p.red > 0)
      .sort((a, b) => b.red - a.red || b.yellow - a.yellow);
  }

  async goalkeepers(categoryId: string) {
    const goalkeepers = await db.player.findMany({
      where: { position: 'GOALKEEPER', team: { categoryId }, active: true },
      select: {
        id: true,
        fullName: true,
        photoUrl: true,
        team: { select: { id: true, name: true, shieldUrl: true } },
      },
    });

    const teamMatches = await db.match.findMany({
      where: { categoryId, status: 'FINISHED' },
      select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
    });

    const goalsAgainst: Record<string, number> = {};
    const matchesPlayed: Record<string, number> = {};

    for (const match of teamMatches) {
      if (match.homeScore === null || match.awayScore === null) continue;
      goalsAgainst[match.homeTeamId] = (goalsAgainst[match.homeTeamId] ?? 0) + match.awayScore;
      goalsAgainst[match.awayTeamId] = (goalsAgainst[match.awayTeamId] ?? 0) + match.homeScore;
      matchesPlayed[match.homeTeamId] = (matchesPlayed[match.homeTeamId] ?? 0) + 1;
      matchesPlayed[match.awayTeamId] = (matchesPlayed[match.awayTeamId] ?? 0) + 1;
    }

    return goalkeepers
      .map((gk) => ({
        ...gk,
        goalsAgainst: goalsAgainst[gk.team.id] ?? 0,
        matchesPlayed: matchesPlayed[gk.team.id] ?? 0,
      }))
      .sort((a, b) => a.goalsAgainst - b.goalsAgainst);
  }

  async fairPlay(categoryId: string) {
    const teams = await db.team.findMany({
      where: { categoryId, active: true },
      select: {
        id: true,
        name: true,
        shieldUrl: true,
        matchEvents: {
          where: {
            match: { categoryId },
            type: { in: ['YELLOW_CARD', 'RED_CARD', 'DOUBLE_YELLOW'] },
          },
          select: { type: true },
        },
      },
    });

    return teams
      .map((t) => {
        const yellow = t.matchEvents.filter((e) => e.type === 'YELLOW_CARD').length;
        const red = t.matchEvents.filter(
          (e) => e.type === 'RED_CARD' || e.type === 'DOUBLE_YELLOW'
        ).length;
        return {
          id: t.id,
          name: t.name,
          shieldUrl: t.shieldUrl,
          yellow,
          red,
          score: yellow * 1 + red * 3,
        };
      })
      .sort((a, b) => a.score - b.score);
  }
}
