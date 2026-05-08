import { Router, Request, Response, NextFunction } from 'express';
import { PlayersController } from './players.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createPlayerSchema, updatePlayerSchema } from '@futbol/validations';
import { playerSubscriptionsService as subs } from './player-subscriptions.service';

const router = Router();
const ctrl = new PlayersController();

const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// ── Players CRUD ─────────────────────────────────────────────────────────────
router.get('/', ctrl.findAll);
router.get('/:id', ctrl.findById);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR', 'DELEGATE'), validate(createPlayerSchema), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR', 'DELEGATE'), validate(updatePlayerSchema), ctrl.update);
router.patch('/:id/toggle', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), ctrl.toggle);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.remove);

// ── Player Subscriptions (cuotas) ────────────────────────────────────────────
router.get('/subscriptions/all', authenticate, wrap(async (req, res) => {
  const { clubCategoryId, status, month, year } = req.query as Record<string, string>;
  const data = await subs.listAll({
    clubCategoryId,
    status,
    month: month ? Number(month) : undefined,
    year: year ? Number(year) : undefined,
  });
  res.json({ data });
}));

router.post('/subscriptions/bulk', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const result = await subs.createBulk(req.body);
  res.json({ data: result });
}));

router.patch('/subscriptions/:subId/send-link', authenticate, wrap(async (req, res) => {
  const data = await subs.sendPaymentLink(req.params.subId);
  res.json({ data });
}));

router.patch('/subscriptions/:subId/pay', authenticate, wrap(async (req, res) => {
  const data = await subs.markPaid(req.params.subId);
  res.json({ data });
}));

router.patch('/subscriptions/:subId/overdue', authenticate, wrap(async (req, res) => {
  const data = await subs.markOverdue(req.params.subId);
  res.json({ data });
}));

router.delete('/subscriptions/:subId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), wrap(async (req, res) => {
  await subs.remove(req.params.subId);
  res.status(204).send();
}));

router.get('/:id/subscriptions', authenticate, wrap(async (req, res) => {
  const data = await subs.listByPlayer(req.params.id);
  res.json({ data });
}));

router.post('/:id/subscriptions', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATOR'), wrap(async (req, res) => {
  const data = await subs.create(req.params.id, req.body);
  res.status(201).json({ data });
}));

export { router as playersRouter };
