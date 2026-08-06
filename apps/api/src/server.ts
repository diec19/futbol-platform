import 'dotenv/config';
import { app } from './app';
import { env } from './config/env';
import { db } from './config/database';
import { startOverdueCron, startMonthlyFeeCron } from './lib/cron';
import { startOutboxDispatcher } from './lib/outbox';

async function main() {
  await db.$connect();
  console.log('Database connected');

  // Gate unificado: CRON_ENABLED !== 'false' arranca todo (compat con deploys actuales que no definen la var)
  if (env.CRON_ENABLED !== 'false') {
    startOverdueCron();
    startMonthlyFeeCron();
    startOutboxDispatcher();
  }

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
