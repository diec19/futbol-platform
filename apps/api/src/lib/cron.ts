import { db } from '../config/database';
import { createPlayerMpPreference, createMemberMpPreference, normalizePhone, mapWithConcurrency } from './mp';
import { sendWhatsAppMessage } from './whatsapp';
import { env } from '../config/env';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DUE_DAY = 10;
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

function getDueDate(month: number, year: number): Date {
  return new Date(year, month - 1, DUE_DAY);
}

// ── Overdue Cron ─────────────────────────────────────────────────────────────
export function startOverdueCron() {
  console.log('[CRON] Iniciando cron de vencimiento de cuotas (cada 1h)');

  async function checkOverdueSubscriptions() {
    try {
      const now = new Date();

      // Find overdue player subs BEFORE updating (to create notifications)
      const overduePlayerSubs = await db.playerSubscription.findMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: now },
        },
        include: {
          player: {
            include: {
              memberLinks: { include: { member: { select: { id: true, fullName: true } } } },
            },
          },
        },
      });

      const playerResult = await db.playerSubscription.updateMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: now },
        },
        data: { status: 'OVERDUE' },
      });

      // Create notifications for overdue player subs
      for (const sub of overduePlayerSubs) {
        const members = sub.player?.memberLinks?.map(l => l.member) ?? [];
        for (const member of members) {
          await db.notification.create({
            data: {
              memberId: member.id,
              title: 'Cuota vencida',
              message: `La cuota de ${MONTHS[sub.month - 1]} ${sub.year} de ${sub.player.fullName} está vencida. Abonala lo antes posible.`,
              type: 'payment_overdue',
            },
          });
        }
      }

      // Find overdue member subs BEFORE updating
      const overdueMemberSubs = await db.subscription.findMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: now },
        },
      });

      const memberResult = await db.subscription.updateMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: now },
        },
        data: { status: 'OVERDUE' },
      });

      // Create notifications for overdue member subs
      for (const sub of overdueMemberSubs) {
        await db.notification.create({
          data: {
            memberId: sub.memberId,
            title: 'Cuota vencida',
            message: `Tu cuota de ${MONTHS[sub.month - 1]} ${sub.year} está vencida. Abonala lo antes posible.`,
            type: 'payment_overdue',
          },
        });
      }

      // Find overdue sponsor payments BEFORE updating
      const overdueSponsorPayments = await db.sponsorshipPayment.findMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: now },
        },
        include: { sponsorship: { include: { sponsor: true, plan: true } } },
      });

      const sponsorResult = await db.sponsorshipPayment.updateMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: now },
        },
        data: { status: 'OVERDUE' },
      });

      // Log overdue sponsor payments (no member to notify, sponsors are external)
      for (const payment of overdueSponsorPayments) {
        console.log(`[CRON] Auspiciante vencido: ${payment.sponsorship.sponsor.name} - ${payment.sponsorship.plan.name} - ${MONTHS[payment.month - 1]} ${payment.year}`);
      }

      if (playerResult.count > 0 || memberResult.count > 0 || sponsorResult.count > 0) {
        console.log(`[CRON] Cuotas marcadas como vencidas: ${playerResult.count} jugadores, ${memberResult.count} socios, ${sponsorResult.count} auspiciantes`);
      }
    } catch (error) {
      console.error('[CRON] Error checking overdue subscriptions:', error);
    }
  }

  checkOverdueSubscriptions();
  setInterval(checkOverdueSubscriptions, CHECK_INTERVAL);
}

