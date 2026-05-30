import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../middleware/auth.middleware';
import { env } from '../../config/env';
import { membersController as ctrl } from './members.controller';
import { membersService as svc } from './members.service';

export const membersRouter = Router();

// ── Member JWT middleware ────────────────────────────────────────────────────
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

// ── Auth pública ─────────────────────────────────────────────────────────────
membersRouter.post('/auth/login', ctrl.login);
membersRouter.post('/auth/register', async (req, res, next) => {
  try {
    const data = await svc.create(req.body);
    res.status(201).json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Error interno del servidor', stack: e?.stack });
  }
});
membersRouter.get('/auth/me', memberAuth, ctrl.me);

// ── Admin CRUD ────────────────────────────────────────────────────────────────
membersRouter.use(authenticate);

// Subscriptions must precede /:id to avoid route conflict
membersRouter.get('/subscriptions/all', ctrl.listAllSubscriptions);
membersRouter.post('/subscriptions/bulk', ctrl.createBulk);
membersRouter.patch('/subscriptions/:subId/send-link', ctrl.sendLink);
membersRouter.patch('/subscriptions/:subId/pay', ctrl.markPaid);
membersRouter.patch('/subscriptions/:subId/overdue', ctrl.markOverdue);
membersRouter.delete('/subscriptions/:subId', ctrl.deleteSubscription);

membersRouter.get('/', ctrl.list);
membersRouter.post('/', ctrl.create);
membersRouter.get('/:id', ctrl.get);
membersRouter.put('/:id', ctrl.update);
membersRouter.delete('/:id', ctrl.remove);

membersRouter.post('/:id/players', ctrl.linkPlayer);
membersRouter.delete('/:id/players/:playerId', ctrl.unlinkPlayer);

membersRouter.get('/:id/subscriptions', ctrl.listSubscriptions);
membersRouter.post('/:id/subscriptions', ctrl.createSubscription);
