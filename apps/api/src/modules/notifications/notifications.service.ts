import { db } from '../../config/database';
import { AppError } from '../../lib/app-error';

export const notificationsService = {
  async create(data: { memberId?: string; title: string; message: string; type: string }) {
    return db.notification.create({ data });
  },

  async listByMember(memberId: string) {
    return db.notification.findMany({
      where: {
        OR: [
          { memberId: null, type: 'global' },
          { memberId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async unreadCount(memberId: string) {
    return db.notification.count({
      where: {
        OR: [
          { memberId: null, type: 'global' },
          { memberId },
        ],
        read: false,
      },
    });
  },

  async markRead(id: string, memberId: string) {
    const notif = await db.notification.findUnique({ where: { id } });
    if (!notif) throw new AppError('Notificación no encontrada', 404);
    if (notif.memberId && notif.memberId !== memberId) {
      throw new AppError('No autorizado', 403);
    }
    return db.notification.update({ where: { id }, data: { read: true } });
  },

  async markAllRead(memberId: string) {
    return db.notification.updateMany({
      where: {
        OR: [
          { memberId: null, type: 'global' },
          { memberId },
        ],
        read: false,
      },
      data: { read: true },
    });
  },

  async listAll() {
    return db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      include: { member: { select: { id: true, fullName: true } } },
    });
  },

  async remove(id: string) {
    await db.notification.delete({ where: { id } });
  },

  // ── Admin notifications ──────────────────────────────────────────────────
  async createAdmin(data: { type: string; refType?: string; refId?: string; title: string; message: string }) {
    return db.adminNotification.create({ data });
  },

  async listAdmin(limit = 50) {
    return db.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async adminUnreadCount() {
    return db.adminNotification.count({ where: { read: false } });
  },

  async markAdminRead(id: string) {
    return db.adminNotification.update({ where: { id }, data: { read: true } });
  },

  async markAllAdminRead() {
    return db.adminNotification.updateMany({ data: { read: true } });
  },
};
