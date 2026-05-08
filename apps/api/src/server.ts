import 'dotenv/config';
import { app } from './app';
import { env } from './config/env';
import { db } from './config/database';

async function main() {
  await db.$connect();
  console.log('Database connected');

  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await db.$disconnect();
  process.exit(0);
});
