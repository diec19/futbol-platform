import { db } from '../config/database';
import { createPlayerMpPreference, createMemberMpPreference, normalizePhone, mapWithConcurrency } from './mp';
import { enqueueNotification } from './outbox';

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
      // Una cuota vence el DUE_DAY a las 00:00. Recién se marca OVERDUE a partir del
      // día siguiente (inicio del día actual): el día del vencimiento es período de gracia.
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let outboxInapp = 0;
      let outboxWhatsapp = 0;
      let outboxEmail = 0;

      // Find overdue player subs BEFORE updating (to create notifications)
      const overduePlayerSubs = await db.playerSubscription.findMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: startOfToday },
        },
        include: {
          player: {
            include: {
              memberLinks: { include: { member: { select: { id: true, phone: true, email: true, fullName: true } } } },
            },
          },
        },
      });

      // Marcar OVERDUE con su recargo (10% del monto base)
      const playerResult = { count: 0 };
      for (const sub of overduePlayerSubs) {
        const lateFee = Math.round(sub.amount * 10 / 100);
        await db.playerSubscription.update({
          where: { id: sub.id },
          data: { status: 'OVERDUE', lateFee, totalAmount: sub.amount + lateFee },
        });
        playerResult.count++;
      }

      // Encolar recordatorios de cuotas vencidas de jugadores (outbox)
      for (const sub of overduePlayerSubs) {
        const members = sub.player?.memberLinks?.map(l => l.member) ?? [];
        if (members.length === 0) continue;

        const title = 'Cuota vencida';
        const msg = `La cuota de ${MONTHS[sub.month - 1]} ${sub.year} de ${sub.player.fullName} está vencida. Abonala lo antes posible.`;

        await enqueueNotification({
          channel: 'INAPP',
          refType: 'playerSubscription_overdue',
          entityId: sub.id,
          title,
          message: msg,
          payload: {
            memberIds: members.map(m => m.id),
            notifType: 'payment_overdue',
            subId: sub.id,
            month: sub.month,
            year: sub.year,
            name: sub.player.fullName,
          },
        });
        outboxInapp++;

        for (const member of members) {
          if (member.phone && member.phone.trim()) {
            const waMsg = `Hola! 👋 La cuota de ${MONTHS[sub.month - 1]} ${sub.year} de ${sub.player.fullName} está vencida. Abonala lo antes posible.`;
            await enqueueNotification({
              channel: 'WHATSAPP',
              refType: 'playerSubscription_overdue',
              entityId: sub.id,
              title: 'Cuota vencida',
              message: waMsg,
              payload: {
                phone: normalizePhone(member.phone),
                subId: sub.id,
                month: sub.month,
                year: sub.year,
                name: sub.player.fullName,
                templateName: 'cuota_vencida',
                templateParams: [member.fullName, `${MONTHS[sub.month - 1]} ${sub.year}`],
              },
            });
            outboxWhatsapp++;
          }
          const memberEmail = member.email;
          if (memberEmail && memberEmail.trim()) {
            const emMsg = `Hola ${member.fullName}. La cuota de ${MONTHS[sub.month - 1]} ${sub.year} de ${sub.player.fullName} está vencida. Abonala lo antes posible.`;
            await enqueueNotification({
              channel: 'EMAIL',
              refType: 'playerSubscription_overdue',
              entityId: sub.id,
              title: 'Cuota vencida',
              message: emMsg,
              payload: { email: memberEmail, subId: sub.id, month: sub.month, year: sub.year, name: sub.player.fullName },
            });
            outboxEmail++;
          }
        }
      }

      // Find overdue member subs BEFORE updating
      const overdueMemberSubs = await db.subscription.findMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: startOfToday },
        },
        include: { member: { select: { id: true, phone: true, email: true, fullName: true } } },
      });

      const memberResult = { count: 0 };
      for (const sub of overdueMemberSubs) {
        const lateFee = Math.round(sub.amount * 10 / 100);
        await db.subscription.update({
          where: { id: sub.id },
          data: { status: 'OVERDUE', lateFee, totalAmount: sub.amount + lateFee },
        });
        memberResult.count++;
      }

      // Encolar recordatorios de cuotas vencidas de socios (outbox)
      for (const sub of overdueMemberSubs) {
        const title = 'Cuota vencida';
        const msg = `Tu cuota de ${MONTHS[sub.month - 1]} ${sub.year} está vencida. Abonala lo antes posible.`;

        await enqueueNotification({
          channel: 'INAPP',
          refType: 'subscription_overdue',
          entityId: sub.id,
          title,
          message: msg,
          payload: {
            memberIds: [sub.memberId],
            notifType: 'payment_overdue',
            subId: sub.id,
            month: sub.month,
            year: sub.year,
          },
        });
        outboxInapp++;

        const member = sub.member;
        if (member?.phone && member.phone.trim()) {
          const waMsg = `Hola! 👋 Tu cuota de ${MONTHS[sub.month - 1]} ${sub.year} está vencida. Abonala lo antes posible.`;
          await enqueueNotification({
            channel: 'WHATSAPP',
            refType: 'subscription_overdue',
            entityId: sub.id,
            title,
            message: waMsg,
            payload: {
              phone: normalizePhone(member.phone),
              subId: sub.id,
              month: sub.month,
              year: sub.year,
              name: member.fullName,
              templateName: 'cuota_vencida',
              templateParams: [member.fullName, `${MONTHS[sub.month - 1]} ${sub.year}`],
            },
          });
          outboxWhatsapp++;
        }
        const memberEmail = member?.email;
        if (memberEmail && memberEmail.trim()) {
          const emMsg = `Hola ${member.fullName}. Tu cuota de ${MONTHS[sub.month - 1]} ${sub.year} está vencida. Abonala lo antes posible.`;
          await enqueueNotification({
            channel: 'EMAIL',
            refType: 'subscription_overdue',
            entityId: sub.id,
            title,
            message: emMsg,
            payload: { email: memberEmail, subId: sub.id, month: sub.month, year: sub.year, name: member.fullName },
          });
          outboxEmail++;
        }
      }

      // Find overdue sponsor payments BEFORE updating
      const overdueSponsorPayments = await db.sponsorshipPayment.findMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: startOfToday },
        },
        include: { sponsorship: { include: { sponsor: true, plan: true } } },
      });

      const sponsorResult = await db.sponsorshipPayment.updateMany({
        where: {
          status: { in: ['PENDING', 'LINK_SENT'] },
          dueDate: { lt: startOfToday },
        },
        data: { status: 'OVERDUE' },
      });

      // Encolar recordatorios de cuotas de auspicio vencidas (outbox, sin INAPP: no son miembros)
      for (const payment of overdueSponsorPayments) {
        const sponsor = payment.sponsorship.sponsor;
        const planName = payment.sponsorship.plan.name;
        const title = 'Cuota de auspicio vencida';
        const msg = `La cuota de auspicio ${MONTHS[payment.month - 1]} ${payment.year} (${planName}) está vencida. Comunicate con el club para regularizarla.`;

        if (sponsor.phone && sponsor.phone.trim()) {
          await enqueueNotification({
            channel: 'WHATSAPP',
            refType: 'sponsorshipPayment_overdue',
            entityId: payment.id,
            title,
            message: msg,
            payload: {
              phone: normalizePhone(sponsor.phone),
              month: payment.month,
              year: payment.year,
              name: sponsor.name,
              templateName: 'cuota_auspicio_vencida',
              templateParams: [sponsor.contactName ?? sponsor.name, `${MONTHS[payment.month - 1]} ${payment.year}`, planName],
            },
          });
          outboxWhatsapp++;
        }
        if (sponsor.email && sponsor.email.trim()) {
          await enqueueNotification({
            channel: 'EMAIL',
            refType: 'sponsorshipPayment_overdue',
            entityId: payment.id,
            title,
            message: msg,
            payload: { email: sponsor.email, month: payment.month, year: payment.year, name: sponsor.name },
          });
          outboxEmail++;
        }
      }

      if (playerResult.count > 0 || memberResult.count > 0 || sponsorResult.count > 0) {
        console.log(`[CRON] Cuotas marcadas como vencidas: ${playerResult.count} jugadores, ${memberResult.count} socios, ${sponsorResult.count} auspiciantes | Outbox: ${outboxWhatsapp} whatsapp, ${outboxEmail} email, ${outboxInapp} inapp`);
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

      let playerCount = 0;
      let memberCount = 0;
      let sponsorCount = 0;
      let outboxInapp = 0;
      let outboxWhatsapp = 0;
      let outboxEmail = 0;

      // ── 1. Player Subscriptions ────────────────────────────────────────
      if (playerFee) {
        const players = await db.player.findMany({
          where: { isClubPlayer: true, active: true },
        });

        // Subs existentes del mes (idempotencia) + crear las que faltan
        const existingSubs = await db.playerSubscription.findMany({
          where: { month: currentMonth, year: currentYear },
        });
        const existingPlayerIds = new Set(existingSubs.map((s: any) => s.playerId));

        const toCreate = players.filter(p => !existingPlayerIds.has(p.id));
        if (toCreate.length > 0) {
          const results = await Promise.allSettled(
            toCreate.map(p =>
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
        }
        playerCount += existingSubs.length;

        // Generar/regenerar links MP SOLO para las PENDING sin link (nuevas + reintentos)
        const pendingSubs = [
          ...existingSubs,
          ...((await db.playerSubscription.findMany({
            where: {
              month: currentMonth,
              year: currentYear,
              status: 'PENDING',
              mpPaymentLink: null,
            },
          }))),
        ].filter((s: any, i, arr) => arr.findIndex((x: any) => x.id === s.id) === i);

        const { errors: mpErrors } = await mapWithConcurrency(pendingSubs, 3, async (sub: any) => {
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

          // Encolar entregas por canal (outbox multicanal)
          const memberLinks = await db.memberPlayer.findMany({
            where: { playerId: player.id },
            include: { member: { select: { id: true, phone: true, email: true, fullName: true } } },
          });

          const notifMsg = paymentLink
            ? `Se generó tu cuota de ${MONTHS[currentMonth - 1]} ${currentYear} de ${player.fullName}. Monto: $${sub.amount.toLocaleString('es-AR')}. Vence el ${DUE_DAY}/${currentMonth}. Pagala con este link: ${paymentLink}`
            : `Se generó tu cuota de ${MONTHS[currentMonth - 1]} ${currentYear} de ${player.fullName}. Monto: $${sub.amount.toLocaleString('es-AR')}. Vence el ${DUE_DAY}/${currentMonth}. Ingresá a la app para pagarla.`;

          const memberIds = memberLinks.map(l => l.member.id);
          await enqueueNotification({
            channel: 'INAPP',
            refType: 'playerSubscription',
            entityId: sub.id,
            title: 'Nueva cuota disponible',
            message: notifMsg,
            payload: { memberIds, subId: sub.id, month: currentMonth, year: currentYear, name: player.fullName, paymentLink: paymentLink || undefined },
          });
          outboxInapp++;

          if (paymentLink) {
            for (const link of memberLinks) {
              const phone = link.member.phone;
              if (phone && phone.trim()) {
                const waMsg = `Hola! 👋 Te enviamos el link de pago de la cuota ${MONTHS[currentMonth - 1]} ${currentYear} de ${player.fullName}: ${paymentLink}`;
                await enqueueNotification({
                  channel: 'WHATSAPP',
                  refType: 'playerSubscription',
                  entityId: sub.id,
                  title: 'Cuota disponible',
                  message: waMsg,
                  payload: {
                    phone: normalizePhone(phone),
                    subId: sub.id,
                    month: currentMonth,
                    year: currentYear,
                    name: player.fullName,
                    paymentLink,
                    templateName: 'cuota_disponible',
                    templateParams: [
                      link.member.fullName,
                      `${MONTHS[currentMonth - 1]} ${currentYear}`,
                      player.fullName,
                      `$${sub.amount.toLocaleString('es-AR')}`,
                      paymentLink,
                    ],
                  },
                });
                outboxWhatsapp++;
              }
              const email = link.member.email;
              if (email && email.trim()) {
                const emailMsg = `Hola ${link.member.fullName}. Se generó tu cuota de ${MONTHS[currentMonth - 1]} ${currentYear} de ${player.fullName}. Monto: $${sub.amount.toLocaleString('es-AR')}. Vence el ${DUE_DAY}/${currentMonth}. Pagala con este link: ${paymentLink}`;
                await enqueueNotification({
                  channel: 'EMAIL',
                  refType: 'playerSubscription',
                  entityId: sub.id,
                  title: 'Nueva cuota disponible',
                  message: emailMsg,
                  payload: { email, subId: sub.id, month: currentMonth, year: currentYear, name: player.fullName, paymentLink },
                });
                outboxEmail++;
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

        const existingSubs = await db.subscription.findMany({
          where: { month: currentMonth, year: currentYear },
        });
        const existingMemberIds = new Set(existingSubs.map((s: any) => s.memberId));

        const toCreate = members.filter(m => !existingMemberIds.has(m.id));
        if (toCreate.length > 0) {
          const results = await Promise.allSettled(
            toCreate.map(m =>
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
        }
        memberCount += existingSubs.length;

        const pendingSubs = [
          ...existingSubs,
          ...((await db.subscription.findMany({
            where: {
              month: currentMonth,
              year: currentYear,
              status: 'PENDING',
              mpPaymentLink: null,
            },
          }))),
        ].filter((s: any, i, arr) => arr.findIndex((x: any) => x.id === s.id) === i);

        const { errors: memberErrors } = await mapWithConcurrency(pendingSubs, 3, async (sub: any) => {
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

          // Encolar entregas por canal (outbox multicanal)
          await enqueueNotification({
            channel: 'INAPP',
            refType: 'subscription',
            entityId: sub.id,
            title: 'Nueva cuota disponible',
            message: notifMsg,
            payload: { memberIds: [member.id], subId: sub.id, month: currentMonth, year: currentYear, name: member.fullName, paymentLink: paymentLink || undefined },
          });
          outboxInapp++;

          if (paymentLink) {
            if (member.phone && member.phone.trim()) {
              const msg = `Hola! 👋 Te enviamos el link de pago de tu cuota ${MONTHS[currentMonth - 1]} ${currentYear}: ${paymentLink}`;
              await enqueueNotification({
                channel: 'WHATSAPP',
                refType: 'subscription',
                entityId: sub.id,
                title: 'Cuota disponible',
                message: msg,
                payload: {
                  phone: normalizePhone(member.phone),
                  subId: sub.id,
                  month: currentMonth,
                  year: currentYear,
                  name: member.fullName,
                  paymentLink,
                  templateName: 'cuota_disponible',
                  templateParams: [
                    member.fullName,
                    `${MONTHS[currentMonth - 1]} ${currentYear}`,
                    club.name,
                    `$${memberFee.toLocaleString('es-AR')}`,
                    paymentLink,
                  ],
                },
              });
              outboxWhatsapp++;
            }
            if (member.email && member.email.trim()) {
              const emailMsg = `Hola ${member.fullName}. Se generó tu cuota de ${MONTHS[currentMonth - 1]} ${currentYear}. Monto: $${memberFee.toLocaleString('es-AR')}. Vence el ${DUE_DAY}/${currentMonth}. Pagala con este link: ${paymentLink}`;
              await enqueueNotification({
                channel: 'EMAIL',
                refType: 'subscription',
                entityId: sub.id,
                title: 'Nueva cuota disponible',
                message: emailMsg,
                payload: { email: member.email, subId: sub.id, month: currentMonth, year: currentYear, name: member.fullName, paymentLink },
              });
              outboxEmail++;
            }
          }

          return { subId: sub.id, memberName: member.fullName };
        });

        for (const err of memberErrors) {
          console.error(`[CRON] Error MP en bulk socios:`, err.error);
        }
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

        // Encolar entregas por canal (outbox multicanal, sin INAPP: no son miembros)
        const phone = sponsorship.sponsor.phone;
        if (phone && phone.trim()) {
          const msg = `Hola! 👋 La cuota de auspicio ${MONTHS[currentMonth - 1]} ${currentYear} (${sponsorship.plan.name}) ya está disponible. Monto: $${amount.toLocaleString('es-AR')}. Comunicate con el club para abonarla.`;
          await enqueueNotification({
            channel: 'WHATSAPP',
            refType: 'sponsorshipPayment',
            entityId: payment.id,
            title: 'Cuota de auspicio',
            message: msg,
            payload: {
              phone: normalizePhone(phone),
              month: currentMonth,
              year: currentYear,
              name: sponsorship.sponsor.name,
              templateName: 'cuota_auspicio',
              templateParams: [
                sponsorship.sponsor.contactName ?? sponsorship.sponsor.name,
                `${MONTHS[currentMonth - 1]} ${currentYear}`,
                sponsorship.plan.name,
                `$${amount.toLocaleString('es-AR')}`,
              ],
            },
          });
          outboxWhatsapp++;
        }
        const sponsorEmail = sponsorship.sponsor.email;
        if (sponsorEmail && sponsorEmail.trim()) {
          const emailMsg = `Hola ${sponsorship.sponsor.contactName ?? sponsorship.sponsor.name}. La cuota de auspicio ${MONTHS[currentMonth - 1]} ${currentYear} (${sponsorship.plan.name}) ya está disponible. Monto: $${amount.toLocaleString('es-AR')}. Comunicate con el club para abonarla.`;
          await enqueueNotification({
            channel: 'EMAIL',
            refType: 'sponsorshipPayment',
            entityId: payment.id,
            title: 'Cuota de auspicio',
            message: emailMsg,
            payload: { email: sponsorEmail, month: currentMonth, year: currentYear, name: sponsorship.sponsor.name },
          });
          outboxEmail++;
        }
      }

      console.log(`[CRON] ✅ Cuotas generadas: ${playerCount} jugadores, ${memberCount} socios, ${sponsorCount} auspiciantes | Outbox: ${outboxWhatsapp} whatsapp, ${outboxEmail} email, ${outboxInapp} inapp`);
    } catch (error) {
      console.error('[CRON] Error generating monthly fees:', error);
    }
  }

  // Check every hour if we need to generate
  generateMonthlyFees();
  setInterval(generateMonthlyFees, CHECK_INTERVAL);
}
