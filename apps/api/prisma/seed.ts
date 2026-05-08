import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin1234', 12);

  const admin = await db.user.upsert({
    where: { email: 'admin@futbolplatform.com' },
    update: {},
    create: {
      email: 'admin@futbolplatform.com',
      username: 'admin',
      password,
      fullName: 'Administrador',
      role: 'SUPER_ADMIN',
    },
  });

  const tournament = await db.tournament.upsert({
    where: { id: 'seed-tournament-1' },
    update: {},
    create: {
      id: 'seed-tournament-1',
      name: 'Torneo Apertura 2026',
      description: 'Torneo de ejemplo para pruebas',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-07-31'),
      status: 'ACTIVE',
    },
  });

  const category = await db.category.upsert({
    where: { id: 'seed-category-1' },
    update: {},
    create: {
      id: 'seed-category-1',
      tournamentId: tournament.id,
      name: 'Primera División',
      maxPlayers: 22,
      phaseType: 'MIXED',
    },
  });

  const teams = await Promise.all(
    ['Club Atlético', 'Deportivo FC', 'Racing Club', 'Unión SC'].map((name, i) =>
      db.team.upsert({
        where: { id: `seed-team-${i + 1}` },
        update: {},
        create: {
          id: `seed-team-${i + 1}`,
          categoryId: category.id,
          name,
        },
      })
    )
  );

  const group = await db.group.upsert({
    where: { categoryId_name: { categoryId: category.id, name: 'Grupo A' } },
    update: {},
    create: { categoryId: category.id, name: 'Grupo A' },
  });

  for (const team of teams) {
    await db.groupTeam.upsert({
      where: { groupId_teamId: { groupId: group.id, teamId: team.id } },
      update: {},
      create: { groupId: group.id, teamId: team.id },
    });
  }

  console.log('Seed completado:');
  console.log(`  Admin: admin@futbolplatform.com / admin1234`);
  console.log(`  Torneo: ${tournament.name}`);
  console.log(`  Categoría: ${category.name}`);
  console.log(`  Equipos: ${teams.map(t => t.name).join(', ')}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
