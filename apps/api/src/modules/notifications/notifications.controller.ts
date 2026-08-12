import { Request, Response, NextFunction } from 'express';
import { notificationsService as svc } from './notifications.service';

export const notificationsController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.create(req.body);
      res.status(201).json({ data });
    } catch (e) {
      next(e);
    }
  },

  listMine: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = (req as any).memberId;
      const data = await svc.listByMember(memberId);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  },

  unreadCount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = (req as any).memberId;
      const count = await svc.unreadCount(memberId);
      res.json({ data: { count } });
    } catch (e) {
      next(e);
    }
  },

  markRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = (req as any).memberId;
      const data = await svc.markRead(req.params.id, memberId);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  },

  markAllRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = (req as any).memberId;
      await svc.markAllRead(memberId);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },

  listAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await svc.listAll();
      res.json({ data });
    } catch (e) {
      next(e);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.remove(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },

  // Admin notifications
  listAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      res.json({ data: await svc.listAdmin(limit) });
    } catch (e) { next(e); }
  },
  adminUnreadCount: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: { count: await svc.adminUnreadCount() } });
    } catch (e) { next(e); }
  },
  markAdminRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await svc.markAdminRead(req.params.id) });
    } catch (e) { next(e); }
  },
  markAllAdminRead: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await svc.markAllAdminRead() });
    } catch (e) { next(e); }
  },
};
