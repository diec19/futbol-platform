// Setup de tests de integración: apunta Prisma a la DB de test aislada
// y limpia las tablas antes de cada archivo de test.
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Debe setearse ANTES de que PrismaClient se instancie (al importar database.ts)
process.env.DATABASE_URL = 'postgresql://futbol:futbol123@localhost:5433/futbol_platform_test';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-jwt-0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789abcdef0123456789abcdef0123456789';
process.env.CRON_ENABLED = 'false';

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Tablas a limpiar entre tests (en orden por dependencias)
const TABLES = [
  'notification_outbox',
  'admin_notifications',
  'unlink_requests',
  'player_join_requests',
  'notifications',
  'subscriptions',
  'player_subscriptions',
  'member_players',
  'members',
  'players',
  'club_categories',
];

beforeAll(async () => {
  await db.$connect();
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  // Vacía las tablas de test en orden (TRUNCATE ... CASCADE)
  for (const t of TABLES) {
    try {
      await db.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE`);
    } catch {
      // tabla no existe en este schema, ignorar
    }
  }
});

export { db };