// ── Monthly Fee Generation Cron ──────────────────────────────────────────────
export function startMonthlyFeeCron() {
  console.log('[CRON] Iniciando cron de generación mensual de cuotas');

  async function generateMonthlyFees() {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Check if fees were already generated this month
      const existingPlayerCount = await db.playerSubscription.count({
        where: { month: currentMonth, year: currentYear },
      });
      if (existingPlayerCount > 0) {
        return; // Already generated
      }

      console.log(`[CRON] Generando cuotas mensuales para ${MONTHS[currentMonth - 1]} ${currentYear}...`);

      // Get club config
      const club = await db.club.findFirst();
      if (!club) {
        console.error('[CRON] No hay club configurado, saltando generación');
        return;
      }

      const playerFee = club.monthlyPlayerFee;
      const memberFee = club.monthlyMemberFee;

      if (!playerFee && !memberFee) {
        console.log('[CRON] No hay montos de cuota configurados, saltando');
        return;
      }

      const dueDate = getDueDate(currentMonth, currentYear);
      const APP_URL = env.APP_URL ?? '';

      let playerCount = 0;
      let memberCount = 0;
      let sponsorCount = 0;
      let whatsappSent = 0;
      let whatsappFailed = 0;

      // ── 1. Player Subscriptions ────────────────────────────────────────
      if (playerFee) {
        const players = await db.player.findMany({
          where: { isClubPlayer: true, active: true },
        });

        const results = await Promise.allSettled(
          players.map(p =>
            db.playerSubscription.create({
              data: {
                playerId: p.id,
                month: currentMonth,
                year: currentYear,
                amount: playerFee,
                totalAmount: playerFee,
                dueDate,
              },
            })
          )
        );
        playerCount = results.filter(r => r.status === 'fulfilled').length;

        // Generate MP preferences + send WhatsApp for each player subscription
        const createdSubs = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map(r => r.value);

        const { errors: mpErrors } = await mapWithConcurrency(createdSubs, 3, async (sub) => {
          const player = players.find(p => p.id === sub.playerId);
          if (!player) return null;

          let paymentLink = '';
          try {
            const { preferenceId, paymentLink: mpLink } = await createPlayerMpPreference(sub, player);
            paymentLink = mpLink;
            await db.playerSubscription.update({
              where: { id: sub.id },
              data: { mpPreferenceId: preferenceId, mpPaymentLink: paymentLink, status: 'LINK_SENT' },
            });
          } catch (e: any) {
            console.error(`[CRON] Error MP para jugador ${player.fullName}:`, e.message);
          }

          // Create notification for linked members
          const memberLinks = await db.memberPlayer.findMany({
            where: { playerId: player.id },
            include: { member: { select: { id: true, phone: true, fullName: true } } },
          });

          const notifMsg = paymentLink
            ? `Se generó tu cuota de ${MONTHS[currentMonth - 1]} ${currentYear} de ${player.fullName}. Monto: $${sub.amount.toLocaleString('es-AR')}. Vence el ${DUE_DAY}/${currentMonth}. Pagala con este link: ${paymentLink}`
            : `Se generó tu cuota de ${MONTHS[currentMonth - 1]} ${currentYear} de ${player.fullName}. Monto: $${sub.amount.toLocaleString('es-AR')}. Vence el ${DUE_DAY}/${currentMonth}. Ingresá a la app para pagarla.`;

          for (const link of memberLinks) {
            await db.notification.create({
              data: {
                memberId: link.member.id,
                title: 'Nueva cuota disponible',
                message: notifMsg,
                type: 'payment_new',
              },
            });

            // Send WhatsApp to each linked member
            const phone = link.member.phone;
            if (phone && phone.trim()) {
              const normalizedPhone = normalizePhone(phone);
              const waMsg = paymentLink
                ? `Hola! 👋 Te enviamos el link de pago de la cuota ${MONTHS[currentMonth - 1]} ${currentYear} de ${player.fullName}: ${paymentLink}`
                : `Hola! 👋 La cuota de ${MONTHS[currentMonth - 1]} ${currentYear} de ${player.fullName} ya está generada. Ingresá a la app para pagarla: ${APP_URL}`;
              const result = await sendWhatsAppMessage(normalizedPhone, waMsg);
              if (result.success) whatsappSent++;
              else {
                whatsappFailed++;
                console.error(`[CRON] WhatsApp falló para ${player.fullName}:`, result.error);
              }
            }
          }

          return { subId: sub.id, playerName: player.fullName };
        });

        for (const err of mpErrors) {
          console.error(`[CRON] Error MP en bulk:`, err.error);
        }
      }

      // ── 2. Member Subscriptions ────────────────────────────────────────
      if (memberFee) {
        const members = await db.member.findMany({
          where: { active: true },
        });

        const results = await Promise.allSettled(
          members.map(m =>
            db.subscription.create({
              data: {
                memberId: m.id,
                month: currentMonth,
                year: currentYear,
                amount: memberFee,
                dueDate,
              },
            })
          )
        );
        memberCount = results.filter(r => r.status === 'fulfilled').length;

        // Generate MP preferences + send WhatsApp
        const createdSubs = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map(r => r.value);

        await mapWithConcurrency(createdSubs, 3, async (sub) => {
          const member = members.find(m => m.id === sub.memberId);
          if (!member) return null;

          let paymentLink = '';
          try {
            // Get linked player subs for consolidated payment
            const linkedPlayers = await db.memberPlayer.findMany({
              where: { memberId: member.id },
              include: {
                player: {
                  include: {
                    subscriptions: {
                      where: { month: currentMonth, year: currentYear },
                      take: 1,
                    },
                  },
                },
              },
            });

            const childSubs = linkedPlayers
              .filter(lp => lp.player.subscriptions.length > 0)
              .map(lp => ({
                id: lp.player.subscriptions[0].id,
                player: { fullName: lp.player.fullName },
                amount: lp.player.subscriptions[0].amount,
              }));

            const { preferenceId, paymentLink: mpLink } = await createMemberMpPreference(sub, member, childSubs);
            paymentLink = mpLink;
            await db.subscription.update({
              where: { id: sub.id },
              data: { mpPreferenceId: preferenceId, mpPaymentLink: paymentLink, status: 'LINK_SENT' },
            });
          } catch (e: any) {
            console.error(`[CRON] Error MP para socio ${member.fullName}:`, e.message);
          }

          // Create notification for member
          const notifMsg = paymentLink
            ? `Se generó tu cuota de ${MONTHS[currentMonth - 1]} ${currentYear}. Monto: $${memberFee.toLocaleString('es-AR')}. Vence el ${DUE_DAY}/${currentMonth}. Pagala con este link: ${paymentLink}`
            : `Se generó tu cuota de ${MONTHS[currentMonth - 1]} ${currentYear}. Monto: $${memberFee.toLocaleString('es-AR')}. Vence el ${DUE_DAY}/${currentMonth}. Ingresá a la app para pagarla.`;

          await db.notification.create({
            data: {
              memberId: member.id,
              title: 'Nueva cuota disponible',
              message: notifMsg,
              type: 'payment_new',
            },
          });

          // Send WhatsApp
          if (member.phone && member.phone.trim()) {
            const normalizedPhone = normalizePhone(member.phone);
            const msg = paymentLink
              ? `Hola! 👋 Te enviamos el link de pago de tu cuota ${MONTHS[currentMonth - 1]} ${currentYear}: ${paymentLink}`
              : `Hola! 👋 Tu cuota de ${MONTHS[currentMonth - 1]} ${currentYear} ya está generada. Ingresá a la app para pagarla: ${APP_URL}`;
            const result = await sendWhatsAppMessage(normalizedPhone, msg);
            if (result.success) whatsappSent++;
            else {
              whatsappFailed++;
              console.error(`[CRON] WhatsApp falló para socio ${member.fullName}:`, result.error);
            }
          }

          return { subId: sub.id, memberName: member.fullName };
        });
      }

      // ── 3. Sponsorship Payments ────────────────────────────────────────
      const activeSponsorships = await db.sponsorship.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true, sponsor: true },
      });

      for (const sponsorship of activeSponsorships) {
        // Skip if sponsorship period doesn't cover this month
        const startOf = new Date(sponsorship.startDate);
        const endOf = new Date(sponsorship.endDate);
        const monthStart = new Date(currentYear, currentMonth - 1, 1);
        if (monthStart < startOf || monthStart > endOf) continue;

        const existing = await db.sponsorshipPayment.findUnique({
          where: { sponsorshipId_month_year: { sponsorshipId: sponsorship.id, month: currentMonth, year: currentYear } },
        });
        if (existing) continue;

        const amount = sponsorship.plan.monthlyAmount;
        const payment = await db.sponsorshipPayment.create({
          data: {
            sponsorshipId: sponsorship.id,
            month: currentMonth,
            year: currentYear,
            amount,
            totalAmount: amount,
            dueDate,
          },
        });
        sponsorCount++;

        // Send WhatsApp to sponsor
        const phone = sponsorship.sponsor.phone;
        if (phone && phone.trim()) {
          const normalizedPhone = normalizePhone(phone);
          const msg = `Hola! 👋 La cuota de auspicio ${MONTHS[currentMonth - 1]} ${currentYear} (${sponsorship.plan.name}) ya está disponible. Monto: $${amount.toLocaleString('es-AR')}. Comunicate con el club para abonarla.`;
          const result = await sendWhatsAppMessage(normalizedPhone, msg);
          if (result.success) whatsappSent++;
          else {
            whatsappFailed++;
            console.error(`[CRON] WhatsApp falló para auspiciante ${sponsorship.sponsor.name}:`, result.error);
          }
        }
      }

      console.log(`[CRON] ✅ Cuotas generadas: ${playerCount} jugadores, ${memberCount} socios, ${sponsorCount} auspiciantes | WhatsApp: ${whatsappSent} enviados, ${whatsappFailed} fallidos`);
    } catch (error) {
      console.error('[CRON] Error generating monthly fees:', error);
    }
  }

  // Check every hour if we need to generate
  generateMonthlyFees();
  setInterval(generateMonthlyFees, CHECK_INTERVAL);
}
