import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSponsorSchema, updateSponsorSchema, createSponsorPlanSchema, updateSponsorPlanSchema } from '@futbol/validations';
import { sponsorsService as svc } from './sponsors.service';

const router = Router();

const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// ── Sponsor CRUD ────────────────────────────────────────────────────────────
router.get('/', authenticate, wrap(async (_req, res) => {
  const data = await svc.list();
  res.json({ data });
}));

router.get('/:id', authenticate, wrap(async (req, res) => {
  const data = await svc.getById(req.params.id);
  res.json({ data });
}));

router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createSponsorSchema), wrap(async (req, res) => {
  const data = await svc.create(req.body);
  res.status(201).json({ data });
}));

router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(updateSponsorSchema), wrap(async (req, res) => {
  const data = await svc.update(req.params.id, req.body);
  res.json({ data });
}));

router.patch('/:id/toggle', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), wrap(async (req, res) => {
  const data = await svc.toggle(req.params.id);
  res.json({ data });
}));

router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), wrap(async (req, res) => {
  await svc.remove(req.params.id);
  res.status(204).send();
}));

// ── Sponsor Plans ───────────────────────────────────────────────────────────
router.get('/:sponsorId/plans', authenticate, wrap(async (req, res) => {
  const data = await svc.listPlans(req.params.sponsorId);
  res.json({ data });
}));

router.post('/:sponsorId/plans', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createSponsorPlanSchema), wrap(async (req, res) => {
  const data = await svc.createPlan(req.params.sponsorId, req.body);
  res.status(201).json({ data });
}));

router.put('/plans/:planId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(updateSponsorPlanSchema), wrap(async (req, res) => {
  const data = await svc.updatePlan(req.params.planId, req.body);
  res.json({ data });
}));

router.delete('/plans/:planId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), wrap(async (req, res) => {
  await svc.removePlan(req.params.planId);
  res.status(204).send();
}));

export { router as sponsorsRouter };
