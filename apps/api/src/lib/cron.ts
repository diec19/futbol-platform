import { db } from '../config/database';

const OVERDUE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

export function startOverdueCron() {
  console.log('[CRON] Iniciando cron de vencimiento de cuotas (cada 1h)');

  async function checkOverdueSubscriptions() {
    try {
      const now = new Date();

      // Mark PlayerSubscriptions as OVERDUE
      const playerResult = await db.playerSubscription.updateMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: now },
        },
        data: { status: 'OVERDUE' },
      });

      // Mark Member Subscriptions as OVERDUE
      const memberResult = await db.subscription.updateMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: now },
        },
        data: { status: 'OVERDUE' },
      });

      if (playerResult.count > 0 || memberResult.count > 0) {
        console.log(`[CRON] Cuotas marcadas como vencidas: ${playerResult.count} jugadores, ${memberResult.count} socios`);
      }
    } catch (error) {
      console.error('[CRON] Error checking overdue subscriptions:', error);
    }
  }

  // Run immediately on startup
  checkOverdueSubscriptions();

  // Then every hour
  setInterval(checkOverdueSubscriptions, OVERDUE_CHECK_INTERVAL);
}
