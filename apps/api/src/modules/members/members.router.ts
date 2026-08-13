import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { registerMemberSchema, linkPlayerSchema, createJoinRequestSchema, createUnlinkRequestSchema } from '@futbol/validations';
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
membersRouter.post('/auth/register', validate(registerMemberSchema), async (req, res, next) => {
  try {
    const data = await svc.create(req.body);
    res.status(201).json({ data });
  } catch (e) {
    next(e);
  }
});
membersRouter.get('/auth/me', memberAuth, ctrl.me);

// Auto-vinculación self-service de jugadores (socio autenticado)
membersRouter.post('/auth/link-player', memberAuth, validate(linkPlayerSchema), ctrl.linkPlayerByDni);
// Alta self-service: si el DNI existe vincula, si no crea solicitud PENDING
membersRouter.post('/auth/player-request', memberAuth, validate(createJoinRequestSchema), ctrl.createJoinRequest);
// Desvinculación con aprobación (socio autenticado)
membersRouter.post('/auth/unlink-request', memberAuth, validate(createUnlinkRequestSchema), ctrl.createUnlinkRequest);

// ── Admin CRUD ────────────────────────────────────────────────────────────────
membersRouter.use(authenticate);

// Solicitudes de alta de jugador (admin)
membersRouter.get('/join-requests', authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.listJoinRequests);
membersRouter.post('/join-requests/:id/approve', authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.approveJoinRequest);
membersRouter.post('/join-requests/:id/reject', authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.rejectJoinRequest);

// Solicitudes de desvinculación (admin)
membersRouter.get('/unlink-requests', authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.listUnlinkRequests);
membersRouter.post('/unlink-requests/:id/approve', authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.approveUnlinkRequest);
membersRouter.post('/unlink-requests/:id/reject', authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.rejectUnlinkRequest);

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
