import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { env } from '../../config/env';
import { notificationsController as ctrl } from './notifications.controller';

export const notificationsRouter = Router();

function memberAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    if (payload.type !== 'member') return res.status(403).json({ error: 'No autorizado' });
    (req as any).memberId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Member routes
notificationsRouter.get('/', memberAuth, ctrl.listMine);
notificationsRouter.get('/count', memberAuth, ctrl.unreadCount);
notificationsRouter.patch('/:id/read', memberAuth, ctrl.markRead);
notificationsRouter.patch('/read-all', memberAuth, ctrl.markAllRead);

// Admin routes
notificationsRouter.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.create);
notificationsRouter.get('/all', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.listAll);
notificationsRouter.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.remove);

// Admin inbox (altas, pagos, etc.)
notificationsRouter.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.listAdmin);
notificationsRouter.get('/admin/count', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.adminUnreadCount);
notificationsRouter.patch('/admin/read-all', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.markAllAdminRead);
notificationsRouter.patch('/admin/:id/read', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.markAdminRead);
