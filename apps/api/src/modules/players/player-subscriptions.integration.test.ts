import { describe, it, expect, beforeEach } from 'vitest';
import { playerSubscriptionsService as subs } from './player-subscriptions.service';
import { db } from '../../config/database';
import { notificationsService } from '../notifications/notifications.service';

describe('player subscriptions integración (pago)', () => {
  beforeEach(async () => {
    await db.playerSubscription.deleteMany();
    await db.memberPlayer.deleteMany();
    await db.player.deleteMany();
    await db.adminNotification.deleteMany();
  });

  it('crea una cuota de jugador y la marca como pagada', async () => {
    const player = await db.player.create({
      data: { fullName: 'Paga', dni: '44440000', birthDate: new Date('2015-01-01'), isClubPlayer: true },
    });

    const sub = await subs.create(player.id, {
      month: 8,
      year: 2026,
      amount: 10000,
    });
    expect(sub.status).toBe('PENDING');

    await subs.markPaid(sub.id);
    const updated = await db.playerSubscription.findUnique({ where: { id: sub.id } });
    expect(updated?.status).toBe('PAID');
    expect(updated?.paidAt).toBeDefined();
  });

  it('aplica recargo si la cuota venció', async () => {
    const player = await db.player.create({
      data: { fullName: 'Vencida', dni: '44440001', birthDate: new Date('2015-01-01'), isClubPlayer: true },
    });
    const sub = await subs.create(player.id, {
      month: 7,
      year: 2026,
      amount: 10000,
    });
    // Forzamos dueDate vencido
    await db.playerSubscription.update({
      where: { id: sub.id },
      data: { dueDate: new Date(Date.now() - 86400000) },
    });
    await subs.markPaid(sub.id);
    const updated = await db.playerSubscription.findUnique({ where: { id: sub.id } });
    expect(updated?.status).toBe('PAID');
    expect(updated?.totalAmount).toBeGreaterThan(10000);
  });

  it('no permite pagar una cuota que no existe', async () => {
    await expect(subs.markPaid('nonexistent')).rejects.toThrow('no encontrada');
  });

  it('crea notificación admin al marcar pagado (como el webhook)', async () => {
    const player = await db.player.create({
      data: { fullName: 'Notif', dni: '44440002', birthDate: new Date('2015-01-01'), isClubPlayer: true },
    });
    const sub = await subs.create(player.id, { month: 8, year: 2026, amount: 5000 });

    await subs.markPaid(sub.id);
    await notificationsService.createAdmin({
      type: 'payment',
      refType: 'PlayerSubscription',
      refId: sub.id,
      title: 'Pago recibido',
      message: 'Pago de $5.000 recibido',
    });

    const notifs = await db.adminNotification.findMany({ where: { refId: sub.id } });
    expect(notifs.length).toBe(1);
    expect(notifs[0].type).toBe('payment');
  });

  it('listAll filtra por estado', async () => {
    const player = await db.player.create({
      data: { fullName: 'Lista', dni: '44440003', birthDate: new Date('2015-01-01'), isClubPlayer: true },
    });
    await subs.create(player.id, { month: 8, year: 2026, amount: 3000 });
    const paid = await subs.listAll({ status: 'PENDING', month: 8, year: 2026 });
    expect(paid.length).toBe(1);
  });
});